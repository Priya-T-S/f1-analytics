// Driver photos and constructor logos from Wikipedia / Wikidata.
// Recent drivers get official F1 headshots from OpenF1 instead (see openf1.js).
const { createClient } = require('./http');
const jolpica = require('./jolpica');
const { query, batch } = require('../models/query');
const { chunk } = require('./util');

// Wikimedia asks API clients to identify themselves with a descriptive User-Agent.
const USER_AGENT = 'F1AnalyticsDBMS/1.0 (https://github.com/Priya-T-S/dbms)';
const clients = new Map();
const wikiClient = (origin) => {
  if (!clients.has(origin)) {
    clients.set(origin, createClient({
      baseUrl: `${origin}/w/api.php`, perSecond: 2, perMinute: 60, headers: { 'User-Agent': USER_AGENT },
    }));
  }
  return clients.get(origin);
};

const TITLES_PER_REQUEST = 50; // MediaWiki API limit
const commonsFile = (file) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=400`;

function parseWikiUrl(url) {
  try {
    const u = new URL(url.replace(/^http:/, 'https:'));
    const title = decodeURIComponent(u.pathname.split('/wiki/')[1] || '').replace(/_/g, ' ');
    return title ? { origin: u.origin, title } : null;
  } catch {
    return null;
  }
}

// For each article title: its lead image (thumbnail + file name) and its Wikidata item id.
async function fetchPageInfo(origin, titles) {
  const data = await wikiClient(origin)(`?${new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', redirects: '1',
    prop: 'pageimages|pageprops', piprop: 'thumbnail|name', pithumbsize: '400', ppprop: 'wikibase_item',
    // Include non-free ("fair use") lead images: most photos of 1950s-80s drivers are licensed that way.
    pilicense: 'any',
    titles: titles.join('|'),
  })}`);
  // Follow the API's title normalisation and redirects back to the titles we asked for.
  const renamed = new Map([...(data.query?.normalized || []), ...(data.query?.redirects || [])].map((r) => [r.from, r.to]));
  const pages = new Map((data.query?.pages || []).map((p) => [p.title, p]));
  const info = new Map();
  for (const t of titles) {
    let current = t;
    for (let i = 0; i < 3 && renamed.has(current); i++) current = renamed.get(current);
    const page = pages.get(current);
    if (!page) continue;
    info.set(t, { thumb: page.thumbnail?.source || null, file: page.pageimage || null, qid: page.pageprops?.wikibase_item || null });
  }
  return info;
}

// Commons file names for one Wikidata property (P18 = image, P154 = logo image), keyed by item id.
async function fetchWikidataFiles(qids, property) {
  const files = new Map();
  for (const group of chunk([...new Set(qids)], 50)) {
    const data = await wikiClient('https://www.wikidata.org')(`?${new URLSearchParams({
      action: 'wbgetentities', format: 'json', props: 'claims', ids: group.join('|'),
    })}`);
    for (const qid of group) {
      const file = data.entities?.[qid]?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
      if (file) files.set(qid, file);
    }
  }
  return files;
}

const looksLikeLogo = (file) => /logo|\.svg$/i.test(file || '');

const KINDS = {
  drivers: {
    table: 'drivers', id: 'driver_id', ref: 'driver_ref', image: 'image_url',
    listAll: () => jolpica.getAllDrivers(), refOf: (d) => d.driverId,
    // Article lead image, else the Wikidata photo.
    wikidataProperty: 'P18',
    pick: (page, wikidataFile) => page.thumb || (wikidataFile && commonsFile(wikidataFile)),
  },
  constructors: {
    table: 'constructors', id: 'constructor_id', ref: 'constructor_ref', image: 'logo_url',
    listAll: () => jolpica.getAllConstructors(), refOf: (c) => c.constructorId,
    // A lead image that is a logo, else the Wikidata logo, else whatever the lead image is (often a car).
    wikidataProperty: 'P154',
    pick: (page, wikidataFile) => (looksLikeLogo(page.file) && page.thumb)
      || (wikidataFile && commonsFile(wikidataFile))
      || page.thumb,
  },
};

// Databases filled before wiki_url existed: take the links from Jolpica's full lists.
async function fillMissingWikiUrls(kind) {
  const [{ missing }] = await query(`SELECT COUNT(*) AS missing FROM ${kind.table} WHERE wiki_url IS NULL`);
  if (!missing) return;
  const items = (await kind.listAll()).filter((x) => x.url);
  for (const group of chunk(items, 200)) {
    await batch(group.map((x) => ({
      sql: `UPDATE ${kind.table} SET wiki_url = ? WHERE ${kind.ref} = ? AND wiki_url IS NULL`,
      args: [x.url, kind.refOf(x)],
    })));
  }
}

async function fillImages(kindName, { fetchWikiUrls = true } = {}) {
  const kind = KINDS[kindName];
  if (fetchWikiUrls) await fillMissingWikiUrls(kind);

  const rows = await query(
    `SELECT ${kind.id} AS id, wiki_url FROM ${kind.table} WHERE ${kind.image} IS NULL AND wiki_url IS NOT NULL`
  );
  const byOrigin = new Map();
  for (const row of rows) {
    const parsed = parseWikiUrl(row.wiki_url);
    if (!parsed) continue;
    if (!byOrigin.has(parsed.origin)) byOrigin.set(parsed.origin, []);
    byOrigin.get(parsed.origin).push({ ...row, title: parsed.title });
  }

  const updates = [];
  for (const [origin, list] of byOrigin) {
    for (const group of chunk(list, TITLES_PER_REQUEST)) {
      try {
        const pages = await fetchPageInfo(origin, group.map((r) => r.title));
        const qids = [...pages.values()].map((p) => p.qid).filter(Boolean);
        const wikidataFiles = qids.length ? await fetchWikidataFiles(qids, kind.wikidataProperty) : new Map();
        for (const row of group) {
          const page = pages.get(row.title);
          const src = page && kind.pick(page, wikidataFiles.get(page.qid));
          if (src) updates.push({ sql: `UPDATE ${kind.table} SET ${kind.image} = ? WHERE ${kind.id} = ?`, args: [src, row.id] });
        }
      } catch (err) {
        console.warn(`  Wikipedia images failed for ${group.length} ${kindName}: ${err.message}`);
      }
    }
  }
  for (const group of chunk(updates, 200)) await batch(group);

  const [{ total, withImage }] = await query(
    `SELECT COUNT(*) AS total, COUNT(${kind.image}) AS withImage FROM ${kind.table}`
  );
  return { added: updates.length, withImage, total };
}

const fillDriverImages = (opts) => fillImages('drivers', opts);
const fillConstructorLogos = (opts) => fillImages('constructors', opts);

async function fillAllImages(opts) {
  return { drivers: await fillDriverImages(opts), constructors: await fillConstructorLogos(opts) };
}

module.exports = { fillDriverImages, fillConstructorLogos, fillAllImages };

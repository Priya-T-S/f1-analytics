// Driver photos from each driver's Wikipedia article (the article's lead image).
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

function parseWikiUrl(url) {
  try {
    const u = new URL(url.replace(/^http:/, 'https:'));
    const title = decodeURIComponent(u.pathname.split('/wiki/')[1] || '').replace(/_/g, ' ');
    return title ? { origin: u.origin, title } : null;
  } catch {
    return null;
  }
}

// Databases filled before wiki_url existed: take the links from Jolpica's driver list.
async function fillMissingWikiUrls() {
  const [{ missing }] = await query('SELECT COUNT(*) AS missing FROM drivers WHERE wiki_url IS NULL');
  if (!missing) return 0;
  const drivers = (await jolpica.getAllDrivers()).filter((d) => d.url);
  await batch(drivers.map((d) => ({
    sql: 'UPDATE drivers SET wiki_url = ? WHERE driver_ref = ? AND wiki_url IS NULL',
    args: [d.url, d.driverId],
  })));
  return missing;
}

async function fetchThumbnails(origin, titles) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', redirects: '1',
    prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', titles: titles.join('|'),
    // Include non-free ("fair use") lead images: most photos of 1950s-80s drivers are licensed that way.
    pilicense: 'any',
  });
  const data = await wikiClient(origin)(`?${params}`);
  // Follow the API's title normalisation and redirects back to the titles we asked for.
  const renamed = new Map();
  for (const step of [...(data.query?.normalized || []), ...(data.query?.redirects || [])]) {
    renamed.set(step.from, step.to);
  }
  const finalTitle = (t) => {
    let current = t;
    for (let i = 0; i < 3 && renamed.has(current); i++) current = renamed.get(current);
    return current;
  };
  const thumbByTitle = new Map((data.query?.pages || [])
    .filter((p) => p.thumbnail?.source)
    .map((p) => [p.title, p.thumbnail.source]));
  return new Map(titles.map((t) => [t, thumbByTitle.get(finalTitle(t))]).filter(([, src]) => src));
}

// Fallback for articles without a lead image: the free Commons photo on the driver's Wikidata item (P18).
async function fetchWikidataImages(origin, titles) {
  const qidByTitle = new Map();
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', redirects: '1',
    prop: 'pageprops', ppprop: 'wikibase_item', titles: titles.join('|'),
  });
  const data = await wikiClient(origin)(`?${params}`);
  const renamed = new Map([...(data.query?.normalized || []), ...(data.query?.redirects || [])].map((r) => [r.from, r.to]));
  const qidByFinal = new Map((data.query?.pages || [])
    .filter((p) => p.pageprops?.wikibase_item)
    .map((p) => [p.title, p.pageprops.wikibase_item]));
  for (const t of titles) {
    let current = t;
    for (let i = 0; i < 3 && renamed.has(current); i++) current = renamed.get(current);
    if (qidByFinal.has(current)) qidByTitle.set(t, qidByFinal.get(current));
  }
  if (!qidByTitle.size) return new Map();

  const entities = await wikiClient('https://www.wikidata.org')(`?${new URLSearchParams({
    action: 'wbgetentities', format: 'json', props: 'claims', ids: [...new Set(qidByTitle.values())].join('|'),
  })}`);
  const result = new Map();
  for (const [title, qid] of qidByTitle) {
    const file = entities.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (file) result.set(title, `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=400`);
  }
  return result;
}

async function fillDriverImages({ fetchWikiUrls = true } = {}) {
  if (fetchWikiUrls) await fillMissingWikiUrls();

  const drivers = await query('SELECT driver_id, wiki_url FROM drivers WHERE image_url IS NULL AND wiki_url IS NOT NULL');
  const byOrigin = new Map();
  for (const d of drivers) {
    const parsed = parseWikiUrl(d.wiki_url);
    if (!parsed) continue;
    if (!byOrigin.has(parsed.origin)) byOrigin.set(parsed.origin, []);
    byOrigin.get(parsed.origin).push({ ...d, title: parsed.title });
  }

  const updates = [];
  for (const [origin, list] of byOrigin) {
    for (const group of chunk(list, TITLES_PER_REQUEST)) {
      try {
        const thumbs = await fetchThumbnails(origin, group.map((d) => d.title));
        const withoutLead = group.filter((d) => !thumbs.has(d.title)).map((d) => d.title);
        if (withoutLead.length) {
          for (const [title, src] of await fetchWikidataImages(origin, withoutLead)) thumbs.set(title, src);
        }
        for (const d of group) {
          if (thumbs.has(d.title)) {
            updates.push({ sql: 'UPDATE drivers SET image_url = ? WHERE driver_id = ?', args: [thumbs.get(d.title), d.driver_id] });
          }
        }
      } catch (err) {
        console.warn(`  Wikipedia images failed for ${group.length} drivers: ${err.message}`);
      }
    }
  }
  for (const group of chunk(updates, 200)) await batch(group);

  const [{ total, withImage }] = await query(
    'SELECT COUNT(*) AS total, COUNT(image_url) AS withImage FROM drivers'
  );
  return { added: updates.length, withImage, total };
}

module.exports = { fillDriverImages };

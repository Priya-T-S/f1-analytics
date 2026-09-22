// Pulls races that finished since the last run from the Jolpica API (plus OpenF1 extras).
// Used by the Vercel cron endpoint and `npm run sync`. Safe to run any number of times.
const jolpica = require('./jolpica');
const store = require('./store');
const { enrichMissing } = require('./openf1');
const { fillAllImages } = require('./images');
const { query } = require('../models/query');
const { toMs, int, num, today } = require('./util');

const driverFromApi = (d) => ({
  ref: d.driverId, firstName: d.givenName, lastName: d.familyName, nationality: d.nationality,
  dob: d.dateOfBirth || null, number: int(d.permanentNumber), code: d.code || null, wikiUrl: d.url || null,
});
const constructorFromApi = (c) => ({ ref: c.constructorId, name: c.name, nationality: c.nationality, wikiUrl: c.url || null });
const circuitFromApi = (c) => ({
  ref: c.circuitId, name: c.circuitName, location: c.Location?.locality, country: c.Location?.country,
  lat: num(c.Location?.lat), lng: num(c.Location?.long),
});

async function syncSchedule() {
  const schedule = await jolpica.getSchedule('current');
  const year = int(schedule.season);
  await store.upsertSeasons([year]);
  await store.upsertCircuits(schedule.Races.map((r) => circuitFromApi(r.Circuit)));
  const seasonId = (await store.seasonIds()).get(year);
  const circuitIds = await store.circuitIds();
  await store.upsertRaces(schedule.Races.map((r) => ({
    seasonId, circuitId: circuitIds.get(r.Circuit.circuitId), round: int(r.round), name: r.raceName,
    date: r.date, time: r.time || null, url: r.url || null, scheduledLaps: null,
  })));
  // Drop rounds that were removed from the calendar (only ones without results).
  await query(
    `DELETE FROM races WHERE season_id = ? AND round_number > ?
       AND NOT EXISTS (SELECT 1 FROM race_results rr WHERE rr.race_id = races.race_id)`,
    [seasonId, schedule.Races.length]
  );
  return { year, seasonId };
}

// Returns false when Jolpica has not published the results yet.
async function syncRace(race, { withLaps }) {
  const apiRace = await jolpica.getRaceResults(race.year, race.round_number);
  if (!apiRace?.Results?.length) return false;

  await store.upsertDrivers(apiRace.Results.map((r) => driverFromApi(r.Driver)));
  await store.upsertConstructors(apiRace.Results.map((r) => constructorFromApi(r.Constructor)));
  const driverIds = await store.driverIds();
  const constructorIds = await store.constructorIds();

  const results = apiRace.Results.map((r) => [
    race.race_id, driverIds.get(r.Driver.driverId), constructorIds.get(r.Constructor.constructorId),
    int(r.grid), /^\d+$/.test(r.positionText) ? int(r.position) : null, int(r.position),
    num(r.points) || 0, int(r.laps) || 0, r.Time?.time || null,
    r.FastestLap?.rank === '1' ? 1 : 0, r.FastestLap?.Time?.time || null, r.status,
  ]);

  const data = { results };
  if (withLaps) {
    const laps = await jolpica.getLaps(race.year, race.round_number);
    data.laps = laps.flatMap((lap) => lap.timings
      .filter((t) => driverIds.has(t.driverId))
      .map((t) => [race.race_id, driverIds.get(t.driverId), int(lap.number), int(t.position), t.time, toMs(t.time)]));
    const pitStops = await jolpica.getPitStops(race.year, race.round_number);
    data.pitStops = pitStops
      .filter((p) => driverIds.has(p.driverId))
      .map((p) => {
        const ms = toMs(p.duration);
        return [race.race_id, driverIds.get(p.driverId), int(p.stop), int(p.lap), ms === null ? null : ms / 1000, ms, p.time || null];
      });
  }
  await store.replaceRaceData(race.race_id, data);

  const winner = apiRace.Results.find((r) => r.position === '1');
  if (winner) await query('UPDATE races SET scheduled_laps = ? WHERE race_id = ?', [int(winner.laps), race.race_id]);

  const [driverStandings, constructorStandings] = [
    await jolpica.getDriverStandings(race.year, race.round_number),
    await jolpica.getConstructorStandings(race.year, race.round_number),
  ];
  await store.replaceStandings(
    race.season_id, race.round_number,
    driverStandings.filter((s) => driverIds.has(s.Driver.driverId))
      .map((s) => [race.season_id, driverIds.get(s.Driver.driverId), race.round_number, num(s.points) || 0, int(s.position), int(s.wins) || 0]),
    constructorStandings.filter((s) => constructorIds.has(s.Constructor.constructorId))
      .map((s) => [race.season_id, constructorIds.get(s.Constructor.constructorId), race.round_number, num(s.points) || 0, int(s.position), int(s.wins) || 0]),
  );
  return true;
}

const RACE_COLUMNS = `r.race_id, r.season_id, r.circuit_id, r.round_number, r.name, r.race_date, s.year`;

async function runIncremental({ maxRaces = 2, timeBudgetMs = 50000 } = {}) {
  const deadline = Date.now() + timeBudgetMs;
  const { year } = await syncSchedule();

  // Finished races (this season or last) that have no results stored yet.
  const pending = await query(
    `SELECT ${RACE_COLUMNS} FROM races r JOIN seasons s ON s.season_id = r.season_id
     WHERE s.year >= ? AND r.race_date < ?
       AND NOT EXISTS (SELECT 1 FROM race_results rr WHERE rr.race_id = r.race_id)
     ORDER BY r.race_date LIMIT ?`,
    [year - 1, today(), maxRaces]
  );
  // Re-check the latest race for a week afterwards: stewards' penalties can change results.
  const recent = await query(
    `SELECT ${RACE_COLUMNS} FROM races r JOIN seasons s ON s.season_id = r.season_id
     WHERE r.race_date < ? AND r.race_date >= date(?, '-7 days')
       AND EXISTS (SELECT 1 FROM race_results rr WHERE rr.race_id = r.race_id)
     ORDER BY r.race_date DESC LIMIT 1`,
    [today(), today()]
  );

  const synced = [];
  const notPublished = [];
  for (const race of pending) {
    if (Date.now() > deadline) break;
    if (await syncRace(race, { withLaps: true })) synced.push(race);
    else notPublished.push(`${race.year} ${race.name}`);
  }
  for (const race of recent) {
    if (Date.now() > deadline) break;
    await syncRace(race, { withLaps: false });
  }

  const touched = [...synced, ...recent];
  if (touched.length) {
    await store.refreshSeasons(year - 1);
    await store.refreshLapRecords([...new Set(touched.map((r) => r.circuit_id))]);
  }

  const openf1 = await enrichMissing({ max: 2, deadline });

  // Photos and logos for drivers/teams new this week (their Wikipedia links come with the race results).
  if (synced.length && Date.now() < deadline) {
    try {
      await fillAllImages({ fetchWikiUrls: false });
    } catch (err) {
      console.warn(`  Photos/logos failed: ${err.message}`);
    }
  }

  const summary = {
    at: new Date().toISOString(),
    source: 'jolpica-api',
    synced: synced.map((r) => `${r.year} ${r.name}`),
    rechecked: recent.map((r) => `${r.year} ${r.name}`),
    notPublishedYet: notPublished,
    openf1: openf1.enriched,
  };
  await store.setState('last_sync', summary);
  if (synced.length) {
    const last = synced[synced.length - 1];
    await store.setState('last_race', { race_id: last.race_id, name: last.name, year: last.year, date: last.race_date });
  }
  return summary;
}

module.exports = { runIncremental };

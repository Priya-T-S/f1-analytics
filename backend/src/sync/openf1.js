// OpenF1 (https://openf1.org) enrichment for 2023+ races: sector times, tyre stints, weather, headshots.
// Historical data is free and needs no API key.
const { createClient } = require('./http');
const { query, batch } = require('../models/query');
const { chunk } = require('./util');

// Free tier limits: 3 req/s and 30 req/min.
const getJson = createClient({ baseUrl: 'https://api.openf1.org/v1', perSecond: 2, perMinute: 28 });

const FIRST_YEAR = 2023;
const NOT_FOUND = -1; // stored in races.openf1_session_key when OpenF1 has no such session

const sessionsByYear = new Map();
async function findRaceSession(year, raceDate) {
  if (!sessionsByYear.has(year)) {
    sessionsByYear.set(year, await getJson(`/sessions?year=${year}&session_name=Race`));
  }
  const target = new Date(`${raceDate}T12:00:00Z`).getTime();
  return sessionsByYear.get(year).find(
    (s) => Math.abs(new Date(s.date_start).getTime() - target) < 36 * 3600 * 1000
  ) || null;
}

async function enrichRace(race) {
  const session = await findRaceSession(race.year, race.race_date);
  if (!session) {
    // Leave recent races for a retry; give up on older ones.
    const ageDays = (Date.now() - new Date(race.race_date).getTime()) / 86400000;
    if (ageDays > 5) await query('UPDATE races SET openf1_session_key = ? WHERE race_id = ?', [NOT_FOUND, race.race_id]);
    return false;
  }
  const key = session.session_key;
  const [openf1Drivers, laps, stints, weather] = [
    await getJson(`/drivers?session_key=${key}`),
    await getJson(`/laps?session_key=${key}`),
    await getJson(`/stints?session_key=${key}`),
    await getJson(`/weather?session_key=${key}`),
  ];

  // Match OpenF1 car numbers to our drivers via the three-letter code of this race's entrants.
  const entrants = await query(
    `SELECT d.driver_id, d.code, UPPER(d.last_name) AS last_name, d.image_url
     FROM race_results rr JOIN drivers d ON d.driver_id = rr.driver_id WHERE rr.race_id = ?`,
    [race.race_id]
  );
  const byNumber = new Map();
  const statements = [];
  for (const d of openf1Drivers) {
    const match = entrants.find((e) => e.code === d.name_acronym)
      || entrants.find((e) => e.last_name === (d.last_name || '').toUpperCase());
    if (!match) continue;
    byNumber.set(d.driver_number, match.driver_id);
    if (d.headshot_url && match.image_url !== d.headshot_url) {
      statements.push({ sql: 'UPDATE drivers SET image_url = ? WHERE driver_id = ?', args: [d.headshot_url, match.driver_id] });
    }
  }

  const ms = (seconds) => (seconds === null || seconds === undefined ? null : Math.round(seconds * 1000));
  const sectorRows = laps
    .filter((l) => byNumber.has(l.driver_number))
    .map((l) => [race.race_id, byNumber.get(l.driver_number), l.lap_number,
      ms(l.duration_sector_1), ms(l.duration_sector_2), ms(l.duration_sector_3), l.st_speed ?? null]);
  const stintRows = stints
    .filter((s) => byNumber.has(s.driver_number))
    .map((s) => [race.race_id, byNumber.get(s.driver_number), s.stint_number, s.compound,
      s.lap_start, s.lap_end, s.tyre_age_at_start]);

  const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
  const rain = weather.some((w) => w.rainfall > 0) ? 1 : 0;

  statements.push(
    { sql: 'DELETE FROM lap_sectors WHERE race_id = ?', args: [race.race_id] },
    ...chunk(sectorRows, 100).map((rows) => ({
      sql: `INSERT OR REPLACE INTO lap_sectors (race_id, driver_id, lap, sector1_ms, sector2_ms, sector3_ms, speed_trap)
            VALUES ${rows.map(() => '(?,?,?,?,?,?,?)').join(',')}`,
      args: rows.flat(),
    })),
    { sql: 'DELETE FROM tyre_stints WHERE race_id = ?', args: [race.race_id] },
    ...chunk(stintRows, 100).map((rows) => ({
      sql: `INSERT OR REPLACE INTO tyre_stints (race_id, driver_id, stint, compound, lap_start, lap_end, tyre_age_at_start)
            VALUES ${rows.map(() => '(?,?,?,?,?,?,?)').join(',')}`,
      args: rows.flat(),
    })),
    {
      sql: `INSERT OR REPLACE INTO race_weather (race_id, avg_air_temp, avg_track_temp, rain) VALUES (?,?,?,?)`,
      args: [race.race_id, avg(weather.map((w) => w.air_temperature)), avg(weather.map((w) => w.track_temperature)), rain],
    },
    {
      sql: 'UPDATE races SET openf1_session_key = ?, weather_condition = ? WHERE race_id = ?',
      args: [key, rain ? 'Wet' : 'Dry', race.race_id],
    },
  );
  await batch(statements);
  return true;
}

// Enriches races (2023+) that have results but no OpenF1 data yet.
async function enrichMissing({ max = Infinity, deadline = Infinity } = {}) {
  const races = await query(
    `SELECT r.race_id, r.race_date, r.name, s.year
     FROM races r JOIN seasons s ON s.season_id = r.season_id
     WHERE s.year >= ? AND r.openf1_session_key IS NULL
       AND EXISTS (SELECT 1 FROM race_results rr WHERE rr.race_id = r.race_id)
     ORDER BY r.race_date`,
    [FIRST_YEAR]
  );
  const done = [];
  for (const race of races.slice(0, max)) {
    if (Date.now() > deadline) break;
    try {
      if (await enrichRace(race)) {
        done.push(`${race.year} ${race.name}`);
        console.log(`  OpenF1: ${race.year} ${race.name}`);
      }
    } catch (err) {
      console.warn(`  OpenF1 failed for ${race.year} ${race.name}: ${err.message}`);
    }
  }
  return { enriched: done, remaining: races.length - done.length };
}

module.exports = { enrichMissing, enrichRace };

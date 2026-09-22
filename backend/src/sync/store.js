// Database writes shared by the dump backfill, the incremental API sync and OpenF1.
const db = require('../config/db');
const { query, batch } = require('../models/query');
const { chunk } = require('./util');

const ROWS_PER_STATEMENT = 100;
const STATEMENTS_PER_BATCH = db.isRemote ? 20 : 100;
// Over the network most time is spent waiting on round trips, so keep several batches in flight.
const PARALLEL_BATCHES = db.isRemote ? Number(process.env.SYNC_PARALLEL || 8) : 1;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function batchWithRetry(statements, attempts = 5) {
  for (let i = 1; ; i++) {
    try {
      return await batch(statements);
    } catch (err) {
      if (i >= attempts) throw err;
      console.warn(`  batch failed (${err.message}), retrying ${i}/${attempts - 1}...`);
      await sleep(1000 * 2 ** i);
    }
  }
}

function insertStatements(verb, table, columns, rows, suffix = '') {
  const placeholders = `(${columns.map(() => '?').join(',')})`;
  return chunk(rows, ROWS_PER_STATEMENT).map((group) => ({
    sql: `${verb} INTO ${table} (${columns.join(',')}) VALUES ${group.map(() => placeholders).join(',')} ${suffix}`,
    args: group.flat(),
  }));
}

async function runStatements(statements, label) {
  const groups = chunk(statements, STATEMENTS_PER_BATCH);
  const started = Date.now();
  let next = 0;
  let done = 0;
  let lastReported = -1;

  const worker = async () => {
    while (next < groups.length) {
      await batchWithRetry(groups[next++]);
      done++;
      const pct = Math.floor((done / groups.length) * 20) * 5;
      if (label && groups.length > 1 && pct !== lastReported) {
        lastReported = pct;
        const secs = Math.round((Date.now() - started) / 1000);
        console.log(`  ${label}: ${pct}% (${done}/${groups.length} batches, ${secs}s)`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_BATCHES, groups.length) }, worker));
}

// Child tables (results, laps, standings...) are plain replaces - nothing references them.
async function replaceRows(table, columns, rows, label) {
  await runStatements(insertStatements('INSERT OR REPLACE', table, columns, rows), label);
}

// ---------- reference entities (upserted by their Jolpica ref) ----------

async function upsertSeasons(years) {
  await runStatements(insertStatements('INSERT', 'seasons', ['year'], years.map((y) => [y]),
    'ON CONFLICT(year) DO NOTHING'));
}

async function upsertCircuits(circuits) {
  const rows = circuits.map((c) => [c.ref, c.name, c.location, c.country, c.lat, c.lng]);
  await runStatements(insertStatements('INSERT', 'circuits',
    ['circuit_ref', 'name', 'location', 'country', 'lat', 'lng'], rows,
    `ON CONFLICT(circuit_ref) DO UPDATE SET name = excluded.name, location = excluded.location,
       country = excluded.country, lat = excluded.lat, lng = excluded.lng`));
}

async function upsertDrivers(drivers) {
  const rows = drivers.map((d) => [d.ref, d.firstName, d.lastName, d.nationality, d.dob, d.number, d.code]);
  await runStatements(insertStatements('INSERT', 'drivers',
    ['driver_ref', 'first_name', 'last_name', 'nationality', 'date_of_birth', 'driver_number', 'code'], rows,
    `ON CONFLICT(driver_ref) DO UPDATE SET first_name = excluded.first_name, last_name = excluded.last_name,
       nationality = excluded.nationality, date_of_birth = excluded.date_of_birth,
       driver_number = COALESCE(excluded.driver_number, drivers.driver_number),
       code = COALESCE(excluded.code, drivers.code)`));
}

async function upsertConstructors(constructors) {
  const rows = constructors.map((c) => [c.ref, c.name, c.nationality, c.color || '#ffffff']);
  await runStatements(insertStatements('INSERT', 'constructors',
    ['constructor_ref', 'name', 'nationality', 'color'], rows,
    `ON CONFLICT(constructor_ref) DO UPDATE SET name = excluded.name, nationality = excluded.nationality,
       color = CASE WHEN excluded.color = '#ffffff' THEN constructors.color ELSE excluded.color END`));
}

async function upsertRaces(races) {
  const rows = races.map((r) => [r.seasonId, r.circuitId, r.round, r.name, r.date, r.time, r.url, r.scheduledLaps]);
  await runStatements(insertStatements('INSERT', 'races',
    ['season_id', 'circuit_id', 'round_number', 'name', 'race_date', 'race_time', 'url', 'scheduled_laps'], rows,
    `ON CONFLICT(season_id, round_number) DO UPDATE SET circuit_id = excluded.circuit_id, name = excluded.name,
       race_date = excluded.race_date, race_time = excluded.race_time, url = excluded.url,
       scheduled_laps = COALESCE(excluded.scheduled_laps, races.scheduled_laps)`));
}

async function refMap(table, refColumn, idColumn) {
  const rows = await query(`SELECT ${refColumn} AS ref, ${idColumn} AS id FROM ${table}`);
  return new Map(rows.map((r) => [r.ref, r.id]));
}

const seasonIds = () => refMap('seasons', 'year', 'season_id');
const circuitIds = () => refMap('circuits', 'circuit_ref', 'circuit_id');
const driverIds = () => refMap('drivers', 'driver_ref', 'driver_id');
const constructorIds = () => refMap('constructors', 'constructor_ref', 'constructor_id');

// "2023-22" -> race_id
async function raceIds() {
  const rows = await query(
    `SELECT s.year || '-' || r.round_number AS ref, r.race_id AS id
     FROM races r JOIN seasons s ON s.season_id = r.season_id`
  );
  return new Map(rows.map((r) => [r.ref, r.id]));
}

// ---------- per-race data ----------

const RESULT_COLUMNS = ['race_id', 'driver_id', 'constructor_id', 'grid_position', 'position', 'position_order',
  'points', 'laps_completed', 'time_retired', 'fastest_lap', 'fastest_lap_time', 'status'];
const LAP_COLUMNS = ['race_id', 'driver_id', 'lap', 'position', 'time', 'milliseconds'];
const PIT_COLUMNS = ['race_id', 'driver_id', 'stop_number', 'lap', 'duration', 'milliseconds', 'time_of_day'];
const DRIVER_STANDING_COLUMNS = ['season_id', 'driver_id', 'round', 'points', 'position', 'wins'];
const CONSTRUCTOR_STANDING_COLUMNS = ['season_id', 'constructor_id', 'round', 'points', 'position', 'wins'];

// Replaces everything stored for one race in a single transaction.
async function replaceRaceData(raceId, { results, laps, pitStops }) {
  const statements = [];
  if (results) {
    statements.push({ sql: 'DELETE FROM race_results WHERE race_id = ?', args: [raceId] });
    statements.push(...insertStatements('INSERT', 'race_results', RESULT_COLUMNS, results));
  }
  if (laps) {
    statements.push({ sql: 'DELETE FROM lap_times WHERE race_id = ?', args: [raceId] });
    statements.push(...insertStatements('INSERT', 'lap_times', LAP_COLUMNS, laps));
  }
  if (pitStops) {
    statements.push({ sql: 'DELETE FROM pit_stops WHERE race_id = ?', args: [raceId] });
    statements.push(...insertStatements('INSERT', 'pit_stops', PIT_COLUMNS, pitStops));
  }
  await batch(statements);
}

async function replaceStandings(seasonId, round, driverRows, constructorRows) {
  await batch([
    { sql: 'DELETE FROM driver_standings WHERE season_id = ? AND round = ?', args: [seasonId, round] },
    { sql: 'DELETE FROM constructor_standings WHERE season_id = ? AND round = ?', args: [seasonId, round] },
    ...insertStatements('INSERT', 'driver_standings', DRIVER_STANDING_COLUMNS, driverRows),
    ...insertStatements('INSERT', 'constructor_standings', CONSTRUCTOR_STANDING_COLUMNS, constructorRows),
  ]);
}

// ---------- derived data ----------

// Race count per season, and champions once every race of the season has results.
async function refreshSeasons(fromYear = 0) {
  await query(
    `UPDATE seasons SET total_races = (SELECT COUNT(*) FROM races r WHERE r.season_id = seasons.season_id)
     WHERE year >= ?`, [fromYear]
  );
  const finalStanding = (table, idColumn) =>
    `(SELECT t.${idColumn} FROM ${table} t
      WHERE t.season_id = seasons.season_id AND t.position = 1
        AND t.round = (SELECT MAX(x.round) FROM ${table} x WHERE x.season_id = seasons.season_id))`;
  await query(
    `UPDATE seasons SET
       champion_driver_id = CASE WHEN complete THEN ${finalStanding('driver_standings', 'driver_id')} END,
       champion_constructor_id = CASE WHEN complete THEN ${finalStanding('constructor_standings', 'constructor_id')} END
     FROM (SELECT s.season_id AS sid,
                  COUNT(r.race_id) > 0 AND SUM(NOT EXISTS (
                    SELECT 1 FROM race_results rr WHERE rr.race_id = r.race_id)) = 0 AS complete
           FROM seasons s LEFT JOIN races r ON r.season_id = s.season_id
           GROUP BY s.season_id) c
     WHERE c.sid = seasons.season_id AND seasons.year >= ?`, [fromYear]
  );
}

// The fastest race lap ever set at each circuit (lap times exist from 1996).
async function refreshLapRecords(circuitIdList = null) {
  const filter = circuitIdList ? `WHERE circuit_id IN (${circuitIdList.map(() => '?').join(',')})` : '';
  await query(
    `UPDATE circuits SET (lap_record_time, lap_record_driver_id) = (
       SELECT lt.time, lt.driver_id FROM lap_times lt JOIN races r ON r.race_id = lt.race_id
       WHERE r.circuit_id = circuits.circuit_id AND lt.milliseconds > 0
       ORDER BY lt.milliseconds LIMIT 1)
     ${filter}`, circuitIdList || []
  );
}

async function setState(key, value) {
  await query(
    `INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, typeof value === 'string' ? value : JSON.stringify(value)]
  );
}

module.exports = {
  replaceRows, upsertSeasons, upsertCircuits, upsertDrivers, upsertConstructors, upsertRaces,
  seasonIds, circuitIds, driverIds, constructorIds, raceIds,
  replaceRaceData, replaceStandings, refreshSeasons, refreshLapRecords, setState,
  RESULT_COLUMNS, LAP_COLUMNS, PIT_COLUMNS, DRIVER_STANDING_COLUMNS, CONSTRUCTOR_STANDING_COLUMNS,
};

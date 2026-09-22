// One-time import of the full F1 history (1950 onwards) from the Jolpica CSV database dump.
// Run locally: `npm run sync:backfill` (optionally `-- --dir <extracted dump folder>`).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parse } = require('csv-parse');
const { parse: parseSync } = require('csv-parse/sync');
const store = require('./store');
const { toMs, formatMs, formatGap, int, num } = require('./util');

const DUMP_URL = 'https://api.jolpi.ca/data/dumps/download/delayed/?dump_type=csv';

async function downloadDump() {
  const AdmZip = require('adm-zip');
  const dir = path.join(os.tmpdir(), 'jolpica-f1-dump');
  console.log('Downloading the Jolpica database dump (~15 MB)...');
  const res = await fetch(DUMP_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Dump download failed with ${res.status}`);
  const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
  zip.extractAllTo(dir, true);
  return dir;
}

function readCsv(dir, name) {
  const text = fs.readFileSync(path.join(dir, `formula_one_${name}.csv`), 'utf8');
  return parseSync(text, { columns: true, skip_empty_lines: true });
}

async function* streamCsv(dir, name) {
  const parser = fs.createReadStream(path.join(dir, `formula_one_${name}.csv`)).pipe(parse({ columns: true }));
  for await (const row of parser) yield row;
}

const byId = (rows) => new Map(rows.map((r) => [r.id, r]));

async function backfill({ dir } = {}) {
  const dumpDir = dir || await downloadDump();
  console.log(`Reading dump from ${dumpDir}`);

  const seasons = byId(readCsv(dumpDir, 'season'));
  const circuits = byId(readCsv(dumpDir, 'circuit'));
  const drivers = byId(readCsv(dumpDir, 'driver'));
  const teams = byId(readCsv(dumpDir, 'team'));
  const rounds = byId(readCsv(dumpDir, 'round'));
  const roundEntries = byId(readCsv(dumpDir, 'roundentry'));
  const teamDrivers = byId(readCsv(dumpDir, 'teamdriver'));
  const raceSessions = readCsv(dumpDir, 'session').filter((s) => s.type === 'R' && s.is_cancelled !== 't');

  // ----- reference entities -----
  console.log('Importing seasons, circuits, drivers and constructors...');
  await store.upsertSeasons([...seasons.values()].map((s) => int(s.year)));
  await store.upsertCircuits([...circuits.values()].map((c) => ({
    ref: c.reference, name: c.name, location: c.locality, country: c.country,
    lat: num(c.latitude), lng: num(c.longitude),
  })));
  await store.upsertDrivers([...drivers.values()].map((d) => ({
    ref: d.reference, firstName: d.forename, lastName: d.surname, nationality: d.nationality,
    dob: d.date_of_birth || null, number: int(d.permanent_car_number), code: d.abbreviation || null,
    wikiUrl: d.wikipedia || null,
  })));
  await store.upsertConstructors([...teams.values()].map((t) => ({
    ref: t.reference, name: t.name, nationality: t.nationality, color: t.primary_color || null,
  })));

  const seasonIds = await store.seasonIds();
  const circuitIds = await store.circuitIds();
  const driverIds = await store.driverIds();
  const constructorIds = await store.constructorIds();
  const localDriver = (dumpDriverId) => driverIds.get(drivers.get(dumpDriverId)?.reference);
  const localConstructor = (dumpTeamId) => constructorIds.get(teams.get(dumpTeamId)?.reference);

  // ----- race results (session type R) -----
  const sessionToRound = new Map(raceSessions.map((s) => [s.id, s]));
  const entriesBySession = new Map();
  for (const e of readCsv(dumpDir, 'sessionentry')) {
    if (!sessionToRound.has(e.session_id)) continue;
    if (!entriesBySession.has(e.session_id)) entriesBySession.set(e.session_id, []);
    entriesBySession.get(e.session_id).push(e);
  }

  const races = [];
  for (const session of raceSessions) {
    const round = rounds.get(session.round_id);
    if (!round || round.is_cancelled === 't') continue;
    const winner = (entriesBySession.get(session.id) || []).find((e) => e.position === '1');
    races.push({
      seasonId: seasonIds.get(int(seasons.get(round.season_id).year)),
      circuitId: circuitIds.get(circuits.get(round.circuit_id).reference),
      round: int(round.number),
      name: round.name,
      date: round.date,
      time: session.timestamp ? `${session.timestamp.slice(11, 19)}Z` : null,
      url: round.wikipedia || null,
      scheduledLaps: winner ? int(winner.laps_completed) : null,
    });
  }
  console.log(`Importing ${races.length} races...`);
  await store.upsertRaces(races);
  const raceIds = await store.raceIds();

  // session entry id -> { raceId, driverId, constructorId }
  const entryInfo = new Map();
  for (const [sessionId, entries] of entriesBySession) {
    const round = rounds.get(sessionToRound.get(sessionId).round_id);
    const raceId = raceIds.get(`${seasons.get(round.season_id).year}-${round.number}`);
    if (!raceId) continue;
    for (const e of entries) {
      const teamDriver = teamDrivers.get(roundEntries.get(e.round_entry_id)?.team_driver_id);
      if (!teamDriver) continue;
      entryInfo.set(e.id, {
        raceId,
        driverId: localDriver(teamDriver.driver_id),
        constructorId: localConstructor(teamDriver.team_id),
      });
    }
  }

  // ----- lap times (streamed: ~700k rows) -----
  console.log('Reading lap times...');
  const lapRows = [];
  const lapNumberById = new Map();
  const fastestLapByEntry = new Map();
  for await (const lap of streamCsv(dumpDir, 'lap')) {
    const info = entryInfo.get(lap.session_entry_id);
    if (!info?.driverId) continue;
    const ms = toMs(lap.time);
    if (lap.is_entry_fastest_lap === 't') fastestLapByEntry.set(lap.session_entry_id, formatMs(ms));
    if (!lap.number) continue;
    lapNumberById.set(lap.id, int(lap.number));
    lapRows.push([info.raceId, info.driverId, int(lap.number), int(lap.position), formatMs(ms), ms]);
  }

  const resultRows = [];
  for (const entries of entriesBySession.values()) {
    const winner = entries.find((e) => e.position === '1');
    const winnerMs = winner ? toMs(winner.time) : null;
    // Best finish last, so it wins if a driver shared several cars in one race (1950s).
    const sorted = [...entries].sort((a, b) => (int(b.position) || 999) - (int(a.position) || 999));
    for (const e of sorted) {
      const info = entryInfo.get(e.id);
      if (!info?.driverId || !info.constructorId) continue;
      const ms = toMs(e.time);
      const laps = int(e.laps_completed) || 0;
      let timeRetired = null;
      if (e === winner && ms) timeRetired = formatMs(ms);
      else if (winner && ms && winnerMs && laps === int(winner.laps_completed)) timeRetired = formatGap(ms - winnerMs);
      else if (winner && e.is_classified === 't' && laps < int(winner.laps_completed)) {
        const down = int(winner.laps_completed) - laps;
        timeRetired = `+${down} Lap${down > 1 ? 's' : ''}`;
      }
      resultRows.push([
        info.raceId, info.driverId, info.constructorId, int(e.grid),
        e.is_classified === 't' ? int(e.position) : null, int(e.position) || 999,
        num(e.points) || 0, laps, timeRetired,
        e.fastest_lap_rank === '1' ? 1 : 0, fastestLapByEntry.get(e.id) || null, e.detail || 'Finished',
      ]);
    }
  }
  console.log(`Importing ${resultRows.length} race results...`);
  await store.replaceRows('race_results', store.RESULT_COLUMNS, resultRows, 'results');

  console.log(`Importing ${lapRows.length} lap times...`);
  await store.replaceRows('lap_times', store.LAP_COLUMNS, lapRows, 'lap times');
  lapRows.length = 0;

  // ----- pit stops -----
  const pitRows = [];
  for (const p of readCsv(dumpDir, 'pitstop')) {
    const info = entryInfo.get(p.session_entry_id);
    if (!info?.driverId) continue;
    const ms = toMs(p.duration);
    pitRows.push([info.raceId, info.driverId, int(p.number), lapNumberById.get(p.lap_id) ?? null,
      ms === null ? null : ms / 1000, ms, p.local_timestamp || null]);
  }
  console.log(`Importing ${pitRows.length} pit stops...`);
  await store.replaceRows('pit_stops', store.PIT_COLUMNS, pitRows, 'pit stops');

  // ----- standings: the dump stores them after every session; keep each round's last one -----
  const lastSessionOfRound = (rows) => {
    const last = new Map();
    for (const r of rows) {
      const key = `${r.year}-${r.round_number}`;
      last.set(key, Math.max(last.get(key) || 0, int(r.session_number)));
    }
    return rows.filter((r) => int(r.session_number) === last.get(`${r.year}-${r.round_number}`));
  };

  const driverStandingRows = lastSessionOfRound(readCsv(dumpDir, 'driverchampionship'))
    .map((r) => [seasonIds.get(int(r.year)), localDriver(r.driver_id), int(r.round_number),
      num(r.points) || 0, int(r.position), int(r.win_count) || 0])
    .filter((r) => r[0] && r[1]);
  console.log(`Importing ${driverStandingRows.length} driver standings...`);
  await store.replaceRows('driver_standings', store.DRIVER_STANDING_COLUMNS, driverStandingRows, 'driver standings');

  const constructorStandingRows = lastSessionOfRound(readCsv(dumpDir, 'teamchampionship'))
    .map((r) => [seasonIds.get(int(r.year)), localConstructor(r.team_id), int(r.round_number),
      num(r.points) || 0, int(r.position), int(r.win_count) || 0])
    .filter((r) => r[0] && r[1]);
  console.log(`Importing ${constructorStandingRows.length} constructor standings...`);
  await store.replaceRows('constructor_standings', store.CONSTRUCTOR_STANDING_COLUMNS, constructorStandingRows,
    'constructor standings');

  console.log('Computing champions and lap records...');
  await store.refreshSeasons();
  await store.refreshLapRecords();

  console.log('Fetching driver photos from Wikipedia...');
  const { fillDriverImages } = require('./images');
  console.log('  ', await fillDriverImages());

  await store.setState('last_sync', { at: new Date().toISOString(), source: 'jolpica-dump' });

  return { races: races.length, results: resultRows.length, pitStops: pitRows.length };
}

module.exports = { backfill };

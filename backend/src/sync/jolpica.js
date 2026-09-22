// Jolpica-F1 (Ergast-compatible) API: https://github.com/jolpica/jolpica-f1
const { createClient } = require('./http');

// Documented limits: 4 req/s burst, 500 req/hour sustained.
const getJson = createClient({ baseUrl: 'https://api.jolpi.ca/ergast/f1', perSecond: 3, perMinute: 60 });

const PAGE_SIZE = 100;

async function getSchedule(season = 'current') {
  const data = await getJson(`/${season}.json?limit=${PAGE_SIZE}`);
  return data.MRData.RaceTable;
}

async function getRaceResults(season, round) {
  const data = await getJson(`/${season}/${round}/results.json?limit=${PAGE_SIZE}`);
  return data.MRData.RaceTable.Races[0] || null;
}

// The laps endpoint pages by individual timings, so one race is ~12+ pages.
async function getLaps(season, round) {
  const laps = new Map();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const data = await getJson(`/${season}/${round}/laps.json?limit=${PAGE_SIZE}&offset=${offset}`);
    const race = data.MRData.RaceTable.Races[0];
    for (const lap of race?.Laps || []) {
      const existing = laps.get(lap.number) || [];
      laps.set(lap.number, existing.concat(lap.Timings));
    }
    if (offset + PAGE_SIZE >= Number(data.MRData.total)) break;
  }
  return [...laps.entries()].map(([number, timings]) => ({ number, timings }));
}

async function getPitStops(season, round) {
  const data = await getJson(`/${season}/${round}/pitstops.json?limit=${PAGE_SIZE}`);
  return data.MRData.RaceTable.Races[0]?.PitStops || [];
}

async function getDriverStandings(season, round) {
  const data = await getJson(`/${season}/${round}/driverStandings.json?limit=${PAGE_SIZE}`);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
}

async function getConstructorStandings(season, round) {
  const data = await getJson(`/${season}/${round}/constructorStandings.json?limit=${PAGE_SIZE}`);
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
}

async function getAllDrivers() {
  const drivers = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const data = await getJson(`/drivers.json?limit=${PAGE_SIZE}&offset=${offset}`);
    drivers.push(...data.MRData.DriverTable.Drivers);
    if (offset + PAGE_SIZE >= Number(data.MRData.total)) break;
  }
  return drivers;
}

module.exports = {
  getAllDrivers, getSchedule, getRaceResults, getLaps, getPitStops, getDriverStandings, getConstructorStandings,
};

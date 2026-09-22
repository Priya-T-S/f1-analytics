import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const getDrivers = (params) => api.get('/drivers', { params });
export const getDriver = (id) => api.get(`/drivers/${id}`);
export const getDriverStandings = (id) => api.get(`/drivers/${id}/standings`);
export const getDriverRaces = (id) => api.get(`/drivers/${id}/races`);
export const getHeadToHead = (d1, d2, year) =>
  api.get(`/drivers/head-to-head/${d1}/${d2}`, { params: { year } });

export const getConstructors = () => api.get('/constructors');
export const getConstructor = (id) => api.get(`/constructors/${id}`);
export const getConstructorStandings = (id, year) =>
  api.get(`/constructors/${id}/standings`, { params: { year } });

export const getCircuits = () => api.get('/circuits');
export const getCircuit = (id) => api.get(`/circuits/${id}`);
export const getCircuitWinners = (id) => api.get(`/circuits/${id}/winners`);

export const getRacesBySeason = (year) => api.get(`/races/season/${year}`);
export const getRace = (id) => api.get(`/races/${id}`);
export const getRaceResults = (id) => api.get(`/races/${id}/results`);
export const getRaceTyres = (id) => api.get(`/races/${id}/tyres`);
export const getRaceSectors = (id) => api.get(`/races/${id}/sectors`);

export const getSeasons = () => api.get('/seasons');
export const getSyncStatus = () => api.get('/sync/status');

export const getDriverStandingsBySeason = (year) =>
  api.get(`/standings/drivers/${year}`);
export const getConstructorStandingsBySeason = (year) =>
  api.get(`/standings/constructors/${year}`);
export const getCurrentStandings = () => api.get('/standings/current');
export const getPointsProgression = (year, top = 6) =>
  api.get(`/standings/progression/${year}`, { params: { top } });

export const getCareerStats = () => api.get('/stats/career');
export const getRecords = () => api.get('/stats/records');
export const getSeasonSummary = (year) => api.get(`/stats/season/${year}`);
export const getDriverComparison = (d1, d2) =>
  api.get('/stats/compare', { params: { d1, d2 } });

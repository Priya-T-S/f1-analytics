const { query } = require('../models/query');

const parseState = (row) => {
  if (!row) return null;
  try { return { ...JSON.parse(row.value), updated_at: row.updated_at }; } catch { return { value: row.value, updated_at: row.updated_at }; }
};

const getSeasons = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT s.year,
              COUNT(r.race_id) AS races,
              SUM(EXISTS (SELECT 1 FROM race_results rr WHERE rr.race_id = r.race_id)) AS completed
       FROM seasons s JOIN races r ON r.season_id = s.season_id
       GROUP BY s.season_id ORDER BY s.year DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getSyncStatus = async (req, res, next) => {
  try {
    const rows = await query(`SELECT key, value, updated_at FROM sync_state WHERE key IN ('last_sync', 'last_race')`);
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    res.json({ lastSync: parseState(byKey.last_sync), lastRace: parseState(byKey.last_race) });
  } catch (err) { next(err); }
};

// Called by Vercel Cron, which sends "Authorization: Bearer <CRON_SECRET>".
const runCronSync = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) return res.status(503).json({ error: 'CRON_SECRET is not configured' });
    if (req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });

    const { runIncremental } = require('../sync/incremental');
    const summary = await runIncremental({ maxRaces: 2, timeBudgetMs: 45000 });
    res.json(summary);
  } catch (err) { next(err); }
};

module.exports = { getSeasons, getSyncStatus, runCronSync };

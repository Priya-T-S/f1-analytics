const { query } = require('../models/query');

const getCareerStats = async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM v_driver_career_stats ORDER BY total_points DESC');
    res.json(rows);
  } catch (err) { next(err); }
};

const getSeasonSummary = async (req, res, next) => {
  try {
    const summary = await query(
      `SELECT s.year, s.total_races,
              cd.first_name || ' ' || cd.last_name AS champion_driver,
              cc.name AS champion_constructor
       FROM seasons s
       LEFT JOIN drivers cd ON s.champion_driver_id = cd.driver_id
       LEFT JOIN constructors cc ON s.champion_constructor_id = cc.constructor_id
       WHERE s.year = ?`,
      [req.params.year]
    );
    const raceCount = await query(
      `SELECT COUNT(*) AS count FROM races r JOIN seasons s ON r.season_id = s.season_id WHERE s.year = ?`,
      [req.params.year]
    );
    const mostWins = await query(
      `SELECT d.first_name || ' ' || d.last_name AS driver_name,
              SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) AS wins
       FROM race_results rr
       JOIN races r ON rr.race_id = r.race_id
       JOIN seasons s ON r.season_id = s.season_id
       JOIN drivers d ON rr.driver_id = d.driver_id
       WHERE s.year = ?
       GROUP BY d.driver_id
       ORDER BY wins DESC LIMIT 1`,
      [req.params.year]
    );
    const champTotal = summary[0];
    if (champTotal) champTotal.total_races = summary[0].total_races || raceCount[0].count;
    res.json({ summary: champTotal, raceCount: raceCount[0].count, mostWins: mostWins[0] || null });
  } catch (err) { next(err); }
};

const getRecords = async (req, res, next) => {
  try {
    const mostWins = await query(
      `SELECT driver_name, total_points, wins
       FROM v_driver_career_stats ORDER BY wins DESC LIMIT 10`
    );
    const mostPoles = await query(
      `SELECT d.first_name || ' ' || d.last_name AS driver_name,
              COUNT(*) AS poles
       FROM race_results rr JOIN drivers d ON rr.driver_id = d.driver_id
       WHERE rr.grid_position = 1
       GROUP BY d.driver_id ORDER BY poles DESC LIMIT 10`
    );
    const bestAvgFinish = await query(
      `SELECT d.first_name || ' ' || d.last_name AS driver_name,
              ROUND(AVG(rr.position), 2) AS avg_finish,
              COUNT(*) AS races
       FROM race_results rr JOIN drivers d ON rr.driver_id = d.driver_id
       WHERE rr.position IS NOT NULL
       GROUP BY d.driver_id HAVING races >= 20
       ORDER BY avg_finish ASC LIMIT 10`
    );
    res.json({ mostWins, mostPoles, bestAvgFinish });
  } catch (err) { next(err); }
};

const getDriverComparison = async (req, res, next) => {
  try {
    const { d1, d2 } = req.query;
    if (!d1 || !d2) return res.status(400).json({ error: 'Two driver IDs required (d1, d2)' });
    const rows = await query(
      `SELECT d.driver_id, d.first_name || ' ' || d.last_name AS driver_name,
              COUNT(DISTINCT rr.result_id) AS races,
              SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) AS wins,
              SUM(CASE WHEN rr.position <= 3 THEN 1 ELSE 0 END) AS podiums,
              SUM(CASE WHEN rr.grid_position = 1 THEN 1 ELSE 0 END) AS poles,
              SUM(rr.points) AS points
       FROM drivers d
       JOIN race_results rr ON d.driver_id = rr.driver_id
       WHERE d.driver_id IN (?, ?)
       GROUP BY d.driver_id`,
      [parseInt(d1), parseInt(d2)]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getCareerStats, getSeasonSummary, getRecords, getDriverComparison };

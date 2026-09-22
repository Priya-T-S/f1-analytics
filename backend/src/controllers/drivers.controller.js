const { query } = require('../models/query');

// Each driver's team in their most recent race.
const LATEST_TEAM = `
  SELECT driver_id, name, color, last_year FROM (
    SELECT rr.driver_id, co.name, co.color, s.year AS last_year,
           ROW_NUMBER() OVER (PARTITION BY rr.driver_id ORDER BY r.race_date DESC) AS rn
    FROM race_results rr
    JOIN races r ON rr.race_id = r.race_id
    JOIN seasons s ON r.season_id = s.season_id
    JOIN constructors co ON rr.constructor_id = co.constructor_id
  ) WHERE rn = 1`;

// The newest season that has at least one race result.
const LATEST_SEASON_YEAR = `
  SELECT MAX(s.year) FROM seasons s JOIN races r ON r.season_id = s.season_id
  WHERE EXISTS (SELECT 1 FROM race_results rr WHERE rr.race_id = r.race_id)`;

const getAllDrivers = async (req, res, next) => {
  try {
    const { nationality, current } = req.query;
    let sql = `SELECT d.*, c.name AS constructor, c.color AS constructor_color, c.last_year
               FROM drivers d
               LEFT JOIN (${LATEST_TEAM}) c ON d.driver_id = c.driver_id
               WHERE 1 = 1`;
    const params = [];
    if (nationality) {
      sql += ` AND d.nationality = ?`;
      params.push(nationality);
    }
    if (current) {
      sql += ` AND c.last_year = (${LATEST_SEASON_YEAR})`;
    }
    sql += ` ORDER BY d.last_name ASC`;
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

const getDriverById = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT d.*, c.name AS constructor, c.color AS constructor_color
       FROM drivers d
       LEFT JOIN (${LATEST_TEAM}) c ON d.driver_id = c.driver_id
       WHERE d.driver_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Driver not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const getDriverStandings = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT s.year, ds.position, ds.points, ds.wins
       FROM driver_standings ds
       JOIN seasons s ON ds.season_id = s.season_id
       WHERE ds.driver_id = ?
         AND ds.round = (SELECT MAX(round) FROM driver_standings sub WHERE sub.season_id = ds.season_id)
       ORDER BY s.year DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getDriverRaceHistory = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT r.race_id, r.name AS race_name, r.round_number, r.race_date,
              s.year, ci.name AS circuit_name,
              rr.position, rr.grid_position, rr.points, rr.status,
              rr.fastest_lap, c.name AS constructor_name
       FROM race_results rr
       JOIN races r ON rr.race_id = r.race_id
       JOIN seasons s ON r.season_id = s.season_id
       JOIN circuits ci ON r.circuit_id = ci.circuit_id
       JOIN constructors c ON rr.constructor_id = c.constructor_id
       WHERE rr.driver_id = ?
       ORDER BY r.race_date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getHeadToHead = async (req, res, next) => {
  try {
    const { d1, d2 } = req.params;
    const { year } = req.query;
    let sql = `SELECT r.race_id, r.name AS race_name, r.round_number, r.race_date,
                      MAX(CASE WHEN d.driver_id = ? THEN rr.position END) AS driver1_pos,
                      MAX(CASE WHEN d.driver_id = ? THEN rr.position END) AS driver2_pos
               FROM races r
               JOIN race_results rr ON r.race_id = rr.race_id
               JOIN drivers d ON rr.driver_id = d.driver_id
               JOIN seasons s ON r.season_id = s.season_id
               WHERE d.driver_id IN (?, ?)`;
    const params = [parseInt(d1), parseInt(d2), parseInt(d1), parseInt(d2)];
    if (year) {
      sql += ` AND s.year = ?`;
      params.push(parseInt(year));
    }
    sql += ` GROUP BY r.race_id ORDER BY r.round_number`;
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = {
  getAllDrivers, getDriverById, getDriverStandings,
  getDriverRaceHistory, getHeadToHead
};

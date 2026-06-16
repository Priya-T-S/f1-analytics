const { query } = require('../models/query');

const getAllDrivers = async (req, res, next) => {
  try {
    const { nationality } = req.query;
    let sql = `SELECT d.*, c.name AS constructor, c.color AS constructor_color
               FROM drivers d
               LEFT JOIN (
                 SELECT rr.driver_id, co.name, co.color
                 FROM race_results rr
                 JOIN constructors co ON rr.constructor_id = co.constructor_id
                 JOIN races r ON rr.race_id = r.race_id
                 WHERE r.season_id = (SELECT MAX(season_id) FROM seasons)
                 GROUP BY rr.driver_id
               ) c ON d.driver_id = c.driver_id`;
    const params = [];
    if (nationality) {
      sql += ` WHERE d.nationality = ?`;
      params.push(nationality);
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
       LEFT JOIN (
         SELECT rr.driver_id, co.name, co.color
         FROM race_results rr
         JOIN constructors co ON rr.constructor_id = co.constructor_id
         JOIN races r ON rr.race_id = r.race_id
         WHERE r.season_id = (SELECT MAX(season_id) FROM seasons)
         GROUP BY rr.driver_id
       ) c ON d.driver_id = c.driver_id
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
    let sql = `SELECT r.name AS race_name, r.round_number, r.race_date,
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

const { query } = require('../models/query');

const getAllCircuits = async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM circuits ORDER BY name ASC');
    res.json(rows);
  } catch (err) { next(err); }
};

const getCircuitById = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ci.*,
              d.first_name || ' ' || d.last_name AS lap_record_driver_name
       FROM circuits ci
       LEFT JOIN drivers d ON ci.lap_record_driver_id = d.driver_id
       WHERE ci.circuit_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Circuit not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const getCircuitWinners = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT s.year, r.name AS race_name, r.round_number,
              d.first_name || ' ' || d.last_name AS winner,
              d.code AS winner_code, rr.fastest_lap_time
       FROM races r
       JOIN race_results rr ON r.race_id = rr.race_id AND rr.position = 1
       JOIN drivers d ON rr.driver_id = d.driver_id
       JOIN seasons s ON r.season_id = s.season_id
       WHERE r.circuit_id = ?
       ORDER BY r.race_date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getAllCircuits, getCircuitById, getCircuitWinners };

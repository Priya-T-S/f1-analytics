const { query } = require('../models/query');

const getRacesBySeason = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT r.*, ci.name AS circuit_name, ci.country AS circuit_country,
              ci.image_url AS circuit_image,
              d.first_name || ' ' || d.last_name AS winner_name,
              d.code AS winner_code
       FROM races r
       JOIN circuits ci ON r.circuit_id = ci.circuit_id
       JOIN seasons s ON r.season_id = s.season_id
       LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.position = 1
       LEFT JOIN drivers d ON rr.driver_id = d.driver_id
       WHERE s.year = ?
       ORDER BY r.round_number ASC`,
      [req.params.year]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const getRaceById = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT r.*, ci.name AS circuit_name, ci.location, ci.country,
              ci.length_km, ci.lap_record_time,
              s.year
       FROM races r
       JOIN circuits ci ON r.circuit_id = ci.circuit_id
       JOIN seasons s ON r.season_id = s.season_id
       WHERE r.race_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Race not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const getRaceResults = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT rr.*,
              d.first_name || ' ' || d.last_name AS driver_name,
              d.code, d.driver_number, d.nationality,
              c.name AS constructor_name, c.color AS constructor_color
       FROM race_results rr
       JOIN drivers d ON rr.driver_id = d.driver_id
       JOIN constructors c ON rr.constructor_id = c.constructor_id
       WHERE rr.race_id = ?
       ORDER BY rr.position_order ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getRacesBySeason, getRaceById, getRaceResults };

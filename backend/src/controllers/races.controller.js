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
              s.year, w.avg_air_temp, w.avg_track_temp, w.rain
       FROM races r
       JOIN circuits ci ON r.circuit_id = ci.circuit_id
       JOIN seasons s ON r.season_id = s.season_id
       LEFT JOIN race_weather w ON w.race_id = r.race_id
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

// Tyre stints per driver (OpenF1, 2023+), in finishing order.
const getRaceTyres = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ts.driver_id, d.code, ts.stint, ts.compound, ts.lap_start, ts.lap_end, ts.tyre_age_at_start
       FROM tyre_stints ts
       JOIN drivers d ON d.driver_id = ts.driver_id
       LEFT JOIN race_results rr ON rr.race_id = ts.race_id AND rr.driver_id = ts.driver_id
       WHERE ts.race_id = ?
       ORDER BY rr.position_order, ts.stint`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// Best sector times and top speed per driver (OpenF1, 2023+).
const getRaceSectors = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ls.driver_id, d.code, d.first_name || ' ' || d.last_name AS driver_name,
              MIN(ls.sector1_ms) AS best_s1, MIN(ls.sector2_ms) AS best_s2, MIN(ls.sector3_ms) AS best_s3,
              MAX(ls.speed_trap) AS top_speed
       FROM lap_sectors ls
       JOIN drivers d ON d.driver_id = ls.driver_id
       WHERE ls.race_id = ?
       GROUP BY ls.driver_id
       ORDER BY (MIN(ls.sector1_ms) + MIN(ls.sector2_ms) + MIN(ls.sector3_ms))`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getRacesBySeason, getRaceById, getRaceResults, getRaceTyres, getRaceSectors };

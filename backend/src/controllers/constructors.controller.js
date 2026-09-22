const { query } = require('../models/query');

const getAllConstructors = async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM constructors ORDER BY name ASC');
    res.json(rows);
  } catch (err) { next(err); }
};

const getConstructorById = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT c.*,
              (SELECT d.first_name || ' ' || d.last_name
               FROM drivers d
               JOIN race_results rr ON d.driver_id = rr.driver_id
               WHERE rr.constructor_id = c.constructor_id
               GROUP BY d.driver_id
               ORDER BY SUM(rr.points) DESC LIMIT 1) AS top_driver
       FROM constructors c WHERE c.constructor_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Constructor not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const getConstructorStandings = async (req, res, next) => {
  try {
    const { year } = req.query;
    let sql = `SELECT s.year, cs.position, cs.points, cs.wins
               FROM constructor_standings cs
               JOIN seasons s ON cs.season_id = s.season_id
               WHERE cs.constructor_id = ?
                 AND cs.round = (SELECT MAX(round) FROM constructor_standings sub WHERE sub.season_id = cs.season_id)`;
    const params = [req.params.id];
    if (year) {
      sql += ` AND s.year = ?`;
      params.push(parseInt(year));
    }
    sql += ` ORDER BY s.year DESC`;
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getAllConstructors, getConstructorById, getConstructorStandings };

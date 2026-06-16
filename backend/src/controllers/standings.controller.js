const { query } = require('../models/query');

const getDriverStandingsBySeason = async (req, res, next) => {
  try {
    const { round } = req.query;
    let sql = `SELECT ds.driver_id, ds.position, ds.points, ds.wins,
                      d.first_name || ' ' || d.last_name AS driver_name,
                      d.code, d.nationality,
                      c.name AS constructor_name, c.color AS constructor_color
               FROM driver_standings ds
               JOIN drivers d ON ds.driver_id = d.driver_id
               JOIN seasons s ON ds.season_id = s.season_id
               LEFT JOIN (
                 SELECT rr.driver_id, r.season_id, co.name, co.color
                 FROM race_results rr
                 JOIN races r ON rr.race_id = r.race_id
                 JOIN constructors co ON rr.constructor_id = co.constructor_id
               ) c ON d.driver_id = c.driver_id AND s.season_id = c.season_id
               WHERE s.year = ?`;
    const params = [req.params.year];
    if (round) {
      sql += ` AND ds.round = ?`;
      params.push(parseInt(round));
    } else {
      sql += ` AND ds.round = (SELECT MAX(round) FROM driver_standings sub WHERE sub.season_id = ds.season_id)`;
    }
    sql += ` GROUP BY ds.driver_id, ds.position, ds.points, ds.wins, d.driver_id, c.name, c.color ORDER BY ds.position ASC`;
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

const getConstructorStandingsBySeason = async (req, res, next) => {
  try {
    const { round } = req.query;
    let sql = `SELECT cs.constructor_id, cs.position, cs.points, cs.wins, c.name AS constructor_name, c.color
               FROM constructor_standings cs
               JOIN constructors c ON cs.constructor_id = c.constructor_id
               JOIN seasons s ON cs.season_id = s.season_id
               WHERE s.year = ?`;
    const params = [req.params.year];
    if (round) {
      sql += ` AND cs.round = ?`;
      params.push(parseInt(round));
    } else {
      sql += ` AND cs.round = (SELECT MAX(round) FROM constructor_standings sub WHERE sub.season_id = cs.season_id)`;
    }
    sql += ` ORDER BY cs.position ASC`;
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

const getCurrentStandings = async (req, res, next) => {
  try {
    const drivers = await query(
      `SELECT d.driver_id, ds.position, d.first_name || ' ' || d.last_name AS driver_name,
              d.code, d.nationality, ds.points, ds.wins,
              c.name AS constructor, c.color AS constructor_color
       FROM driver_standings ds
       JOIN drivers d ON ds.driver_id = d.driver_id
       JOIN seasons s ON ds.season_id = s.season_id
       LEFT JOIN (
         SELECT rr.driver_id, co.name, co.color
         FROM race_results rr
         JOIN constructors co ON rr.constructor_id = co.constructor_id
         JOIN races r ON rr.race_id = r.race_id
         WHERE r.season_id = (SELECT season_id FROM seasons WHERE year = (SELECT MAX(year) FROM seasons))
         GROUP BY rr.driver_id
       ) c ON d.driver_id = c.driver_id
       WHERE s.year = (SELECT MAX(year) FROM seasons)
         AND ds.round = (SELECT MAX(round) FROM driver_standings sub WHERE sub.season_id = ds.season_id)
       GROUP BY d.driver_id, ds.position, ds.points, ds.wins, c.name, c.color
       ORDER BY ds.position`
    );
    const constructors = await query(
      `SELECT cs.constructor_id, cs.position, c.name AS constructor_name,
              cs.points, cs.wins, c.color
       FROM constructor_standings cs
       JOIN constructors c ON cs.constructor_id = c.constructor_id
       JOIN seasons s ON cs.season_id = s.season_id
       WHERE s.year = (SELECT MAX(year) FROM seasons)
         AND cs.round = (SELECT MAX(round) FROM constructor_standings sub WHERE sub.season_id = cs.season_id)
       ORDER BY cs.position`
    );
    res.json({ drivers, constructors });
  } catch (err) { next(err); }
};

module.exports = {
  getDriverStandingsBySeason, getConstructorStandingsBySeason, getCurrentStandings
};

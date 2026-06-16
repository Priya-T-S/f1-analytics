USE f1_analytics;

CREATE OR REPLACE VIEW v_current_driver_standings AS
SELECT
    s.year,
    ds.position,
    CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
    d.code,
    d.nationality,
    c.name AS constructor,
    ds.points,
    ds.wins
FROM driver_standings ds
JOIN seasons s ON ds.season_id = s.season_id
JOIN drivers d ON ds.driver_id = d.driver_id
LEFT JOIN (
    SELECT rr.driver_id, r.season_id, rr.constructor_id
    FROM race_results rr
    JOIN races r ON rr.race_id = r.race_id
) last_driver ON d.driver_id = last_driver.driver_id AND s.season_id = last_driver.season_id
LEFT JOIN constructors c ON last_driver.constructor_id = c.constructor_id
WHERE ds.round = (SELECT MAX(round) FROM driver_standings sub WHERE sub.season_id = ds.season_id)
GROUP BY s.year, ds.position, d.driver_id, c.name, ds.points, ds.wins
ORDER BY ds.position;

CREATE OR REPLACE VIEW v_current_constructor_standings AS
SELECT
    s.year,
    cs.position,
    c.name AS constructor_name,
    cs.points,
    cs.wins
FROM constructor_standings cs
JOIN seasons s ON cs.season_id = s.season_id
JOIN constructors c ON cs.constructor_id = c.constructor_id
WHERE cs.round = (SELECT MAX(round) FROM constructor_standings sub WHERE sub.season_id = cs.season_id)
ORDER BY cs.position;

CREATE OR REPLACE VIEW v_driver_career_stats AS
SELECT
    d.driver_id,
    CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
    d.nationality,
    d.code,
    COUNT(DISTINCT rr.result_id) AS races_entered,
    COUNT(DISTINCT CASE WHEN rr.position = 1 THEN rr.result_id END) AS wins,
    COUNT(DISTINCT CASE WHEN rr.position <= 3 THEN rr.result_id END) AS podiums,
    COUNT(DISTINCT CASE WHEN rr.position = 1 AND rr.fastest_lap = TRUE THEN rr.result_id END) AS grand_slams,
    COUNT(DISTINCT CASE WHEN rr.grid_position = 1 THEN rr.result_id END) AS poles,
    COUNT(DISTINCT CASE WHEN rr.fastest_lap = TRUE THEN rr.result_id END) AS fastest_laps,
    ROUND(AVG(CASE WHEN rr.position IS NOT NULL THEN rr.position END), 2) AS avg_finish,
    SUM(rr.points) AS total_points
FROM drivers d
LEFT JOIN race_results rr ON d.driver_id = rr.driver_id
GROUP BY d.driver_id;

CREATE OR REPLACE VIEW v_race_summary AS
SELECT
    r.race_id,
    r.name AS race_name,
    r.round_number,
    r.race_date,
    s.year,
    ci.name AS circuit_name,
    ci.country,
    CONCAT(d.first_name, ' ', d.last_name) AS winner_name,
    d.code AS winner_code,
    c.name AS winner_constructor,
    rr.fastest_lap_time,
    rr2.driver_name AS pole_sitter
FROM races r
JOIN seasons s ON r.season_id = s.season_id
JOIN circuits ci ON r.circuit_id = ci.circuit_id
LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.position = 1
LEFT JOIN drivers d ON rr.driver_id = d.driver_id
LEFT JOIN constructors c ON rr.constructor_id = c.constructor_id
LEFT JOIN (
    SELECT rr_inner.race_id, CONCAT(d2.first_name, ' ', d2.last_name) AS driver_name
    FROM race_results rr_inner
    JOIN drivers d2 ON rr_inner.driver_id = d2.driver_id
    WHERE rr_inner.grid_position = 1
) rr2 ON r.race_id = rr2.race_id;

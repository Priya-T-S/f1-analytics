-- =============================================
-- F1 Analytics – Reference SQL Queries
-- =============================================

-- Q1: All-time drivers ranked by career points
SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver, d.nationality,
       SUM(rr.points) AS career_points,
       RANK() OVER (ORDER BY SUM(rr.points) DESC) AS rank
FROM drivers d
JOIN race_results rr ON d.driver_id = rr.driver_id
GROUP BY d.driver_id
ORDER BY career_points DESC;

-- Q2: Constructor standings for a season (final round)
SELECT c.name AS constructor, cs.points, cs.wins,
       RANK() OVER (ORDER BY cs.points DESC) AS rank
FROM constructor_standings cs
JOIN constructors c ON cs.constructor_id = c.constructor_id
JOIN seasons s ON cs.season_id = s.season_id
WHERE s.year = 2023
  AND cs.round = (SELECT MAX(round) FROM constructor_standings WHERE season_id = cs.season_id)
ORDER BY rank;

-- Q3: Average finishing position by driver (season, min 10 races)
SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
       COUNT(*) AS races_finished,
       ROUND(AVG(rr.position), 2) AS avg_finish,
       SUM(rr.points) AS total_points,
       SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) AS wins
FROM race_results rr
JOIN drivers d ON rr.driver_id = d.driver_id
JOIN races r ON rr.race_id = r.race_id
JOIN seasons s ON r.season_id = s.season_id
WHERE s.year = 2023 AND rr.position IS NOT NULL
GROUP BY d.driver_id
HAVING races_finished >= 10
ORDER BY avg_finish ASC;

-- Q4: Most wins at a specific circuit
SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
       COUNT(*) AS wins_at_circuit
FROM race_results rr
JOIN drivers d ON rr.driver_id = d.driver_id
JOIN races r ON rr.race_id = r.race_id
JOIN circuits ci ON r.circuit_id = ci.circuit_id
WHERE ci.name LIKE '%Monaco%' AND rr.position = 1
GROUP BY d.driver_id
ORDER BY wins_at_circuit DESC;

-- Q5: Pole-to-win conversion rate (min 10 poles)
SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
       COUNT(*) AS pole_positions,
       SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) AS wins_from_pole,
       ROUND(SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS conversion_rate
FROM race_results rr
JOIN drivers d ON rr.driver_id = d.driver_id
WHERE rr.grid_position = 1
GROUP BY d.driver_id
HAVING pole_positions >= 10
ORDER BY conversion_rate DESC;

-- Q6: Running points total through a season (window function)
SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
       r.round_number, rr.points AS race_points,
       SUM(rr.points) OVER (
           PARTITION BY d.driver_id, s.season_id
           ORDER BY r.round_number ROWS UNBOUNDED PRECEDING
       ) AS running_total
FROM race_results rr
JOIN drivers d ON rr.driver_id = d.driver_id
JOIN races r ON rr.race_id = r.race_id
JOIN seasons s ON r.season_id = s.season_id
WHERE s.year = 2023 AND d.code IN ('VER', 'PER')
ORDER BY d.code, r.round_number;

-- Q7: Youngest grand prix winners
SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
       d.date_of_birth, r.name AS race_name, r.race_date,
       TIMESTAMPDIFF(YEAR, d.date_of_birth, r.race_date) AS age_years,
       DENSE_RANK() OVER (ORDER BY TIMESTAMPDIFF(DAY, d.date_of_birth, r.race_date) ASC) AS youngest_rank
FROM race_results rr
JOIN drivers d ON rr.driver_id = d.driver_id
JOIN races r ON rr.race_id = r.race_id
WHERE rr.position = 1
ORDER BY age_years ASC
LIMIT 10;

-- Q8: Constructor dominance – championships per team
SELECT c.name AS constructor,
       COUNT(*) AS constructor_championships,
       GROUP_CONCAT(s.year ORDER BY s.year SEPARATOR ', ') AS years_won
FROM constructors c
JOIN constructor_standings cs ON c.constructor_id = cs.constructor_id
JOIN seasons s ON cs.season_id = s.season_id
WHERE cs.position = 1
  AND cs.round = (SELECT MAX(sub.round) FROM constructor_standings sub WHERE sub.season_id = cs.season_id)
GROUP BY c.constructor_id
ORDER BY constructor_championships DESC;

-- Q9: Fastest lap holders per circuit
WITH circuit_fastest AS (
    SELECT ci.circuit_id, ci.name AS circuit, d.driver_id,
           CONCAT(d.first_name, ' ', d.last_name) AS driver,
           COUNT(*) AS fastest_lap_count,
           RANK() OVER (PARTITION BY ci.circuit_id ORDER BY COUNT(*) DESC) AS rnk
    FROM race_results rr
    JOIN races r ON rr.race_id = r.race_id
    JOIN circuits ci ON r.circuit_id = ci.circuit_id
    JOIN drivers d ON rr.driver_id = d.driver_id
    WHERE rr.fastest_lap = TRUE
    GROUP BY ci.circuit_id, d.driver_id
)
SELECT circuit, driver, fastest_lap_count
FROM circuit_fastest WHERE rnk = 1
ORDER BY circuit;

-- Q10: Drivers with perfect attendance (finished every race in a season)
SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver, s.year,
       COUNT(rr.result_id) AS races_finished,
       (SELECT COUNT(*) FROM races WHERE season_id = s.season_id) AS total_races
FROM drivers d
JOIN race_results rr ON d.driver_id = rr.driver_id
JOIN races r ON rr.race_id = r.race_id
JOIN seasons s ON r.season_id = s.season_id
WHERE rr.status = 'Finished'
GROUP BY d.driver_id, s.season_id
HAVING races_finished = total_races
ORDER BY s.year DESC;

-- Q11: Head-to-head comparison (two drivers, specific season)
SELECT r.name AS race_name, r.round_number, r.race_date,
       MAX(CASE WHEN d.code = 'HAM' THEN rr.position END) AS ham_position,
       MAX(CASE WHEN d.code = 'VER' THEN rr.position END) AS ver_position,
       CASE
           WHEN MAX(CASE WHEN d.code = 'HAM' THEN rr.position END) <
                MAX(CASE WHEN d.code = 'VER' THEN rr.position END) THEN 'HAM'
           WHEN MAX(CASE WHEN d.code = 'HAM' THEN rr.position END) >
                MAX(CASE WHEN d.code = 'VER' THEN rr.position END) THEN 'VER'
           ELSE 'TIE'
       END AS winner
FROM races r
JOIN race_results rr ON r.race_id = rr.race_id
JOIN drivers d ON rr.driver_id = d.driver_id
WHERE d.code IN ('HAM', 'VER')
  AND r.season_id = (SELECT season_id FROM seasons WHERE year = 2021)
GROUP BY r.race_id
ORDER BY r.round_number;

-- Q12: Circuit lap record holders
SELECT ci.name AS circuit, ci.country,
       CONCAT(d.first_name, ' ', d.last_name) AS driver,
       ci.lap_record_time
FROM circuits ci
JOIN drivers d ON ci.lap_record_driver_id = d.driver_id
ORDER BY ci.name;

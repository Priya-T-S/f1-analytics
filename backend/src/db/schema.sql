-- F1 Analytics schema (SQLite / Turso libSQL).
-- The *_ref columns hold Jolpica/Ergast IDs (e.g. 'max_verstappen', 'red_bull', 'monza')
-- so synced data can be matched and upserted.

CREATE TABLE IF NOT EXISTS seasons (
  season_id               INTEGER PRIMARY KEY AUTOINCREMENT,
  year                    INTEGER NOT NULL UNIQUE,
  total_races             INTEGER NOT NULL DEFAULT 0,
  champion_driver_id      INTEGER,
  champion_constructor_id INTEGER
);

CREATE TABLE IF NOT EXISTS constructors (
  constructor_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  constructor_ref  TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  nationality      TEXT,
  base_location    TEXT,
  logo_url         TEXT,
  color            TEXT DEFAULT '#ffffff'
);

CREATE TABLE IF NOT EXISTS drivers (
  driver_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_ref    TEXT NOT NULL UNIQUE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  nationality   TEXT,
  date_of_birth TEXT,
  driver_number INTEGER,
  code          TEXT,
  image_url     TEXT
);

CREATE TABLE IF NOT EXISTS circuits (
  circuit_id           INTEGER PRIMARY KEY AUTOINCREMENT,
  circuit_ref          TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  location             TEXT,
  country              TEXT,
  lat                  REAL,
  lng                  REAL,
  length_km            REAL,
  lap_record_time      TEXT,
  lap_record_driver_id INTEGER,
  image_url            TEXT,
  FOREIGN KEY (lap_record_driver_id) REFERENCES drivers(driver_id)
);

CREATE TABLE IF NOT EXISTS races (
  race_id            INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id          INTEGER NOT NULL,
  circuit_id         INTEGER NOT NULL,
  round_number       INTEGER NOT NULL,
  name               TEXT NOT NULL,
  race_date          TEXT NOT NULL,
  race_time          TEXT,
  url                TEXT,
  weather_condition  TEXT,
  scheduled_laps     INTEGER,
  openf1_session_key INTEGER,
  FOREIGN KEY (season_id)  REFERENCES seasons(season_id),
  FOREIGN KEY (circuit_id) REFERENCES circuits(circuit_id),
  UNIQUE (season_id, round_number)
);

CREATE TABLE IF NOT EXISTS race_results (
  result_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id          INTEGER NOT NULL,
  driver_id        INTEGER NOT NULL,
  constructor_id   INTEGER NOT NULL,
  grid_position    INTEGER,
  position         INTEGER,
  position_order   INTEGER NOT NULL,
  points           REAL NOT NULL DEFAULT 0,
  laps_completed   INTEGER NOT NULL DEFAULT 0,
  time_retired     TEXT,
  fastest_lap      INTEGER DEFAULT 0,
  fastest_lap_time TEXT,
  status           TEXT DEFAULT 'Finished',
  FOREIGN KEY (race_id)        REFERENCES races(race_id),
  FOREIGN KEY (driver_id)      REFERENCES drivers(driver_id),
  FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id),
  UNIQUE (race_id, driver_id)
);

CREATE TABLE IF NOT EXISTS driver_standings (
  standing_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id     INTEGER NOT NULL,
  driver_id     INTEGER NOT NULL,
  round         INTEGER NOT NULL,
  points        REAL NOT NULL DEFAULT 0,
  position      INTEGER,
  wins          INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (season_id) REFERENCES seasons(season_id),
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
  UNIQUE (season_id, driver_id, round)
);

CREATE TABLE IF NOT EXISTS constructor_standings (
  standing_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id        INTEGER NOT NULL,
  constructor_id   INTEGER NOT NULL,
  round            INTEGER NOT NULL,
  points           REAL NOT NULL DEFAULT 0,
  position         INTEGER,
  wins             INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (season_id)      REFERENCES seasons(season_id),
  FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id),
  UNIQUE (season_id, constructor_id, round)
);

CREATE TABLE IF NOT EXISTS lap_times (
  lap_time_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id       INTEGER NOT NULL,
  driver_id     INTEGER NOT NULL,
  lap           INTEGER NOT NULL,
  position      INTEGER,
  time          TEXT,
  milliseconds  INTEGER,
  FOREIGN KEY (race_id)   REFERENCES races(race_id),
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
  UNIQUE (race_id, driver_id, lap)
);

CREATE TABLE IF NOT EXISTS pit_stops (
  pit_stop_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id       INTEGER NOT NULL,
  driver_id     INTEGER NOT NULL,
  stop_number   INTEGER NOT NULL,
  lap           INTEGER,
  duration      REAL,
  milliseconds  INTEGER,
  time_of_day   TEXT,
  FOREIGN KEY (race_id)   REFERENCES races(race_id),
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
  UNIQUE (race_id, driver_id, stop_number)
);

-- OpenF1 enrichment (2023 onwards)
CREATE TABLE IF NOT EXISTS lap_sectors (
  race_id     INTEGER NOT NULL,
  driver_id   INTEGER NOT NULL,
  lap         INTEGER NOT NULL,
  sector1_ms  INTEGER,
  sector2_ms  INTEGER,
  sector3_ms  INTEGER,
  speed_trap  INTEGER,
  FOREIGN KEY (race_id)   REFERENCES races(race_id),
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
  PRIMARY KEY (race_id, driver_id, lap)
);

CREATE TABLE IF NOT EXISTS tyre_stints (
  race_id           INTEGER NOT NULL,
  driver_id         INTEGER NOT NULL,
  stint             INTEGER NOT NULL,
  compound          TEXT,
  lap_start         INTEGER,
  lap_end           INTEGER,
  tyre_age_at_start INTEGER,
  FOREIGN KEY (race_id)   REFERENCES races(race_id),
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
  PRIMARY KEY (race_id, driver_id, stint)
);

CREATE TABLE IF NOT EXISTS race_weather (
  race_id        INTEGER PRIMARY KEY,
  avg_air_temp   REAL,
  avg_track_temp REAL,
  rain           INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (race_id) REFERENCES races(race_id)
);

CREATE TABLE IF NOT EXISTS sync_state (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_race_results_driver ON race_results(driver_id);
CREATE INDEX IF NOT EXISTS idx_race_results_race ON race_results(race_id);
CREATE INDEX IF NOT EXISTS idx_races_season ON races(season_id);
CREATE INDEX IF NOT EXISTS idx_races_circuit ON races(circuit_id);
CREATE INDEX IF NOT EXISTS idx_driver_standings_season ON driver_standings(season_id);
CREATE INDEX IF NOT EXISTS idx_driver_standings_driver ON driver_standings(driver_id);
CREATE INDEX IF NOT EXISTS idx_constructor_standings_season ON constructor_standings(season_id);
CREATE INDEX IF NOT EXISTS idx_constructor_standings_constructor ON constructor_standings(constructor_id);
CREATE INDEX IF NOT EXISTS idx_lap_times_race ON lap_times(race_id);
CREATE INDEX IF NOT EXISTS idx_pit_stops_race ON pit_stops(race_id);

DROP VIEW IF EXISTS v_driver_career_stats;
CREATE VIEW v_driver_career_stats AS
SELECT d.driver_id,
       d.first_name || ' ' || d.last_name AS driver_name,
       d.nationality, d.code,
       COUNT(DISTINCT rr.result_id) AS races_entered,
       COUNT(DISTINCT CASE WHEN rr.position = 1 THEN rr.result_id END) AS wins,
       COUNT(DISTINCT CASE WHEN rr.position <= 3 THEN rr.result_id END) AS podiums,
       COUNT(DISTINCT CASE WHEN rr.grid_position = 1 THEN rr.result_id END) AS poles,
       COUNT(DISTINCT CASE WHEN rr.fastest_lap = 1 THEN rr.result_id END) AS fastest_laps,
       ROUND(AVG(CASE WHEN rr.position IS NOT NULL THEN rr.position END), 2) AS avg_finish,
       SUM(rr.points) AS total_points
FROM drivers d
LEFT JOIN race_results rr ON d.driver_id = rr.driver_id
GROUP BY d.driver_id;

CREATE DATABASE IF NOT EXISTS f1_analytics
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE f1_analytics;

CREATE TABLE seasons (
    season_id     INT PRIMARY KEY AUTO_INCREMENT,
    year          YEAR(4) NOT NULL UNIQUE,
    total_races   INT NOT NULL DEFAULT 0,
    champion_driver_id    INT NULL,
    champion_constructor_id INT NULL
);

CREATE TABLE drivers (
    driver_id     INT PRIMARY KEY AUTO_INCREMENT,
    first_name    VARCHAR(50) NOT NULL,
    last_name     VARCHAR(50) NOT NULL,
    nationality   VARCHAR(50),
    date_of_birth DATE,
    driver_number INT UNIQUE,
    code          CHAR(3) UNIQUE,
    image_url     VARCHAR(255)
);

CREATE TABLE constructors (
    constructor_id   INT PRIMARY KEY AUTO_INCREMENT,
    name             VARCHAR(100) NOT NULL UNIQUE,
    nationality      VARCHAR(50),
    base_location    VARCHAR(100),
    logo_url         VARCHAR(255),
    color            VARCHAR(7) DEFAULT '#ffffff'
);

CREATE TABLE circuits (
    circuit_id      INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    location        VARCHAR(100),
    country         VARCHAR(50),
    length_km       DECIMAL(6,3),
    lap_record_time VARCHAR(20),
    lap_record_driver_id INT,
    image_url       VARCHAR(255),
    FOREIGN KEY (lap_record_driver_id) REFERENCES drivers(driver_id)
);

CREATE TABLE races (
    race_id          INT PRIMARY KEY AUTO_INCREMENT,
    season_id        INT NOT NULL,
    circuit_id       INT NOT NULL,
    round_number     INT NOT NULL,
    name             VARCHAR(100) NOT NULL,
    race_date        DATE NOT NULL,
    weather_condition VARCHAR(20) DEFAULT 'Dry',
    scheduled_laps   INT,
    FOREIGN KEY (season_id)  REFERENCES seasons(season_id),
    FOREIGN KEY (circuit_id) REFERENCES circuits(circuit_id),
    UNIQUE KEY (season_id, round_number)
);

CREATE TABLE race_results (
    result_id        INT PRIMARY KEY AUTO_INCREMENT,
    race_id          INT NOT NULL,
    driver_id        INT NOT NULL,
    constructor_id   INT NOT NULL,
    grid_position    INT,
    position         INT NULL,
    position_order   INT NOT NULL,
    points           DECIMAL(6,1) NOT NULL DEFAULT 0,
    laps_completed   INT NOT NULL DEFAULT 0,
    time_retired     VARCHAR(50) NULL,
    fastest_lap      BOOLEAN DEFAULT FALSE,
    fastest_lap_time VARCHAR(20) NULL,
    status           ENUM('Finished','DNF','DSQ','DNS') DEFAULT 'Finished',
    FOREIGN KEY (race_id)        REFERENCES races(race_id),
    FOREIGN KEY (driver_id)      REFERENCES drivers(driver_id),
    FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id),
    UNIQUE KEY (race_id, driver_id)
);

CREATE TABLE lap_times (
    lap_time_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    race_id       INT NOT NULL,
    driver_id     INT NOT NULL,
    lap_number    INT NOT NULL,
    lap_time      DECIMAL(8,3) NOT NULL,
    lap_position  INT,
    FOREIGN KEY (race_id)   REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    UNIQUE KEY (race_id, driver_id, lap_number)
);

CREATE TABLE driver_standings (
    standing_id   INT PRIMARY KEY AUTO_INCREMENT,
    season_id     INT NOT NULL,
    driver_id     INT NOT NULL,
    round         INT NOT NULL,
    points        DECIMAL(7,1) NOT NULL DEFAULT 0,
    position      INT,
    wins          INT NOT NULL DEFAULT 0,
    FOREIGN KEY (season_id) REFERENCES seasons(season_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    UNIQUE KEY (season_id, driver_id, round)
);

CREATE TABLE constructor_standings (
    standing_id      INT PRIMARY KEY AUTO_INCREMENT,
    season_id        INT NOT NULL,
    constructor_id   INT NOT NULL,
    round            INT NOT NULL,
    points           DECIMAL(7,1) NOT NULL DEFAULT 0,
    position         INT,
    wins             INT NOT NULL DEFAULT 0,
    FOREIGN KEY (season_id)      REFERENCES seasons(season_id),
    FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id),
    UNIQUE KEY (season_id, constructor_id, round)
);

CREATE TABLE pit_stops (
    pit_stop_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    race_id       INT NOT NULL,
    driver_id     INT NOT NULL,
    stop_number   INT NOT NULL,
    lap           INT NOT NULL,
    duration      DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (race_id)   REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    UNIQUE KEY (race_id, driver_id, stop_number)
);

CREATE INDEX idx_race_results_driver ON race_results(driver_id);
CREATE INDEX idx_race_results_race ON race_results(race_id);
CREATE INDEX idx_lap_times_race ON lap_times(race_id);
CREATE INDEX idx_lap_times_driver ON lap_times(driver_id);
CREATE INDEX idx_driver_standings_season ON driver_standings(season_id);
CREATE INDEX idx_constructor_standings_season ON constructor_standings(season_id);

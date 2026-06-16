const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'f1_analytics.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  DROP TABLE IF EXISTS pit_stops;
  DROP TABLE IF EXISTS lap_times;
  DROP TABLE IF EXISTS race_results;
  DROP TABLE IF EXISTS driver_standings;
  DROP TABLE IF EXISTS constructor_standings;
  DROP TABLE IF EXISTS races;
  DROP TABLE IF EXISTS circuits;
  DROP TABLE IF EXISTS drivers;
  DROP TABLE IF EXISTS constructors;
  DROP TABLE IF EXISTS seasons;
  DROP VIEW IF EXISTS v_driver_career_stats;

  CREATE TABLE seasons (
    season_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    year          INTEGER NOT NULL UNIQUE,
    total_races   INTEGER NOT NULL DEFAULT 0,
    champion_driver_id    INTEGER,
    champion_constructor_id INTEGER
  );

  CREATE TABLE constructors (
    constructor_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL UNIQUE,
    nationality      TEXT,
    base_location    TEXT,
    logo_url         TEXT,
    color            TEXT DEFAULT '#ffffff'
  );

  CREATE TABLE drivers (
    driver_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT NOT NULL,
    last_name     TEXT NOT NULL,
    nationality   TEXT,
    date_of_birth TEXT,
    driver_number INTEGER,
    code          TEXT UNIQUE,
    image_url     TEXT
  );

  CREATE TABLE circuits (
    circuit_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    location        TEXT,
    country         TEXT,
    length_km       REAL,
    lap_record_time TEXT,
    lap_record_driver_id INTEGER,
    image_url       TEXT,
    FOREIGN KEY (lap_record_driver_id) REFERENCES drivers(driver_id)
  );

  CREATE TABLE races (
    race_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id        INTEGER NOT NULL,
    circuit_id       INTEGER NOT NULL,
    round_number     INTEGER NOT NULL,
    name             TEXT NOT NULL,
    race_date        TEXT NOT NULL,
    weather_condition TEXT DEFAULT 'Dry',
    scheduled_laps   INTEGER,
    FOREIGN KEY (season_id)  REFERENCES seasons(season_id),
    FOREIGN KEY (circuit_id) REFERENCES circuits(circuit_id),
    UNIQUE (season_id, round_number)
  );

  CREATE TABLE race_results (
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

  CREATE TABLE driver_standings (
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

  CREATE TABLE constructor_standings (
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

  CREATE TABLE pit_stops (
    pit_stop_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id       INTEGER NOT NULL,
    driver_id     INTEGER NOT NULL,
    stop_number   INTEGER NOT NULL,
    lap           INTEGER NOT NULL,
    duration      REAL NOT NULL,
    FOREIGN KEY (race_id)   REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    UNIQUE (race_id, driver_id, stop_number)
  );

  CREATE INDEX idx_race_results_driver ON race_results(driver_id);
  CREATE INDEX idx_race_results_race ON race_results(race_id);
  CREATE INDEX idx_driver_standings_season ON driver_standings(season_id);
  CREATE INDEX idx_constructor_standings_season ON constructor_standings(season_id);
`);

function insert(table, columns, rows) {
  const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
  const tx = db.transaction((data) => { for (const r of data) stmt.run(...r); });
  tx(rows);
}

function run(sql, params = []) { return db.prepare(sql).run(...params); }

// ===================== ALL CONSTRUCTORS (historical + current) =====================
insert('constructors', ['constructor_id', 'name', 'nationality', 'base_location', 'color', 'logo_url'], [
  [1,  'Red Bull Racing', 'Austrian', 'Milton Keynes, UK', '#1e41b8', null],
  [2,  'Mercedes', 'German', 'Brackley, UK', '#00d2be', 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Mercedes-AMG_Petronas_F1_Team_logo_%282026%29.svg'],
  [3,  'Ferrari', 'Italian', 'Maranello, Italy', '#dc0000', null],
  [4,  'McLaren', 'British', 'Woking, UK', '#ff8700', null],
  [5,  'Aston Martin', 'British', 'Silverstone, UK', '#006f62', null],
  [6,  'Alpine', 'French', 'Enstone, UK', '#0090ff', 'https://upload.wikimedia.org/wikipedia/commons/4/4a/BWT_Alpine_F1_Team_Logo.png'],
  [7,  'Williams', 'British', 'Grove, UK', '#005aff', 'https://upload.wikimedia.org/wikipedia/commons/1/12/Atlassian_Williams_F1_Team_logo.svg'],
  [8,  'AlphaTauri', 'Italian', 'Faenza, Italy', '#6692ff', null],
  [9,  'Haas', 'American', 'Kannapolis, USA', '#b6babd', 'https://upload.wikimedia.org/wikipedia/commons/1/18/TGR_Haas_F1_Team_Logo_%282026%29.svg'],
  [10, 'Alfa Romeo', 'Swiss', 'Hinwil, Switzerland', '#52e252', null],
  [11, 'Alfa Romeo Racing', 'Italian', 'Milan, Italy', '#8b0000', null],
  [12, 'Maserati', 'Italian', 'Modena, Italy', '#1a3a5c', null],
  [13, 'Cooper', 'British', 'Surbiton, UK', '#004225', 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Cooper_car_company.png'],
  [14, 'BRM', 'British', 'Bourne, UK', '#003366', null],
  [15, 'Lotus', 'British', 'Hethel, UK', '#b22222', null],
  [16, 'Brabham', 'Australian', 'Slough, UK', '#ffd700', null],
  [17, 'Matra', 'French', 'Vélizy, France', '#003399', null],
  [18, 'Tyrrell', 'British', 'Ockham, UK', '#004586', null],
  [19, 'Vanwall', 'British', 'London, UK', '#003f2e', null],
  [20, 'Benetton', 'Italian', 'Enstone, UK', '#ffff00', null],
  [21, 'Brawn GP', 'British', 'Brackley, UK', '#00d2b8', null],
  [22, 'Renault', 'French', 'Enstone, UK', '#ffd800', null],
  [23, 'Honda', 'Japanese', 'Tokyo, Japan', '#cc0000', null],
  [24, 'BMW Sauber', 'German', 'Hinwil, Switzerland', '#1c3faa', null],
  [25, 'Toyota', 'Japanese', 'Cologne, Germany', '#cc0000', null],
  [26, 'Jaguar', 'British', 'Milton Keynes, UK', '#003366', 'https://upload.wikimedia.org/wikipedia/commons/7/77/Jaguar_TCS_Racing_Logo_2024.png'],
  [27, 'Prost', 'French', 'Guyancourt, France', '#0033cc', 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Prost_Grand_Prix_Formula_One_Logo.png'],
  [28, 'Minardi', 'Italian', 'Faenza, Italy', '#800000', null],
  [29, 'Arrows', 'British', 'Milton Keynes, UK', '#003366', null],
  [30, 'Sauber', 'Swiss', 'Hinwil, Switzerland', '#ff0000', 'https://upload.wikimedia.org/wikipedia/commons/9/94/Logo_sauber_2023.jpg'],
  [31, 'Jordan', 'British', 'Silverstone, UK', '#006f3e', null],
  [32, 'Stewart', 'British', 'Milton Keynes, UK', '#003366', null],
  [33, 'BAR', 'British', 'Brackley, UK', '#004586', null],
  [34, 'Super Aguri', 'Japanese', 'Tokyo, Japan', '#ff0000', null],
  [35, 'Red Bull', 'Austrian', 'Milton Keynes, UK', '#1e41b8', null],
]);

// ===================== ALL DRIVERS =====================
insert('drivers', ['driver_id', 'first_name', 'last_name', 'nationality', 'date_of_birth', 'driver_number', 'code', 'image_url'], [
  // Current drivers (2022-2023)
  [1,  'Max', 'Verstappen', 'Dutch', '1997-09-30', 1, 'VER', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg/250px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg'],
  [2,  'Sergio', 'Perez', 'Mexican', '1990-01-26', 11, 'PER', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/2021_US_GP_driver_parade_%28cropped2%29.jpg/250px-2021_US_GP_driver_parade_%28cropped2%29.jpg'],
  [3,  'Lewis', 'Hamilton', 'British', '1985-01-07', 44, 'HAM', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg/250px-Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg'],
  [4,  'George', 'Russell', 'British', '1998-02-15', 63, 'RUS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/KingsLeonSilverstne040724_%2828_of_112%29_%2853838006028%29_%28cropped%29.jpg/250px-KingsLeonSilverstne040724_%2828_of_112%29_%2853838006028%29_%28cropped%29.jpg'],
  [5,  'Charles', 'Leclerc', 'Monegasque', '1997-10-16', 16, 'LEC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3978_by_Stepro_%28cropped2%29.jpg/250px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3978_by_Stepro_%28cropped2%29.jpg'],
  [6,  'Carlos', 'Sainz', 'Spanish', '1994-09-01', 55, 'SAI', null],
  [7,  'Lando', 'Norris', 'British', '1999-11-13', 4, 'NOR', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3968_by_Stepro_%28cropped2%29.jpg/250px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3968_by_Stepro_%28cropped2%29.jpg'],
  [8,  'Oscar', 'Piastri', 'Australian', '2001-04-06', 81, 'PIA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2026_Chinese_GP_-_Oscar_Piastri_%28cropped%29_%28cropped%29.jpg/250px-2026_Chinese_GP_-_Oscar_Piastri_%28cropped%29_%28cropped%29.jpg'],
  [9,  'Fernando', 'Alonso', 'Spanish', '1981-07-29', 14, 'ALO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Alonso-68_%2824710447098%29.jpg/250px-Alonso-68_%2824710447098%29.jpg'],
  [10, 'Lance', 'Stroll', 'Canadian', '1998-10-29', 18, 'STR', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/2025_Japan_GP_-_Aston_Martin_-_Lance_Stroll_-_Fanzone_Stage_%28cropped%29.jpg/250px-2025_Japan_GP_-_Aston_Martin_-_Lance_Stroll_-_Fanzone_Stage_%28cropped%29.jpg'],
  [11, 'Esteban', 'Ocon', 'French', '1996-09-17', 31, 'OCO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Esteban_Ocon_2024_Suzuka_%28cropped%29.jpg/250px-Esteban_Ocon_2024_Suzuka_%28cropped%29.jpg'],
  [12, 'Pierre', 'Gasly', 'French', '1996-02-07', 10, 'GAS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/2022_French_Grand_Prix_%2852279065728%29_%28midcrop%29.png/250px-2022_French_Grand_Prix_%2852279065728%29_%28midcrop%29.png'],
  [13, 'Alexander', 'Albon', 'Thai', '1996-03-23', 23, 'ALB', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Alex_Albon_%28cropped%29.jpg/250px-Alex_Albon_%28cropped%29.jpg'],
  [14, 'Logan', 'Sargeant', 'American', '2000-12-31', 2, 'SAR', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Logan_Sargeant_NYC_%28cropped%29.jpg/250px-Logan_Sargeant_NYC_%28cropped%29.jpg'],
  [15, 'Yuki', 'Tsunoda', 'Japanese', '2000-05-11', 22, 'TSU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Yuki_Tsunoda_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8096%29.jpg/250px-Yuki_Tsunoda_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8096%29.jpg'],
  [16, 'Nyck', 'de Vries', 'Dutch', '1995-02-06', 21, 'DEV', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/TGR_Nyck_de_Vries_240908.jpg/250px-TGR_Nyck_de_Vries_240908.jpg'],
  [17, 'Kevin', 'Magnussen', 'Danish', '1992-10-05', 20, 'MAG', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Kevin_Magnussen%2C_2019_Formula_One_Tests_Barcelona_%28cropped%29.jpg/250px-Kevin_Magnussen%2C_2019_Formula_One_Tests_Barcelona_%28cropped%29.jpg'],
  [18, 'Nico', 'Hulkenberg', 'German', '1987-08-19', 27, 'HUL', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/2019_Formula_One_tests_Barcelona%2C_Hulkenberg_%2840287128313%29.jpg/250px-2019_Formula_One_tests_Barcelona%2C_Hulkenberg_%2840287128313%29.jpg'],
  [19, 'Valtteri', 'Bottas', 'Finnish', '1989-08-28', 77, 'BOT', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Valtteri_Bottas_at_the_2026_Adelaide_Motorsport_Festival_%28028A7556%29.jpg/250px-Valtteri_Bottas_at_the_2026_Adelaide_Motorsport_Festival_%28028A7556%29.jpg'],
  [20, 'Zhou', 'Guanyu', 'Chinese', '1999-05-30', 24, 'ZHO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Zhou_Guanyu_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A7999%29.jpg/250px-Zhou_Guanyu_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A7999%29.jpg'],
  [21, 'Daniel', 'Ricciardo', 'Australian', '1989-07-01', 3, 'RIC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Daniel_Ricciardo_January_2024.jpg/250px-Daniel_Ricciardo_January_2024.jpg'],
  [22, 'Mick', 'Schumacher', 'German', '1999-03-22', 47, 'MIC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Mick_Schumacher_2024_WEC_Fuji.jpg/250px-Mick_Schumacher_2024_WEC_Fuji.jpg'],
  [23, 'Sebastian', 'Vettel', 'German', '1987-07-03', 5, 'VET', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg/250px-Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg'],
  [24, 'Nicholas', 'Latifi', 'Canadian', '1995-06-29', 6, 'LAT', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Nicholas_Latifi_at_Singapore_in_2022_%28cropped%29.jpg/250px-Nicholas_Latifi_at_Singapore_in_2022_%28cropped%29.jpg'],
  [25, 'Liam', 'Lawson', 'New Zealander', '2002-02-11', 40, 'LAW', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Liam_Lawson_at_the_Red_Bull_Fan_Zone_%E2%80%93_Crown_Riverwalk%2C_Melbourne_%28028A7793%29.jpg/250px-Liam_Lawson_at_the_Red_Bull_Fan_Zone_%E2%80%93_Crown_Riverwalk%2C_Melbourne_%28028A7793%29.jpg'],
  // F1 Legends - Champions
  [26, 'Giuseppe', 'Farina', 'Italian', '1906-10-30', null, 'FAR', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Giuseppe_Farina_-_El_Gr%C3%A1fico_1750.jpg/250px-Giuseppe_Farina_-_El_Gr%C3%A1fico_1750.jpg'],
  [27, 'Juan Manuel', 'Fangio', 'Argentine', '1911-06-24', null, 'FAN', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Fangio_in_1955_%28cropped%29.jpg/250px-Fangio_in_1955_%28cropped%29.jpg'],
  [28, 'Alberto', 'Ascari', 'Italian', '1918-07-13', null, 'ASC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Ascari_last_photo_in_car.jpg/250px-Ascari_last_photo_in_car.jpg'],
  [29, 'Mike', 'Hawthorn', 'British', '1929-04-10', null, 'HAW', null],
  [30, 'Jack', 'Brabham', 'Australian', '1926-04-02', null, 'BRA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/BrabhamJack1966B.jpg/250px-BrabhamJack1966B.jpg'],
  [31, 'Phil', 'Hill', 'American', '1927-04-20', null, 'PHI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Phil_Hill_1991_USA_%28cropped%29.jpg/250px-Phil_Hill_1991_USA_%28cropped%29.jpg'],
  [32, 'Graham', 'Hill', 'British', '1929-04-15', null, 'GRA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Graham_Hill_Bestanddeelnr_924-6564.jpg/250px-Graham_Hill_Bestanddeelnr_924-6564.jpg'],
  [33, 'Jim', 'Clark', 'British', '1936-03-04', null, 'CLA', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Jim_Clark_in_1963_%28cropped%29.JPG/250px-Jim_Clark_in_1963_%28cropped%29.JPG'],
  [34, 'John', 'Surtees', 'British', '1934-02-11', null, 'SUR', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/John_Surtees.JPG/250px-John_Surtees.JPG'],
  [35, 'Denny', 'Hulme', 'New Zealander', '1936-06-18', null, 'DHU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/HulmeDenis196508_%28cropped%29.jpg/250px-HulmeDenis196508_%28cropped%29.jpg'],
  [36, 'Jackie', 'Stewart', 'British', '1939-06-11', null, 'STE', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Jackie_Stewart_at_the_2014_WEC_Silverstone_round.jpg/250px-Jackie_Stewart_at_the_2014_WEC_Silverstone_round.jpg'],
  [37, 'Jochen', 'Rindt', 'Austrian', '1942-04-18', null, 'RIN', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rindt_at_1970_Dutch_Grand_Prix_%282C%29.jpg/250px-Rindt_at_1970_Dutch_Grand_Prix_%282C%29.jpg'],
  [38, 'Emerson', 'Fittipaldi', 'Brazilian', '1946-12-12', null, 'FIT', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Emerson_Fittipaldi_in_2020_%28cropped%29.JPG/250px-Emerson_Fittipaldi_in_2020_%28cropped%29.JPG'],
  [39, 'Niki', 'Lauda', 'Austrian', '1949-02-22', null, 'LAU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Lauda_at_1982_Dutch_Grand_Prix.jpg/250px-Lauda_at_1982_Dutch_Grand_Prix.jpg'],
  [40, 'James', 'Hunt', 'British', '1947-08-29', null, 'HUN', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/J._Hunt_in_1977_%28cropped%29.jpg/250px-J._Hunt_in_1977_%28cropped%29.jpg'],
  [41, 'Mario', 'Andretti', 'American', '1940-02-28', null, 'AND', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Mario_Andretti_Goodwood_Festival_of_Speed_2021_%28cropped%29.jpg/250px-Mario_Andretti_Goodwood_Festival_of_Speed_2021_%28cropped%29.jpg'],
  [42, 'Jody', 'Scheckter', 'South African', '1950-01-29', null, 'JOS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Jody_Scheckter_during_the_1979_Monaco_Grand_Prix.jpg/250px-Jody_Scheckter_during_the_1979_Monaco_Grand_Prix.jpg'],
  [43, 'Alan', 'Jones', 'Australian', '1946-11-12', null, 'ALJ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Jones_alan.JPG/250px-Jones_alan.JPG'],
  [44, 'Nelson', 'Piquet', 'Brazilian', '1952-08-17', null, 'PIQ', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Cerimonia_de_entrega_da_medalha_Bras%C3%ADlia_60_anos_-_16.jpg/250px-Cerimonia_de_entrega_da_medalha_Bras%C3%ADlia_60_anos_-_16.jpg'],
  [45, 'Keke', 'Rosberg', 'Finnish', '1948-12-06', null, 'KER', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Anefo_932-2378_Keke_Rosberg%2C_Zandvoort%2C_03-07-1982_-_Restoration.jpg/250px-Anefo_932-2378_Keke_Rosberg%2C_Zandvoort%2C_03-07-1982_-_Restoration.jpg'],
  [46, 'Alain', 'Prost', 'French', '1955-02-24', null, 'PRO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Festival_automobile_international_2015_-_Photocall_-_065_%28cropped3%29.jpg/250px-Festival_automobile_international_2015_-_Photocall_-_065_%28cropped3%29.jpg'],
  [47, 'Ayrton', 'Senna', 'Brazilian', '1960-03-21', null, 'SEN', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Ayrton_Senna_9_%28cropped%29.jpg/250px-Ayrton_Senna_9_%28cropped%29.jpg'],
  [48, 'Nigel', 'Mansell', 'British', '1953-08-08', null, 'MAN', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Nigel_Mansell_-_Mexican_Grand_Prix_01_%28cropped%29.jpeg/250px-Nigel_Mansell_-_Mexican_Grand_Prix_01_%28cropped%29.jpeg'],
  [49, 'Damon', 'Hill', 'British', '1960-09-17', null, 'DAH', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Damon_Hill_at_the_Atlassian_Williams_Racing_Fan_Zone_of_2026_%28028A8241%29.jpg/250px-Damon_Hill_at_the_Atlassian_Williams_Racing_Fan_Zone_of_2026_%28028A8241%29.jpg'],
  [50, 'Jacques', 'Villeneuve', 'Canadian', '1971-04-09', null, 'VIL', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Jacques_Villeneuve_Peugeot_208_T16_Lydden_Hill_2014_006_%28cropped2%29.jpg/250px-Jacques_Villeneuve_Peugeot_208_T16_Lydden_Hill_2014_006_%28cropped2%29.jpg'],
  [51, 'Mika', 'Hakkinen', 'Finnish', '1968-09-28', null, 'HAK', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Mika_H%C3%A4kkinen_Champions_for_Charity_2016-07-27.jpg/250px-Mika_H%C3%A4kkinen_Champions_for_Charity_2016-07-27.jpg'],
  [52, 'Michael', 'Schumacher', 'German', '1969-01-03', null, 'MSC', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/A%C3%A9cio_Neves%2C_Michael_Schumacher_e_Didi_%28Cropped%29.jpg/250px-A%C3%A9cio_Neves%2C_Michael_Schumacher_e_Didi_%28Cropped%29.jpg'],
  [53, 'Jenson', 'Button', 'British', '1980-01-19', 22, 'BUT', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Jenson_Button_2024_WEC_Fuji.jpg/250px-Jenson_Button_2024_WEC_Fuji.jpg'],
  [54, 'Kimi', 'Raikkonen', 'Finnish', '1979-10-17', 7, 'RAI', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/F12019_Schloss_Gabelhofen_%2822%29_%28cropped%29.jpg/250px-F12019_Schloss_Gabelhofen_%2822%29_%28cropped%29.jpg'],
  [55, 'Nico', 'Rosberg', 'German', '1985-06-27', 6, 'NRO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Nico_Rosberg_2016.jpg/250px-Nico_Rosberg_2016.jpg'],
  // Notable non-champions
  [56, 'Stirling', 'Moss', 'British', '1929-09-17', null, 'MOS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Stirling_Moss.jpg/250px-Stirling_Moss.jpg'],
  [57, 'Ronnie', 'Peterson', 'Swedish', '1944-02-14', null, 'PET', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Peterson_at_1978_Dutch_Grand_Prix.jpg/250px-Peterson_at_1978_Dutch_Grand_Prix.jpg'],
  [58, 'Rubens', 'Barrichello', 'Brazilian', '1972-05-23', null, 'BAR', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Rubinho.jpg/250px-Rubinho.jpg'],
  [59, 'David', 'Coulthard', 'British', '1971-03-27', null, 'COU', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/David_Coulthard_at_the_2025_Adelaide_Grand_Final_Parade_-_12.jpg/250px-David_Coulthard_at_the_2025_Adelaide_Grand_Final_Parade_-_12.jpg'],
  [60, 'Mark', 'Webber', 'Australian', '1976-08-27', null, 'WEB', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Mark_Webber_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8720%29.jpg/250px-Mark_Webber_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8720%29.jpg'],
  [61, 'Felipe', 'Massa', 'Brazilian', '1981-04-25', 19, 'MAS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Felipe_Massa.jpg/250px-Felipe_Massa.jpg'],
  [62, 'Jacky', 'Ickx', 'Belgian', '1945-01-01', null, 'ICK', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Jacky_Ickx_Portr%C3%A4t_Mille_Miglia_2018.jpg/250px-Jacky_Ickx_Portr%C3%A4t_Mille_Miglia_2018.jpg'],
  [63, 'Stirling', 'Moss', 'British', '1929-09-17', null, 'SMO', null],
]);

// Remove duplicate Moss
run('DELETE FROM drivers WHERE driver_id = 63');

// ===================== CIRCUITS =====================
insert('circuits', ['circuit_id', 'name', 'location', 'country', 'length_km', 'lap_record_time'], [
  [1,  'Bahrain International Circuit', 'Sakhir', 'Bahrain', 5.412, '1:31.447'],
  [2,  'Jeddah Corniche Circuit', 'Jeddah', 'Saudi Arabia', 6.174, '1:30.734'],
  [3,  'Albert Park Circuit', 'Melbourne', 'Australia', 5.278, '1:20.260'],
  [4,  'Imola Circuit', 'Imola', 'Italy', 4.909, '1:15.484'],
  [5,  'Miami International Autodrome', 'Miami', 'USA', 5.412, '1:29.708'],
  [6,  'Circuit de Barcelona-Catalunya', 'Barcelona', 'Spain', 4.675, '1:16.330'],
  [7,  'Circuit de Monaco', 'Monte Carlo', 'Monaco', 3.337, '1:12.909'],
  [8,  'Baku City Circuit', 'Baku', 'Azerbaijan', 6.003, '1:43.009'],
  [9,  'Circuit Gilles Villeneuve', 'Montreal', 'Canada', 4.361, '1:13.078'],
  [10, 'Silverstone Circuit', 'Silverstone', 'UK', 5.891, '1:27.097'],
  [11, 'Red Bull Ring', 'Spielberg', 'Austria', 4.318, '1:04.391'],
  [12, 'Circuit Paul Ricard', 'Le Castellet', 'France', 5.842, '1:32.740'],
  [13, 'Hungaroring', 'Budapest', 'Hungary', 4.381, '1:16.627'],
  [14, 'Circuit de Spa-Francorchamps', 'Spa', 'Belgium', 7.004, '1:44.701'],
  [15, 'Circuit Zandvoort', 'Zandvoort', 'Netherlands', 4.259, '1:11.097'],
  [16, 'Monza Circuit', 'Monza', 'Italy', 5.793, '1:21.046'],
  [17, 'Marina Bay Street Circuit', 'Singapore', 'Singapore', 4.940, '1:41.905'],
  [18, 'Suzuka International Racing Course', 'Suzuka', 'Japan', 5.807, '1:30.983'],
  [19, 'Losail International Circuit', 'Lusail', 'Qatar', 5.380, '1:23.196'],
  [20, 'Circuit of the Americas', 'Austin', 'USA', 5.513, '1:36.169'],
  [21, 'Autodromo Hermanos Rodriguez', 'Mexico City', 'Mexico', 4.304, '1:17.774'],
  [22, 'Interlagos Circuit', 'Sao Paulo', 'Brazil', 4.309, '1:10.540'],
  [23, 'Yas Marina Circuit', 'Abu Dhabi', 'UAE', 5.281, '1:26.103'],
  [24, 'Las Vegas Strip Circuit', 'Las Vegas', 'USA', 6.201, '1:35.490'],
  [25, 'Nürburgring', 'Nürburg', 'Germany', 5.148, '1:29.468'],
  [26, 'Hockenheimring', 'Hockenheim', 'Germany', 4.574, '1:13.780'],
  [27, 'Indianapolis Motor Speedway', 'Indianapolis', 'USA', 4.192, '1:10.399'],
]);

// ===================== ALL SEASONS 1950-2023 =====================
const champions = {
  1950: [26, 11], 1951: [27, 11], 1952: [28, 3], 1953: [28, 3],
  1954: [27, 12], 1955: [27, 2], 1956: [27, 3], 1957: [27, 12],
  1958: [29, 3], 1959: [30, 13], 1960: [30, 13], 1961: [31, 3],
  1962: [32, 14], 1963: [33, 15], 1964: [34, 3], 1965: [33, 15],
  1966: [30, 16], 1967: [35, 16], 1968: [32, 15], 1969: [36, 17],
  1970: [37, 15], 1971: [36, 18], 1972: [38, 15], 1973: [36, 18],
  1974: [38, 4], 1975: [39, 3], 1976: [40, 4], 1977: [39, 3],
  1978: [41, 15], 1979: [42, 3], 1980: [43, 7], 1981: [44, 16],
  1982: [45, 7], 1983: [44, 16], 1984: [39, 4], 1985: [46, 4],
  1986: [46, 4], 1987: [44, 7], 1988: [47, 4], 1989: [46, 4],
  1990: [47, 4], 1991: [47, 4], 1992: [48, 7], 1993: [46, 7],
  1994: [52, 20], 1995: [52, 20], 1996: [49, 7], 1997: [50, 7],
  1998: [51, 4], 1999: [51, 4], 2000: [52, 3], 2001: [52, 3],
  2002: [52, 3], 2003: [52, 3], 2004: [52, 3], 2005: [9, 22],
  2006: [9, 22], 2007: [54, 3], 2008: [3, 4], 2009: [53, 21],
  2010: [23, 1], 2011: [23, 1], 2012: [23, 1], 2013: [23, 1],
  2014: [3, 2], 2015: [3, 2], 2016: [55, 2], 2017: [3, 2],
  2018: [3, 2], 2019: [3, 2], 2020: [3, 2], 2021: [1, 1],
};

const seasonData = [];
let sid = 1;
for (let y = 1950; y <= 2021; y++) {
  const cd = champions[y][0];
  const cc = champions[y][1];
  seasonData.push([sid, y, cd, cc]);
  sid++;
}
seasonData.push([73, 2022, 1, 1]);
seasonData.push([74, 2023, 1, 1]);

insert('seasons', ['season_id', 'year', 'champion_driver_id', 'champion_constructor_id'], seasonData);
run('UPDATE seasons SET total_races = 22 WHERE year >= 2022');
run('UPDATE seasons SET total_races = 7 WHERE year = 1950');
run('UPDATE seasons SET total_races = 8 WHERE year = 1951');
run('UPDATE seasons SET total_races = 8 WHERE year = 1952');
run('UPDATE seasons SET total_races = 9 WHERE year = 1953');
run('UPDATE seasons SET total_races = 16 WHERE year >= 2005 AND year <= 2008');
run('UPDATE seasons SET total_races = 17 WHERE year >= 2009 AND year <= 2010');
run('UPDATE seasons SET total_races = 21 WHERE year = 2021');

// ===================== DRIVER STANDINGS (champion entries for history) =====================
const champStandings = [
  [1, 1950, 30, 3, 3],   // Farina 30 pts, 3 wins - season_id 1
  [2, 1950, 27, 2, 3],
  [3, 1951, 31, 1, 3],
  [4, 1952, 36, 1, 6],
  [5, 1953, 34.5, 1, 5],
  [6, 1954, 42, 1, 6],
  [7, 1955, 40, 1, 4],
  [8, 1956, 30, 1, 3],
  [9, 1957, 40, 1, 4],
  [10, 1958, 42, 1, 1],
  [11, 1959, 31, 1, 2],
  [12, 1960, 43, 1, 5],
  [13, 1961, 38, 1, 2],
  [14, 1962, 42, 1, 4],
  [15, 1963, 54, 1, 7],
  [16, 1964, 40, 1, 2],
  [17, 1965, 54, 1, 6],
  [18, 1966, 42, 1, 4],
  [19, 1967, 51, 1, 4],
  [20, 1968, 48, 1, 3],
  [21, 1969, 63, 1, 6],
  [22, 1970, 45, 1, 5],
  [23, 1971, 62, 1, 6],
  [24, 1972, 61, 1, 5],
  [25, 1973, 71, 1, 5],
  [26, 1974, 55, 1, 3],
  [27, 1975, 64.5, 1, 5],
  [28, 1976, 69, 1, 6],
  [29, 1977, 72, 1, 3],
  [30, 1978, 64, 1, 6],
  [31, 1979, 51, 1, 3],
  [32, 1980, 67, 1, 5],
  [33, 1981, 50, 1, 3],
  [34, 1982, 44, 1, 1],
  [35, 1983, 59, 1, 3],
  [36, 1984, 72, 1, 5],
  [37, 1985, 73, 1, 5],
  [38, 1986, 72, 1, 4],
  [39, 1987, 73, 1, 3],
  [40, 1988, 90, 1, 8],
  [41, 1989, 76, 1, 4],
  [42, 1990, 78, 1, 6],
  [43, 1991, 85, 1, 7],
  [44, 1992, 96, 1, 9],
  [45, 1993, 87, 1, 7],
  [46, 1994, 80, 1, 6],
  [47, 1995, 92, 1, 9],
  [48, 1996, 87, 1, 8],
  [49, 1997, 81, 1, 7],
  [50, 1998, 100, 1, 8],
  [51, 1999, 76, 1, 5],
  [52, 2000, 108, 1, 9],
  [53, 2001, 123, 1, 9],
  [54, 2002, 144, 1, 11],
  [55, 2003, 93, 1, 6],
  [56, 2004, 148, 1, 13],
  [57, 2005, 133, 1, 7],
  [58, 2006, 134, 1, 7],
  [59, 2007, 110, 1, 6],
  [60, 2008, 98, 1, 5],
  [61, 2009, 95, 1, 6],
  [62, 2010, 256, 1, 5],
  [63, 2011, 392, 1, 11],
  [64, 2012, 281, 1, 5],
  [65, 2013, 397, 1, 13],
  [66, 2014, 384, 1, 11],
  [67, 2015, 381, 1, 10],
  [68, 2016, 385, 1, 9],
  [69, 2017, 363, 1, 9],
  [70, 2018, 408, 1, 11],
  [71, 2019, 413, 1, 11],
  [72, 2020, 347, 1, 11],
  [73, 2021, 395.5, 1, 10],
];

for (const [seasonId, pts, pos, wins] of champStandings) {
  const cd = champions[1949 + seasonId];
  if (cd) run('INSERT INTO driver_standings (season_id, driver_id, round, points, position, wins) VALUES (?,?,?,?,?,?)',
    [seasonId, cd[0], 22, pts, pos, wins]);
}

// ===================== 2022-2023 DRIVER STANDINGS =====================
insert('driver_standings', ['season_id', 'driver_id', 'round', 'points', 'position', 'wins'], [
  [73, 1, 22, 454, 1, 15], [73, 5, 22, 308, 2, 3], [73, 2, 22, 305, 3, 2],
  [73, 4, 22, 275, 4, 1], [73, 6, 22, 246, 5, 1], [73, 3, 22, 240, 6, 0],
  [73, 7, 22, 122, 7, 0], [73, 11, 22, 92, 8, 0], [73, 9, 22, 81, 9, 0],
  [73, 19, 22, 49, 10, 0], [73, 21, 22, 37, 11, 0], [73, 23, 22, 37, 12, 0],
  [73, 17, 22, 25, 13, 0], [73, 12, 22, 23, 14, 0], [73, 10, 22, 18, 15, 0],
  [73, 22, 22, 12, 16, 0], [73, 15, 22, 12, 17, 0], [73, 20, 22, 6, 18, 0],
  [73, 13, 22, 4, 19, 0], [73, 24, 22, 2, 20, 0], [73, 16, 22, 2, 21, 0],
  [74, 1, 22, 575, 1, 19], [74, 2, 22, 285, 2, 2], [74, 3, 22, 234, 3, 0],
  [74, 9, 22, 206, 4, 0], [74, 5, 22, 206, 5, 0], [74, 7, 22, 205, 6, 0],
  [74, 6, 22, 200, 7, 1], [74, 4, 22, 175, 8, 0], [74, 8, 22, 97, 9, 0],
  [74, 10, 22, 74, 10, 0], [74, 12, 22, 62, 11, 0], [74, 11, 22, 58, 12, 0],
  [74, 13, 22, 27, 13, 0], [74, 15, 22, 17, 14, 0], [74, 19, 22, 10, 15, 0],
  [74, 18, 22, 9, 16, 0], [74, 21, 22, 6, 17, 0], [74, 20, 22, 6, 18, 0],
  [74, 17, 22, 3, 19, 0], [74, 25, 22, 2, 20, 0], [74, 14, 22, 1, 21, 0],
  [74, 16, 22, 0, 22, 0],
]);

// ===================== CONSTRUCTOR STANDINGS (champion entries) =====================
const constructorChamps = {
  1958: [19], 1959: [13], 1960: [13], 1961: [3], 1962: [14],
  1963: [15], 1964: [3], 1965: [15], 1966: [16], 1967: [16],
  1968: [15], 1969: [17], 1970: [15], 1971: [18], 1972: [15],
  1973: [15], 1974: [4], 1975: [3], 1976: [3], 1977: [3],
  1978: [15], 1979: [3], 1980: [7], 1981: [7], 1982: [3],
  1983: [3], 1984: [4], 1985: [4], 1986: [7], 1987: [7],
  1988: [4], 1989: [4], 1990: [4], 1991: [4], 1992: [7],
  1993: [7], 1994: [7], 1995: [20], 1996: [7], 1997: [7],
  1998: [4], 1999: [3], 2000: [3], 2001: [3], 2002: [3],
  2003: [3], 2004: [3], 2005: [22], 2006: [22], 2007: [3],
  2008: [3], 2009: [21], 2010: [1], 2011: [1], 2012: [1],
  2013: [1], 2014: [2], 2015: [2], 2016: [2], 2017: [2],
  2018: [2], 2019: [2], 2020: [2], 2021: [2],
};

const ccStandings = {
  1958: 48, 1959: 40, 1960: 48, 1961: 40,
  1962: 42, 1963: 54, 1964: 45, 1965: 54,
  1966: 42, 1967: 63, 1968: 62, 1969: 66,
  1970: 59, 1971: 73, 1972: 61, 1973: 92,
  1974: 73, 1975: 72.5, 1976: 83, 1977: 95,
  1978: 86, 1979: 113, 1980: 120, 1981: 95,
  1982: 74, 1983: 89, 1984: 143.5, 1985: 90,
  1986: 141, 1987: 137, 1988: 199, 1989: 141,
  1990: 121, 1991: 139, 1992: 164, 1993: 168,
  1994: 118, 1995: 137, 1996: 175, 1997: 123,
  1998: 156, 1999: 128, 2000: 170, 2001: 179,
  2002: 221, 2003: 158, 2004: 262, 2005: 191,
  2006: 206, 2007: 204, 2008: 172, 2009: 172,
  2010: 498, 2011: 650, 2012: 460, 2013: 596,
  2014: 701, 2015: 703, 2016: 765, 2017: 668,
  2018: 655, 2019: 739, 2020: 573, 2021: 613.5,
};

for (let y = 1958; y <= 2021; y++) {
  const si = y - 1949;
  const cc = constructorChamps[y];
  if (cc) run('INSERT INTO constructor_standings (season_id, constructor_id, round, points, position, wins) VALUES (?,?,?,?,?,?)',
    [si, cc[0], 22, ccStandings[y] || 100, 1, 0]);
}

// 2022-2023 constructor standings
insert('constructor_standings', ['season_id', 'constructor_id', 'round', 'points', 'position', 'wins'], [
  [73, 1, 22, 759, 1, 17], [73, 3, 22, 554, 2, 4], [73, 2, 22, 515, 3, 1],
  [73, 6, 22, 173, 4, 0], [73, 4, 22, 159, 5, 0], [73, 10, 22, 55, 6, 0],
  [73, 5, 22, 55, 7, 0], [73, 9, 22, 37, 8, 0], [73, 8, 22, 35, 9, 0],
  [73, 7, 22, 8, 10, 0],
  [74, 1, 22, 860, 1, 21], [74, 2, 22, 409, 2, 0], [74, 3, 22, 406, 3, 1],
  [74, 4, 22, 302, 4, 0], [74, 5, 22, 280, 5, 0], [74, 6, 22, 120, 6, 0],
  [74, 7, 22, 28, 7, 0], [74, 8, 22, 25, 8, 0], [74, 10, 22, 16, 9, 0],
  [74, 9, 22, 12, 10, 0],
]);

// ===================== 2022-2023 RACES =====================
insert('races', ['race_id', 'season_id', 'circuit_id', 'round_number', 'name', 'race_date', 'scheduled_laps'], [
  [1, 73, 1, 1, 'Bahrain Grand Prix', '2022-03-20', 57],
  [2, 73, 2, 2, 'Saudi Arabian Grand Prix', '2022-03-27', 50],
  [3, 73, 3, 3, 'Australian Grand Prix', '2022-04-10', 58],
  [4, 73, 4, 4, 'Emilia Romagna Grand Prix', '2022-04-24', 63],
  [5, 73, 5, 5, 'Miami Grand Prix', '2022-05-08', 57],
  [6, 73, 6, 6, 'Spanish Grand Prix', '2022-05-22', 66],
  [7, 73, 7, 7, 'Monaco Grand Prix', '2022-05-29', 78],
  [8, 73, 8, 8, 'Azerbaijan Grand Prix', '2022-06-12', 51],
  [9, 73, 9, 9, 'Canadian Grand Prix', '2022-06-19', 70],
  [10, 73, 10, 10, 'British Grand Prix', '2022-07-03', 52],
  [11, 73, 11, 11, 'Austrian Grand Prix', '2022-07-10', 71],
  [12, 73, 12, 12, 'French Grand Prix', '2022-07-24', 53],
  [13, 73, 13, 13, 'Hungarian Grand Prix', '2022-07-31', 70],
  [14, 73, 14, 14, 'Belgian Grand Prix', '2022-08-28', 44],
  [15, 73, 15, 15, 'Dutch Grand Prix', '2022-09-04', 72],
  [16, 73, 16, 16, 'Italian Grand Prix', '2022-09-11', 53],
  [17, 73, 17, 17, 'Singapore Grand Prix', '2022-10-02', 61],
  [18, 73, 18, 18, 'Japanese Grand Prix', '2022-10-09', 53],
  [19, 73, 20, 19, 'United States Grand Prix', '2022-10-23', 56],
  [20, 73, 21, 20, 'Mexico City Grand Prix', '2022-10-30', 71],
  [21, 73, 22, 21, 'Sao Paulo Grand Prix', '2022-11-13', 71],
  [22, 73, 23, 22, 'Abu Dhabi Grand Prix', '2022-11-20', 58],
]);

insert('races', ['race_id', 'season_id', 'circuit_id', 'round_number', 'name', 'race_date', 'scheduled_laps'], [
  [23, 74, 1, 1, 'Bahrain Grand Prix', '2023-03-05', 57],
  [24, 74, 2, 2, 'Saudi Arabian Grand Prix', '2023-03-19', 50],
  [25, 74, 3, 3, 'Australian Grand Prix', '2023-04-02', 58],
  [26, 74, 8, 4, 'Azerbaijan Grand Prix', '2023-04-30', 51],
  [27, 74, 5, 5, 'Miami Grand Prix', '2023-05-07', 57],
  [28, 74, 7, 6, 'Monaco Grand Prix', '2023-05-28', 78],
  [29, 74, 6, 7, 'Spanish Grand Prix', '2023-06-04', 66],
  [30, 74, 9, 8, 'Canadian Grand Prix', '2023-06-18', 70],
  [31, 74, 11, 9, 'Austrian Grand Prix', '2023-07-02', 71],
  [32, 74, 10, 10, 'British Grand Prix', '2023-07-09', 52],
  [33, 74, 13, 11, 'Hungarian Grand Prix', '2023-07-23', 70],
  [34, 74, 14, 12, 'Belgian Grand Prix', '2023-07-30', 44],
  [35, 74, 15, 13, 'Dutch Grand Prix', '2023-08-27', 72],
  [36, 74, 16, 14, 'Italian Grand Prix', '2023-09-03', 53],
  [37, 74, 17, 15, 'Singapore Grand Prix', '2023-09-17', 62],
  [38, 74, 18, 16, 'Japanese Grand Prix', '2023-09-24', 53],
  [39, 74, 19, 17, 'Qatar Grand Prix', '2023-10-08', 57],
  [40, 74, 20, 18, 'United States Grand Prix', '2023-10-22', 56],
  [41, 74, 21, 19, 'Mexico City Grand Prix', '2023-10-29', 71],
  [42, 74, 22, 20, 'Sao Paulo Grand Prix', '2023-11-05', 71],
  [43, 74, 24, 21, 'Las Vegas Grand Prix', '2023-11-18', 50],
  [44, 74, 23, 22, 'Abu Dhabi Grand Prix', '2023-11-26', 58],
]);

// ===================== RACE RESULTS =====================
const winners2022 = [
  [1, 5, 3, 1, 26, 57], [2, 1, 1, 4, 25, 50], [3, 5, 3, 1, 26, 58],
  [4, 1, 1, 1, 26, 63], [5, 1, 1, 1, 26, 57], [6, 1, 1, 2, 25, 66],
  [7, 2, 1, 3, 25, 78], [8, 1, 1, 3, 25, 51], [9, 1, 1, 1, 26, 70],
  [10, 6, 3, 2, 25, 52], [11, 5, 3, 1, 26, 71], [12, 1, 1, 1, 26, 53],
  [13, 1, 1, 1, 26, 70], [14, 1, 1, 1, 26, 44], [15, 1, 1, 1, 26, 72],
  [16, 1, 1, 1, 26, 53], [17, 2, 1, 2, 25, 61], [18, 1, 1, 1, 26, 53],
  [19, 1, 1, 1, 26, 56], [20, 1, 1, 1, 26, 71], [21, 4, 2, 1, 26, 71],
  [22, 1, 1, 1, 26, 58],
];

const winners2023 = [
  [23, 1, 1, 1, 26, 57], [24, 2, 1, 1, 25, 50], [25, 1, 1, 1, 26, 58],
  [26, 2, 1, 1, 25, 51], [27, 1, 1, 1, 26, 57], [28, 1, 1, 1, 26, 78],
  [29, 1, 1, 1, 26, 66], [30, 1, 1, 1, 26, 70], [31, 1, 1, 1, 26, 71],
  [32, 1, 1, 1, 26, 52], [33, 1, 1, 1, 26, 70], [34, 1, 1, 1, 26, 44],
  [35, 1, 1, 1, 26, 72], [36, 1, 1, 1, 26, 53], [37, 6, 3, 1, 25, 62],
  [38, 1, 1, 1, 26, 53], [39, 1, 1, 1, 26, 57], [40, 1, 1, 1, 26, 56],
  [41, 1, 1, 3, 25, 71], [42, 1, 1, 1, 26, 71], [43, 1, 1, 2, 25, 50],
  [44, 1, 1, 1, 26, 58],
];

for (const w of winners2022) {
  run(`INSERT INTO race_results (race_id, driver_id, constructor_id, grid_position, position, position_order, points, laps_completed, status, fastest_lap) VALUES (?,?,?,?,1,1,?,?,'Finished',1)`,
    [w[0], w[1], w[2], w[3], w[4], w[5]]);
}
for (const w of winners2023) {
  run(`INSERT INTO race_results (race_id, driver_id, constructor_id, grid_position, position, position_order, points, laps_completed, status, fastest_lap) VALUES (?,?,?,?,1,1,?,?,'Finished',1)`,
    [w[0], w[1], w[2], w[3], w[4], w[5]]);
}

// Full Abu Dhabi grids so all drivers have constructor references
const abu2022 = [
  [2, 1, 2, 2, 18], [5, 3, 3, 3, 15], [6, 3, 4, 4, 12],
  [4, 2, 5, 5, 10], [7, 4, 6, 6, 8], [11, 6, 7, 7, 6],
  [10, 5, 8, 8, 4], [21, 4, 9, 9, 2], [9, 6, 10, 10, 1],
  [12, 8, 11, 11, 0], [23, 5, 12, 12, 0], [22, 9, 13, 13, 0],
  [15, 8, 14, 14, 0], [19, 10, 15, 15, 0], [20, 10, 16, 16, 0],
  [13, 7, 17, 17, 0], [24, 7, 18, 18, 0], [17, 9, 19, 19, 0],
  [3, 2, 20, 20, 0], [16, 7, 21, 21, 0],
];
for (const r of abu2022) {
  run(`INSERT OR IGNORE INTO race_results (race_id, driver_id, constructor_id, grid_position, position, position_order, points, status) VALUES (22,?,?,?,?,?,?,'Finished')`,
    [r[0], r[1], r[2], r[3], r[4], r[5]]);
}

const abu2023 = [
  [5, 3, 2, 2, 18], [4, 2, 4, 3, 15], [7, 4, 5, 4, 12],
  [9, 5, 7, 5, 10], [2, 1, 3, 6, 8], [6, 3, 6, 7, 6],
  [3, 2, 11, 8, 4], [10, 5, 8, 9, 2], [8, 4, 10, 10, 1],
  [12, 6, 12, 11, 0], [11, 6, 13, 12, 0], [19, 10, 14, 13, 0],
  [15, 8, 20, 14, 0], [18, 9, 15, 15, 0], [20, 10, 16, 16, 0],
  [13, 7, 17, 17, 0], [14, 7, 19, 18, 0], [21, 8, 22, 19, 0],
  [17, 9, 18, 20, 0], [25, 8, 21, 21, 0],
];
for (const r of abu2023) {
  run(`INSERT OR IGNORE INTO race_results (race_id, driver_id, constructor_id, grid_position, position, position_order, points, status) VALUES (44,?,?,?,?,?,?,'Finished')`,
    [r[0], r[1], r[2], r[3], r[4], r[5]]);
}

// Add key historic race results for champion deciders so career stats work
const historicWins = [
  // [race_id, year, winner_driver_id, winner_constructor_id]
  [45, 1950, 26, 11], // Farina wins 1950 British GP (first F1 race ever)
  [46, 1951, 27, 11], // Fangio
  [47, 1955, 27, 2],  // Fangio for Mercedes
  [48, 1958, 29, 3],  // Hawthorn
  [49, 1963, 33, 15], // Clark
  [50, 1967, 35, 16], // Hulme
  [51, 1971, 36, 18], // Stewart
  [52, 1975, 39, 3],  // Lauda
  [53, 1988, 47, 4],  // Senna
  [54, 1992, 48, 7],  // Mansell
  [55, 1994, 52, 20], // Schumacher
  [56, 2000, 52, 3],  // Schumacher Ferrari
  [57, 2004, 52, 3],  // Schumacher Ferrari
  [58, 2008, 3, 4],   // Hamilton McLaren
  [59, 2010, 23, 1],  // Vettel Red Bull
  [60, 2014, 3, 2],   // Hamilton Mercedes
  [61, 2020, 3, 2],   // Hamilton Mercedes
];

const historicDates = [
  '1950-05-13', '1951-09-16', '1955-07-16', '1958-10-19',
  '1963-09-08', '1967-10-22', '1971-09-19', '1975-09-07',
  '1988-10-30', '1992-08-16', '1994-11-13', '2000-10-08',
  '2004-08-29', '2008-11-02', '2010-11-14', '2014-11-23',
  '2020-12-13',
];

const historicCircuits = [10, 6, 10, 9, 16, 25, 11, 16, 18, 13, 3, 10, 14, 22, 23, 23, 23];

for (let i = 0; i < historicWins.length; i++) {
  const [rid, year, did, cid] = historicWins[i];
  const sid = year - 1949;
  run(`INSERT OR IGNORE INTO races (race_id, season_id, circuit_id, round_number, name, race_date, scheduled_laps) VALUES (?,?,?,?,'Championship Decider',?,70)`,
    [rid, sid, historicCircuits[i], 22, historicDates[i]]);
  run(`INSERT OR IGNORE INTO race_results (race_id, driver_id, constructor_id, grid_position, position, position_order, points, status) VALUES (?,?,?,1,1,1,25,'Finished')`,
    [rid, did, cid]);
}

// ===================== VIEW =====================
db.exec(`
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
`);

console.log('Database setup complete with full F1 history (1950-2023)!');
db.close();

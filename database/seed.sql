USE f1_analytics;

-- =============================================
-- SEASONS
-- =============================================
INSERT INTO seasons (season_id, year, total_races) VALUES
(1, 2022, 22),
(2, 2023, 22);

-- =============================================
-- CONSTRUCTORS
-- =============================================
INSERT INTO constructors (constructor_id, name, nationality, base_location, color) VALUES
(1, 'Red Bull Racing',   'Austrian',  'Milton Keynes, UK',   '#1e41b8'),
(2, 'Mercedes',          'German',    'Brackley, UK',        '#00d2be'),
(3, 'Ferrari',           'Italian',   'Maranello, Italy',    '#dc0000'),
(4, 'McLaren',           'British',   'Woking, UK',          '#ff8700'),
(5, 'Aston Martin',      'British',   'Silverstone, UK',     '#006f62'),
(6, 'Alpine',            'French',    'Enstone, UK',         '#0090ff'),
(7, 'Williams',          'British',   'Grove, UK',           '#005aff'),
(8, 'AlphaTauri',        'Italian',   'Faenza, Italy',       '#6692ff'),
(9, 'Haas',              'American',  'Kannapolis, USA',     '#b6babd'),
(10,'Alfa Romeo',        'Swiss',     'Hinwil, Switzerland', '#52e252');

-- =============================================
-- DRIVERS
-- =============================================
INSERT INTO drivers (driver_id, first_name, last_name, nationality, date_of_birth, driver_number, code) VALUES
(1,  'Max',         'Verstappen',    'Dutch',      '1997-09-30', 1,  'VER'),
(2,  'Sergio',      'Perez',         'Mexican',    '1990-01-26', 11, 'PER'),
(3,  'Lewis',       'Hamilton',      'British',    '1985-01-07', 44, 'HAM'),
(4,  'George',      'Russell',       'British',    '1998-02-15', 63, 'RUS'),
(5,  'Charles',     'Leclerc',       'Monegasque', '1997-10-16', 16, 'LEC'),
(6,  'Carlos',      'Sainz',         'Spanish',    '1994-09-01', 55, 'SAI'),
(7,  'Lando',       'Norris',        'British',    '1999-11-13', 4,  'NOR'),
(8,  'Oscar',       'Piastri',       'Australian', '2001-04-06', 81, 'PIA'),
(9,  'Fernando',    'Alonso',        'Spanish',    '1981-07-29', 14, 'ALO'),
(10, 'Lance',       'Stroll',        'Canadian',   '1998-10-29', 18, 'STR'),
(11, 'Esteban',     'Ocon',          'French',     '1996-09-17', 31, 'OCO'),
(12, 'Pierre',      'Gasly',         'French',     '1996-02-07', 10, 'GAS'),
(13, 'Alexander',   'Albon',         'Thai',       '1996-03-23', 23, 'ALB'),
(14, 'Logan',       'Sargeant',      'American',   '2000-12-31', 2,  'SAR'),
(15, 'Yuki',        'Tsunoda',       'Japanese',   '2000-05-11', 22, 'TSU'),
(16, 'Nyck',        'de Vries',      'Dutch',      '1995-02-06', 21, 'DEV'),
(17, 'Kevin',       'Magnussen',     'Danish',     '1992-10-05', 20, 'MAG'),
(18, 'Nico',        'Hulkenberg',    'German',     '1987-08-19', 27, 'HUL'),
(19, 'Valtteri',    'Bottas',        'Finnish',    '1989-08-28', 77, 'BOT'),
(20, 'Zhou',        'Guanyu',        'Chinese',    '1999-05-30', 24, 'ZHO'),
(21, 'Daniel',      'Ricciardo',     'Australian', '1989-07-01', 3,  'RIC'),
(22, 'Mick',        'Schumacher',    'German',     '1999-03-22', 47, 'MSC'),
(23, 'Sebastian',   'Vettel',        'German',     '1987-07-03', 5,  'VET'),
(24, 'Nicholas',    'Latifi',        'Canadian',   '1995-06-29', 6,  'LAT');

-- =============================================
-- CIRCUITS
-- =============================================
INSERT INTO circuits (circuit_id, name, location, country, length_km, lap_record_time) VALUES
(1,  'Bahrain International Circuit',     'Sakhir',       'Bahrain',       5.412, '1:31.447'),
(2,  'Jeddah Corniche Circuit',           'Jeddah',       'Saudi Arabia',  6.174, '1:30.734'),
(3,  'Albert Park Circuit',               'Melbourne',    'Australia',     5.278, '1:20.260'),
(4,  'Imola Circuit',                     'Imola',        'Italy',         4.909, '1:15.484'),
(5,  'Miami International Autodrome',     'Miami',        'USA',           5.412, '1:31.361'),
(6,  'Circuit de Barcelona-Catalunya',    'Barcelona',    'Spain',         4.675, '1:16.330'),
(7,  'Circuit de Monaco',                 'Monte Carlo',  'Monaco',        3.337, '1:12.909'),
(8,  'Baku City Circuit',                 'Baku',         'Azerbaijan',    6.003, '1:43.009'),
(9,  'Circuit Gilles Villeneuve',         'Montreal',     'Canada',        4.361, '1:13.078'),
(10, 'Silverstone Circuit',               'Silverstone',  'UK',            5.891, '1:27.097'),
(11, 'Red Bull Ring',                     'Spielberg',    'Austria',       4.318, '1:04.391'),
(12, 'Circuit Paul Ricard',               'Le Castellet', 'France',        5.842, '1:32.740'),
(13, 'Hungaroring',                       'Budapest',     'Hungary',       4.381, '1:16.627'),
(14, 'Circuit de Spa-Francorchamps',      'Spa',          'Belgium',       7.004, '1:44.701'),
(15, 'Circuit Zandvoort',                 'Zandvoort',    'Netherlands',   4.259, '1:11.097'),
(16, 'Monza Circuit',                     'Monza',        'Italy',         5.793, '1:21.046'),
(17, 'Marina Bay Street Circuit',         'Singapore',    'Singapore',     4.940, '1:41.905'),
(18, 'Suzuka International Racing Course','Suzuka',       'Japan',         5.807, '1:30.983'),
(19, 'Losail International Circuit',      'Lusail',       'Qatar',         5.380, '1:23.196'),
(20, 'Circuit of the Americas',           'Austin',       'USA',           5.513, '1:36.169'),
(21, 'Autodromo Hermanos Rodriguez',      'Mexico City',  'Mexico',        4.304, '1:17.774'),
(22, 'Interlagos Circuit',                'Sao Paulo',    'Brazil',        4.309, '1:10.540'),
(23, 'Yas Marina Circuit',                'Abu Dhabi',    'UAE',           5.281, '1:26.103');

-- =============================================
-- RACES 2022
-- =============================================
INSERT INTO races (race_id, season_id, circuit_id, round_number, name, race_date, scheduled_laps) VALUES
(1,  1, 1,  1,  'Bahrain Grand Prix',           '2022-03-20', 57),
(2,  1, 2,  2,  'Saudi Arabian Grand Prix',     '2022-03-27', 50),
(3,  1, 3,  3,  'Australian Grand Prix',        '2022-04-10', 58),
(4,  1, 4,  4,  'Emilia Romagna Grand Prix',    '2022-04-24', 63),
(5,  1, 5,  5,  'Miami Grand Prix',             '2022-05-08', 57),
(6,  1, 6,  6,  'Spanish Grand Prix',           '2022-05-22', 66),
(7,  1, 7,  7,  'Monaco Grand Prix',            '2022-05-29', 78),
(8,  1, 8,  8,  'Azerbaijan Grand Prix',        '2022-06-12', 51),
(9,  1, 9,  9,  'Canadian Grand Prix',          '2022-06-19', 70),
(10, 1, 10, 10, 'British Grand Prix',           '2022-07-03', 52),
(11, 1, 11, 11, 'Austrian Grand Prix',          '2022-07-10', 71),
(12, 1, 12, 12, 'French Grand Prix',            '2022-07-24', 53),
(13, 1, 13, 13, 'Hungarian Grand Prix',         '2022-07-31', 70),
(14, 1, 14, 14, 'Belgian Grand Prix',           '2022-08-28', 44),
(15, 1, 15, 15, 'Dutch Grand Prix',             '2022-09-04', 72),
(16, 1, 16, 16, 'Italian Grand Prix',           '2022-09-11', 53),
(17, 1, 17, 17, 'Singapore Grand Prix',         '2022-10-02', 61),
(18, 1, 18, 18, 'Japanese Grand Prix',          '2022-10-09', 53),
(19, 1, 20, 19, 'United States Grand Prix',     '2022-10-23', 56),
(20, 1, 21, 20, 'Mexico City Grand Prix',       '2022-10-30', 71),
(21, 1, 22, 21, 'Sao Paulo Grand Prix',         '2022-11-13', 71),
(22, 1, 23, 22, 'Abu Dhabi Grand Prix',         '2022-11-20', 58);

-- =============================================
-- RACES 2023
-- =============================================
INSERT INTO races (race_id, season_id, circuit_id, round_number, name, race_date, scheduled_laps) VALUES
(23, 2, 1,  1,  'Bahrain Grand Prix',           '2023-03-05', 57),
(24, 2, 2,  2,  'Saudi Arabian Grand Prix',     '2023-03-19', 50),
(25, 2, 3,  3,  'Australian Grand Prix',        '2023-04-02', 58),
(26, 2, 8,  4,  'Azerbaijan Grand Prix',        '2023-04-30', 51),
(27, 2, 5,  5,  'Miami Grand Prix',             '2023-05-07', 57),
(28, 2, 4,  6,  'Emilia Romagna Grand Prix',    '2023-05-21', 63),
(29, 2, 7,  7,  'Monaco Grand Prix',            '2023-05-28', 78),
(30, 2, 6,  8,  'Spanish Grand Prix',           '2023-06-04', 66),
(31, 2, 9,  9,  'Canadian Grand Prix',          '2023-06-18', 70),
(32, 2, 11, 10, 'Austrian Grand Prix',          '2023-07-02', 71),
(33, 2, 10, 11, 'British Grand Prix',           '2023-07-09', 52),
(34, 2, 13, 12, 'Hungarian Grand Prix',         '2023-07-23', 70),
(35, 2, 14, 13, 'Belgian Grand Prix',           '2023-07-30', 44),
(36, 2, 15, 14, 'Dutch Grand Prix',             '2023-08-27', 72),
(37, 2, 16, 15, 'Italian Grand Prix',           '2023-09-03', 53),
(38, 2, 17, 16, 'Singapore Grand Prix',         '2023-09-17', 62),
(39, 2, 18, 17, 'Japanese Grand Prix',          '2023-09-24', 53),
(40, 2, 19, 18, 'Qatar Grand Prix',             '2023-10-08', 57),
(41, 2, 20, 19, 'United States Grand Prix',     '2023-10-22', 56),
(42, 2, 21, 20, 'Mexico City Grand Prix',       '2023-10-29', 71),
(43, 2, 22, 21, 'Sao Paulo Grand Prix',         '2023-11-05', 71),
(44, 2, 23, 22, 'Abu Dhabi Grand Prix',         '2023-11-26', 58);

-- =============================================
-- RACE RESULTS – helper approach: We'll seed the final standings directly
-- for simplicity and correctness. Race-level results are generated via
-- the standings tables which are more reliable for query demonstrations.
-- =============================================

-- 2022 Driver Standings (final round 22)
INSERT INTO driver_standings (season_id, driver_id, round, points, position, wins) VALUES
(1, 1,  22, 454, 1,  15),
(1, 2,  22, 305, 2,  2),
(1, 5,  22, 308, 3,  3),
(1, 6,  22, 246, 4,  1),
(1, 3,  22, 240, 5,  0),
(1, 4,  22, 237, 6,  1),
(1, 7,  22, 122, 7,  0),
(1, 9,  22, 81,  8,  0),
(1, 11, 22, 92, 9,  0),
(1, 23, 22, 37, 10, 0),
(1, 19, 22, 49, 11, 0),
(1, 21, 22, 37, 12, 0),
(1, 23, 22, 37, 13, 0),
(1, 17, 22, 25, 14, 0),
(1, 12, 22, 23, 15, 0),
(1, 10, 22, 18, 16, 0),
(1, 22, 22, 12, 17, 0),
(1, 15, 22, 12, 18, 0),
(1, 20, 22, 6,  19, 0),
(1, 24, 22, 2,  20, 0);

-- 2022 Constructor Standings (final round 22)
INSERT INTO constructor_standings (season_id, constructor_id, round, points, position, wins) VALUES
(1, 1,  22, 759, 1, 17),
(1, 3,  22, 554, 2, 4),
(1, 2,  22, 515, 3, 1),
(1, 4,  22, 159, 4, 0),
(1, 6,  22, 173, 5, 0),
(1, 5,  22, 55,  6, 0),
(1, 10, 22, 55,  7, 0),
(1, 8,  22, 35,  8, 0),
(1, 9,  22, 37,  9, 0),
(1, 7,  22, 8,  10, 0);

-- 2023 Driver Standings (final round 22)
INSERT INTO driver_standings (season_id, driver_id, round, points, position, wins) VALUES
(2, 1,  22, 575, 1,  19),
(2, 2,  22, 285, 2,  2),
(2, 3,  22, 234, 3,  0),
(2, 9,  22, 206, 4,  0),
(2, 5,  22, 206, 5,  0),
(2, 7,  22, 205, 6,  0),
(2, 6,  22, 200, 7,  1),
(2, 4,  22, 175, 8,  0),
(2, 8,  22, 97,  9,  0),
(2, 10, 22, 74,  10, 0),
(2, 12, 22, 62,  11, 0),
(2, 11, 22, 58,  12, 0),
(2, 13, 22, 27,  13, 0),
(2, 15, 22, 17,  14, 0),
(2, 17, 22, 3,   15, 0),
(2, 19, 22, 10,  16, 0),
(2, 18, 22, 9,   17, 0),
(2, 20, 22, 6,   18, 0),
(2, 14, 22, 1,   19, 0),
(2, 21, 22, 6,   20, 0);

-- 2023 Constructor Standings (final round 22)
INSERT INTO constructor_standings (season_id, constructor_id, round, points, position, wins) VALUES
(2, 1,  22, 860, 1,  21),
(2, 2,  22, 409, 2,  0),
(2, 3,  22, 406, 3,  1),
(2, 4,  22, 302, 4,  0),
(2, 5,  22, 280, 5,  0),
(2, 6,  22, 120, 6,  0),
(2, 7,  22, 28,  7,  0),
(2, 8,  22, 25,  8,  0),
(2, 9,  22, 16,  9,  0),
(2, 10, 22, 16,  10, 0);

-- Update champions
UPDATE seasons SET champion_driver_id = 1, champion_constructor_id = 1 WHERE year = 2022;
UPDATE seasons SET champion_driver_id = 1, champion_constructor_id = 1 WHERE year = 2023;

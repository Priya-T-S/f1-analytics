from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import datetime

doc = Document()

# ── Page Setup ──
for section in doc.sections:
    section.orientation = WD_ORIENT.LANDSCAPE
    section.page_width = Cm(29.7)
    section.page_height = Cm(21.0)
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)
    section.left_margin = Cm(2.0)
    section.right_margin = Cm(2.0)

# ── Style Configuration ──
style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(10.5)
style.paragraph_format.space_after = Pt(4)
style.paragraph_format.line_spacing = 1.15

for level in range(1, 5):
    h = doc.styles[f'Heading {level}']
    h.font.name = 'Calibri'
    h.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)
    if level == 1:
        h.font.size = Pt(22)
        h.font.bold = True
    elif level == 2:
        h.font.size = Pt(16)
        h.font.bold = True
    elif level == 3:
        h.font.size = Pt(13)
        h.font.bold = True
    else:
        h.font.size = Pt(11)
        h.font.bold = True

def set_cell_shading(cell, color):
    shading_elm = OxmlElement('w:shd')
    shading_elm.set(qn('w:fill'), color)
    shading_elm.set(qn('w:val'), 'clear')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def add_table_row(table, cells_data, header=False):
    row = table.add_row()
    for i, text in enumerate(cells_data):
        cell = row.cells[i]
        p = cell.paragraphs[0]
        p.text = str(text)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        for run in p.runs:
            run.font.size = Pt(9)
            run.font.name = 'Calibri'
            if header:
                run.bold = True
        if header:
            set_cell_shading(cell, '1B3A5C')
            for run in p.runs:
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

def make_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0]
    for i, h in enumerate(headers):
        cell = hdr.cells[i]
        p = cell.paragraphs[0]
        p.text = h
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        for run in p.runs:
            run.font.size = Pt(9)
            run.font.name = 'Calibri'
            run.bold = True
        set_cell_shading(cell, '1B3A5C')
        for run in p.runs:
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for row_data in rows:
        add_table_row(table, row_data)
    return table

def add_bullet(doc, text, level=0, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent = Cm(1.0 + level * 0.8)
    if bold_prefix:
        run = p.add_run(bold_prefix)
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.name = 'Calibri'
        run2 = p.add_run(text)
        run2.font.size = Pt(10.5)
        run2.font.name = 'Calibri'
    else:
        run = p.add_run(text)
        run.font.size = Pt(10.5)
        run.font.name = 'Calibri'
    return p

def add_code_block(doc, code_text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(1.0)
    run = p.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    return p

# ═══════════════════════════════════════════════════════════════
# COVER PAGE
# ═══════════════════════════════════════════════════════════════
for _ in range(6):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('F1 ANALYTICS')
run.font.size = Pt(42)
run.font.bold = True
run.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)
run.font.name = 'Calibri'

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('Database Management System – Project Report')
run.font.size = Pt(18)
run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
run.font.name = 'Calibri'

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('A Full-Stack Formula 1 Statistics & Analytics Platform')
run.font.size = Pt(14)
run.font.italic = True
run.font.color.rgb = RGBColor(0x77, 0x77, 0x77)

doc.add_paragraph()

# Details table on cover
cover_info = [
    ('Project Domain', 'Database Management Systems & Web Application Development'),
    ('Database Engine', 'SQLite 3 (MySQL-compatible DDL)'),
    ('Backend Technology', 'Node.js + Express.js 4'),
    ('Frontend Technology', 'React 18 + Vite 5 + Recharts 2'),
    ('Academic Year', '2024–2025'),
    ('Report Date', datetime.date.today().strftime('%B %d, %Y')),
]
tbl = doc.add_table(rows=len(cover_info), cols=2)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (k, v) in enumerate(cover_info):
    c0 = tbl.rows[i].cells[0]
    c0.paragraphs[0].text = k
    for run in c0.paragraphs[0].runs:
        run.bold = True
        run.font.size = Pt(11)
        run.font.name = 'Calibri'
    c1 = tbl.rows[i].cells[1]
    c1.paragraphs[0].text = v
    for run in c1.paragraphs[0].runs:
        run.font.size = Pt(11)
        run.font.name = 'Calibri'

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# TABLE OF CONTENTS (manual)
# ═══════════════════════════════════════════════════════════════
doc.add_heading('Table of Contents', level=1)
toc_items = [
    '1. Introduction & Project Overview',
    '2. System Architecture',
    '3. Database Schema – Entity Relationship Model',
    '4. Detailed Table Definitions (DDL)',
    '5. Data Types & Constraint Analysis',
    '6. Normalization Analysis',
    '7. Seed Data & Sample Records',
    '8. Views – Logical Abstraction Layer',
    '9. Indexes & Performance Optimization',
    '10. Analytical SQL Queries (12 Queries)',
    '11. Backend API – Database Integration',
    '12. Frontend Application – Data Visualization',
    '13. Transaction Management & Concurrency',
    '14. Security Considerations',
    '15. Limitations & Future Enhancements',
    '16. Conclusion',
    'Appendix A: Complete DDL Script',
    'Appendix B: Complete Seed Data Script',
    'Appendix C: View Definitions',
    'Appendix D: Query Reference',
    'Appendix E: API Endpoint Reference',
]
for item in toc_items:
    p = doc.add_paragraph()
    run = p.add_run(item)
    run.font.size = Pt(11)
    run.font.name = 'Calibri'
    p.paragraph_format.space_after = Pt(2)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 1. INTRODUCTION
# ═══════════════════════════════════════════════════════════════
doc.add_heading('1. Introduction & Project Overview', level=1)

doc.add_heading('1.1 Project Description', level=2)
doc.add_paragraph(
    'F1 Analytics is a full-stack web application designed to store, retrieve, and analyze '
    'Formula 1 racing data across the 2022 and 2023 seasons. The system provides interactive '
    'dashboards, driver and constructor standings, race results, head-to-head comparisons, '
    'and statistical leaderboards through a modern web interface powered by a relational database backend.'
)

doc.add_heading('1.2 Objectives', level=2)
objectives = [
    'Design and implement a normalized relational database for Formula 1 racing data.',
    'Demonstrate advanced SQL concepts including window functions, CTEs, views, and multi-table joins.',
    'Build a RESTful API layer to decouple the database from the presentation tier.',
    'Create an interactive React-based frontend for data visualization and exploration.',
    'Seed the system with real-world F1 data spanning two complete seasons.',
    'Provide 12 analytical queries that demonstrate a wide range of DBMS capabilities.',
]
for obj in objectives:
    add_bullet(doc, obj)

doc.add_heading('1.3 Technology Stack', level=2)
tech_data = [
    ['Database', 'SQLite 3', 'better-sqlite3 v12', 'Embedded relational DB with WAL mode; MySQL-compatible DDL'],
    ['Backend', 'Node.js 18+', 'Express.js 4.18', 'RESTful API server on port 5000'],
    ['Frontend', 'React 18', 'Vite 5 / Recharts 2', 'SPA with client-side routing, charting'],
    ['Libraries', 'Axios / dotenv / cors', '—', 'HTTP client, environment config, CORS middleware'],
]
make_table(doc, ['Layer', 'Technology', 'Version', 'Purpose'], tech_data)

doc.add_heading('1.4 Directory Structure', level=2)
add_code_block(doc, '''f1-analytics/
├── backend/
│   ├── .env                          # Environment variables (DB_PATH, PORT)
│   ├── f1_analytics.db               # SQLite database file
│   ├── package.json
│   └── src/
│       ├── app.js                    # Express entry point
│       ├── config/
│       │   ├── db.js                 # SQLite connection + WAL pragma
│       │   └── setup-db.js           # Database initialization helper
│       ├── controllers/              # 6 controllers (drivers, constructors, circuits, races, standings, stats)
│       ├── middleware/
│       │   └── errorHandler.js       # Global error handling
│       ├── models/
│       │   └── query.js              # Parameterized query wrapper
│       └── routes/                   # 7 route files + index router
├── database/
│   ├── schema.sql                    # Full DDL (8 tables, 6 indexes)
│   ├── seed.sql                      # 216 lines of seed data
│   ├── queries.sql                   # 12 analytical SQL queries
│   └── views.sql                    # 4 view definitions
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js                # Dev proxy /api -> localhost:5000
    └── src/
        ├── App.jsx                   # 12 React Router routes
        ├── api/client.js             # Axios instance
        ├── components/               # 8 component directories
        └── pages/                    # 12 page components''')

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 2. SYSTEM ARCHITECTURE
# ═══════════════════════════════════════════════════════════════
doc.add_heading('2. System Architecture', level=1)

doc.add_heading('2.1 Three-Tier Architecture', level=2)
doc.add_paragraph(
    'The application follows a classic three-tier architecture, ensuring separation of concerns '
    'between data management, business logic, and user interface.'
)

arch_data = [
    ['Presentation Tier\n(Frontend)', 'React SPA\nPort 3000', 'React Router v6\nRecharts\nAxios', 'UI rendering, routing,\ndata visualization,\nAPI calls'],
    ['Application Tier\n(Backend)', 'Express.js API\nPort 5000', '6 Controllers\n7 Route groups\nQuery Model', 'REST endpoints,\nbusiness logic,\ndatabase queries,\nerror handling'],
    ['Data Tier\n(Database)', 'SQLite 3\n(f1_analytics.db)', '8 Tables\n4 Views\n6 Indexes\n24 Drivers\n10 Constructors\n23 Circuits\n44 Races', 'Data persistence,\nintegrity constraints,\nanalytical queries,\nWAL concurrency'],
]
make_table(doc, ['Tier', 'Technology', 'Components', 'Responsibilities'], arch_data)

doc.add_heading('2.2 Request-Response Flow', level=2)
add_code_block(doc, '''Browser (React)                         Express API                         SQLite
      │                                      │                                │
      │── GET /api/drivers ──────────────────>│                                │
      │                                      │── query("SELECT ...") ────────>│
      │                                      │<────── JSON result ────────────│
      │<───── JSON Response ─────────────────│                                │
      │                                      │                                │
      │── GET /api/standings?year=2023 ──────>│                                │
      │                                      │── query("SELECT ...") ────────>│
      │                                      │<────── JSON result ────────────│
      │<───── JSON Response ─────────────────│                                │
      │                                      │                                │
      └── Recharts renders charts ───────────┘                                └── WAL mode''')

doc.add_heading('2.3 Database Connection Configuration', level=2)
add_code_block(doc, '''// backend/src/config/db.js
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'f1_analytics.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');      // Write-Ahead Logging for concurrent reads
db.pragma('foreign_keys = ON');       // Enforce referential integrity

module.exports = db;''')

doc.add_heading('2.4 Query Execution Model', level=2)
add_code_block(doc, '''// backend/src/models/query.js
const db = require('../config/db');

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
    return stmt.all(...params);    // Returns array of objects
  }
  return stmt.run(...params);      // DML: returns { changes, lastInsertRowid }
}

module.exports = { query };''')

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 3. ER MODEL
# ═══════════════════════════════════════════════════════════════
doc.add_heading('3. Database Schema – Entity Relationship Model', level=1)

doc.add_heading('3.1 Entity Relationship Diagram (Textual)', level=2)
add_code_block(doc, '''  ┌──────────┐       ┌──────────┐       ┌────────────────┐
  │ SEASONS  │──1──<│  RACES   │──1──<│  RACE_RESULTS  │>──1──│  DRIVERS     │
  │──────────│      │──────────│       │────────────────│      │──────────────│
  │season_id │      │race_id   │       │result_id       │      │driver_id     │
  │year      │      │season_id │       │race_id     (FK)│      │first_name    │
  │total_races│     │circuit_id│       │driver_id   (FK)│      │last_name     │
  │champion_ │      │round_num │       │constructor(FK) │      │nationality   │
  │  _driver │      │race_date │       │grid_position   │      │date_of_birth │
  │champion_ │      │weather   │       │position        │      │driver_number │
  │  _constr │      │sched_laps│       │points          │      │code          │
  └──────────┘      └────┬─────┘       │fastest_lap     │      └──────────────┘
                         │             │status          │             │
                         │             └────────────────┘             │
                         │                    │                       │
                    ┌────┴─────┐        ┌──────┴──────┐         ┌────┴──────────┐
                    │ CIRCUITS │        │CONSTRUCTORS │         │  LAP_TIMES    │
                    │──────────│        │─────────────│         │───────────────│
                    │circuit_id│        │constructor  │         │lap_time_id    │
                    │name      │        │  _id        │         │race_id   (FK) │
                    │location  │        │name         │         │driver_id (FK) │
                    │country   │        │nationality  │         │lap_number     │
                    │length_km │        │base_location│         │lap_time       │
                    │lap_record│        │color        │         │lap_position   │
                    │  _time   │        └─────────────┘         └───────────────┘
                    └──────────┘                                       │
                         │                                       ┌────┴──────────┐
                         │                                       │  PIT_STOPS    │
                    ┌────┴────────────────────────┐              │───────────────│
                    │ lap_record_driver_id (FK)    │              │pit_stop_id    │
                    │ ───────> drivers(driver_id)  │              │race_id   (FK) │
                    └──────────────────────────────┘              │driver_id (FK) │
                                                                  │stop_number    │
  ┌─────────────────────┐        ┌─────────────────────────┐      │lap            │
  │ DRIVER_STANDINGS    │        │ CONSTRUCTOR_STANDINGS   │      │duration       │
  │─────────────────────│        │─────────────────────────│      └───────────────┘
  │standing_id          │        │standing_id              │
  │season_id       (FK) │        │season_id           (FK) │
  │driver_id       (FK) │        │constructor_id     (FK)  │
  │round                │        │round                    │
  │points               │        │points                   │
  │position             │        │position                 │
  │wins                 │        │wins                     │
  └─────────────────────┘        └─────────────────────────┘''')

doc.add_heading('3.2 Entity Summary', level=2)
ent_data = [
    ['seasons', 'season_id (PK)', 'year, total_races, champion_driver_id (FK), champion_constructor_id (FK)', '2', 'Temporal container for championship years'],
    ['drivers', 'driver_id (PK)', 'first_name, last_name, nationality, date_of_birth, driver_number (UQ), code (UQ)', '24', 'Individual F1 driver profiles'],
    ['constructors', 'constructor_id (PK)', 'name (UQ), nationality, base_location, logo_url, color', '10', 'F1 team constructors'],
    ['circuits', 'circuit_id (PK)', 'name, location, country, length_km, lap_record_time, lap_record_driver_id (FK)', '23', 'Race circuits with metadata'],
    ['races', 'race_id (PK)', 'season_id (FK), circuit_id (FK), round_number, name, race_date, weather_condition, scheduled_laps', '44', 'Individual grand prix events'],
    ['race_results', 'result_id (PK)', 'race_id (FK), driver_id (FK), constructor_id (FK), grid_position, position, position_order, points, laps_completed, fastest_lap, status (ENUM)', '~200', 'Per-driver race outcome records'],
    ['lap_times', 'lap_time_id (PK)', 'race_id (FK), driver_id (FK), lap_number, lap_time, lap_position', '0*', 'Individual lap timing data'],
    ['pit_stops', 'pit_stop_id (PK)', 'race_id (FK), driver_id (FK), stop_number, lap, duration', '0*', 'Pit stop event data'],
    ['driver_standings', 'standing_id (PK)', 'season_id (FK), driver_id (FK), round, points, position, wins', '39', 'Cumulative driver standings per round'],
    ['constructor_standings', 'standing_id (PK)', 'season_id (FK), constructor_id (FK), round, points, position, wins', '20', 'Cumulative constructor standings per round'],
]
make_table(doc, ['Entity', 'Primary Key', 'Key Attributes', 'Rows', 'Description'], ent_data)
p = doc.add_paragraph()
run = p.add_run('* lap_times and pit_stops tables are defined in the schema but not seeded with sample data — they demonstrate the schema\'s extensibility for granular telemetry and strategy analysis.')
run.font.size = Pt(9)
run.font.italic = True

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 4. DETAILED TABLE DEFINITIONS
# ═══════════════════════════════════════════════════════════════
doc.add_heading('4. Detailed Table Definitions (DDL)', level=1)

# seasons
doc.add_heading('4.1 seasons', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['season_id', 'INT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique season identifier'],
    ['year', 'YEAR(4)', 'NOT NULL, UNIQUE', 'Calendar year of the season'],
    ['total_races', 'INT', 'NOT NULL, DEFAULT 0', 'Number of races in the season'],
    ['champion_driver_id', 'INT', 'NULL, FOREIGN KEY → drivers(driver_id)', 'Season\'s drivers\' champion'],
    ['champion_constructor_id', 'INT', 'NULL, FOREIGN KEY → constructors(constructor_id)', 'Season\'s constructors\' champion'],
])

# drivers
doc.add_heading('4.2 drivers', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['driver_id', 'INT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique driver identifier'],
    ['first_name', 'VARCHAR(50)', 'NOT NULL', 'Driver\'s given name'],
    ['last_name', 'VARCHAR(50)', 'NOT NULL', 'Driver\'s family name'],
    ['nationality', 'VARCHAR(50)', 'NULL', 'Nationality (e.g., Dutch, British)'],
    ['date_of_birth', 'DATE', 'NULL', 'Driver date of birth'],
    ['driver_number', 'INT', 'UNIQUE', 'Permanent race number'],
    ['code', 'CHAR(3)', 'UNIQUE', 'Three-letter FIA driver code (e.g., VER)'],
    ['image_url', 'VARCHAR(255)', 'NULL', 'URL to driver profile image'],
])

# constructors
doc.add_heading('4.3 constructors', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['constructor_id', 'INT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique constructor identifier'],
    ['name', 'VARCHAR(100)', 'NOT NULL, UNIQUE', 'Constructor/team name'],
    ['nationality', 'VARCHAR(50)', 'NULL', 'Country of origin'],
    ['base_location', 'VARCHAR(100)', 'NULL', 'Factory base location'],
    ['logo_url', 'VARCHAR(255)', 'NULL', 'URL to team logo'],
    ['color', 'VARCHAR(7)', 'DEFAULT \'#ffffff\'', 'Hex color code for UI theming'],
])

# circuits
doc.add_heading('4.4 circuits', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['circuit_id', 'INT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique circuit identifier'],
    ['name', 'VARCHAR(100)', 'NOT NULL', 'Circuit name'],
    ['location', 'VARCHAR(100)', 'NULL', 'City/region of circuit'],
    ['country', 'VARCHAR(50)', 'NULL', 'Country where circuit is located'],
    ['length_km', 'DECIMAL(6,3)', 'NULL', 'Circuit length in kilometers'],
    ['lap_record_time', 'VARCHAR(20)', 'NULL', 'Official lap record time'],
    ['lap_record_driver_id', 'INT', 'FOREIGN KEY → drivers(driver_id)', 'Driver who holds the lap record'],
    ['image_url', 'VARCHAR(255)', 'NULL', 'URL to circuit image'],
])

# races
doc.add_heading('4.5 races', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['race_id', 'INT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique race identifier'],
    ['season_id', 'INT', 'NOT NULL, FOREIGN KEY → seasons(season_id)', 'Season the race belongs to'],
    ['circuit_id', 'INT', 'NOT NULL, FOREIGN KEY → circuits(circuit_id)', 'Circuit where race is held'],
    ['round_number', 'INT', 'NOT NULL', 'Round number within the season'],
    ['name', 'VARCHAR(100)', 'NOT NULL', 'Race name (e.g., Bahrain Grand Prix)'],
    ['race_date', 'DATE', 'NOT NULL', 'Date of the race'],
    ['weather_condition', 'VARCHAR(20)', 'DEFAULT \'Dry\'', 'Weather during the race'],
    ['scheduled_laps', 'INT', 'NULL', 'Number of scheduled laps'],
    ['', '', 'UNIQUE(season_id, round_number)', 'Ensures one race per round per season'],
])

# race_results
doc.add_heading('4.6 race_results', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['result_id', 'INT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique result identifier'],
    ['race_id', 'INT', 'NOT NULL, FOREIGN KEY → races(race_id)', 'Race reference'],
    ['driver_id', 'INT', 'NOT NULL, FOREIGN KEY → drivers(driver_id)', 'Driver reference'],
    ['constructor_id', 'INT', 'NOT NULL, FOREIGN KEY → constructors(constructor_id)', 'Constructor reference'],
    ['grid_position', 'INT', 'NULL', 'Starting grid position'],
    ['position', 'INT', 'NULL', 'Final classification position (NULL if DNF/DNS)'],
    ['position_order', 'INT', 'NOT NULL', 'Ordered position for sorting'],
    ['points', 'DECIMAL(6,1)', 'NOT NULL DEFAULT 0', 'Points scored in the race'],
    ['laps_completed', 'INT', 'NOT NULL DEFAULT 0', 'Number of laps completed'],
    ['time_retired', 'VARCHAR(50)', 'NULL', 'Time or lap of retirement'],
    ['fastest_lap', 'BOOLEAN', 'DEFAULT FALSE', 'Whether driver set fastest lap'],
    ['fastest_lap_time', 'VARCHAR(20)', 'NULL', 'Fastest lap time string'],
    ['status', 'ENUM(\'Finished\',\'DNF\',\'DSQ\',\'DNS\')', 'DEFAULT \'Finished\'', 'Race completion status'],
    ['', '', 'UNIQUE(race_id, driver_id)', 'One result per driver per race'],
])

# lap_times
doc.add_heading('4.7 lap_times', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['lap_time_id', 'BIGINT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique lap time identifier'],
    ['race_id', 'INT', 'NOT NULL, FOREIGN KEY → races(race_id)', 'Race reference'],
    ['driver_id', 'INT', 'NOT NULL, FOREIGN KEY → drivers(driver_id)', 'Driver reference'],
    ['lap_number', 'INT', 'NOT NULL', 'Lap number'],
    ['lap_time', 'DECIMAL(8,3)', 'NOT NULL', 'Lap duration in seconds (3 decimal places)'],
    ['lap_position', 'INT', 'NULL', 'Position at end of lap'],
    ['', '', 'UNIQUE(race_id, driver_id, lap_number)', 'One time per lap per driver per race'],
])

# driver_standings
doc.add_heading('4.8 driver_standings', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['standing_id', 'INT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique standing identifier'],
    ['season_id', 'INT', 'NOT NULL, FOREIGN KEY → seasons(season_id)', 'Season reference'],
    ['driver_id', 'INT', 'NOT NULL, FOREIGN KEY → drivers(driver_id)', 'Driver reference'],
    ['round', 'INT', 'NOT NULL', 'Round number after which standings are recorded'],
    ['points', 'DECIMAL(7,1)', 'NOT NULL DEFAULT 0', 'Cumulative points'],
    ['position', 'INT', 'NULL', 'Championship position'],
    ['wins', 'INT', 'NOT NULL DEFAULT 0', 'Number of race wins'],
    ['', '', 'UNIQUE(season_id, driver_id, round)', 'One standing per driver per round per season'],
])

# constructor_standings
doc.add_heading('4.9 constructor_standings', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['standing_id', 'INT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique standing identifier'],
    ['season_id', 'INT', 'NOT NULL, FOREIGN KEY → seasons(season_id)', 'Season reference'],
    ['constructor_id', 'INT', 'NOT NULL, FOREIGN KEY → constructors(constructor_id)', 'Constructor reference'],
    ['round', 'INT', 'NOT NULL', 'Round number after which standings are recorded'],
    ['points', 'DECIMAL(7,1)', 'NOT NULL DEFAULT 0', 'Cumulative points'],
    ['position', 'INT', 'NULL', 'Championship position'],
    ['wins', 'INT', 'NOT NULL DEFAULT 0', 'Number of race wins'],
    ['', '', 'UNIQUE(season_id, constructor_id, round)', 'One standing per constructor per round per season'],
])

# pit_stops
doc.add_heading('4.10 pit_stops', level=2)
make_table(doc, ['Column', 'Data Type', 'Constraints', 'Description'], [
    ['pit_stop_id', 'BIGINT', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique pit stop identifier'],
    ['race_id', 'INT', 'NOT NULL, FOREIGN KEY → races(race_id)', 'Race reference'],
    ['driver_id', 'INT', 'NOT NULL, FOREIGN KEY → drivers(driver_id)', 'Driver reference'],
    ['stop_number', 'INT', 'NOT NULL', 'Stop number for the driver in the race'],
    ['lap', 'INT', 'NOT NULL', 'Lap on which the stop occurred'],
    ['duration', 'DECIMAL(5,2)', 'NOT NULL', 'Pit stop duration in seconds'],
    ['', '', 'UNIQUE(race_id, driver_id, stop_number)', 'One record per stop per driver per race'],
])

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 5. DATA TYPES & CONSTRAINTS
# ═══════════════════════════════════════════════════════════════
doc.add_heading('5. Data Types & Constraint Analysis', level=1)

doc.add_heading('5.1 Data Types Used', level=2)
dt_data = [
    ['INT', 'Integer whole numbers', 'Primary keys, foreign keys, counts, laps, positions, rounds', '4 bytes, ±2.1B'],
    ['BIGINT', 'Large integer numbers', 'Primary keys for high-volume tables (lap_times, pit_stops)', '8 bytes, ±9.2E18'],
    ['VARCHAR(n)', 'Variable-length string (n chars)', 'Names, locations, URLs, codes', 'n bytes max'],
    ['CHAR(3)', 'Fixed-length string (3 chars)', 'Driver codes (VER, HAM, LEC)', '3 bytes fixed'],
    ['DATE', 'Calendar date (YYYY-MM-DD)', 'Race dates, driver birth dates', '3 bytes'],
    ['YEAR(4)', '4-digit year', 'Season years', '1 byte'],
    ['DECIMAL(p,s)', 'Exact numeric with precision p, scale s', 'Points (6,1), lap times (8,3), circuit length (6,3), pit duration (5,2)', 'Variable'],
    ['BOOLEAN', 'True/false flag', 'fastest_lap indicator', '1 byte'],
    ['ENUM', 'String with predefined allowed values', 'status (Finished/DNF/DSQ/DNS), weather_condition', '1-2 bytes'],
]
make_table(doc, ['Data Type', 'Description', 'Usage in Schema', 'Storage'], dt_data)

doc.add_heading('5.2 Constraint Summary', level=2)
con_data = [
    ['PRIMARY KEY', '8 tables', 'Unique row identifier; clustered index'],
    ['FOREIGN KEY', '9 references across 6 tables', 'Referential integrity; ensures parent exists'],
    ['NOT NULL', '15+ columns', 'Mandatory value enforcement'],
    ['UNIQUE', '7 unique constraints', 'Prevents duplicates (e.g., year, code, driver_number)'],
    ['DEFAULT', '5 columns', 'Automatic default values (points=0, status=\'Finished\')'],
    ['AUTO_INCREMENT', '8 primary key columns', 'Automatic sequential ID generation'],
    ['ENUM', '2 columns (status, weather)', 'Domain constraint restricting values'],
    ['CHECK', '0 constraints', 'Not used (noted as limitation)'],
]
make_table(doc, ['Constraint Type', 'Occurrences', 'Purpose'], con_data)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 6. NORMALIZATION
# ═══════════════════════════════════════════════════════════════
doc.add_heading('6. Normalization Analysis', level=1)

doc.add_heading('6.1 Normal Form Compliance', level=2)
nf_data = [
    ['1NF (First Normal Form)', '✓ Compliant', 'All columns are atomic (no multi-valued attributes). Each table has a primary key. No repeating groups.'],
    ['2NF (Second Normal Form)', '✓ Compliant', 'All non-key attributes are fully functionally dependent on the entire primary key. No partial dependencies because all tables have single-column primary keys.'],
    ['3NF (Third Normal Form)', '✓ Compliant', 'No transitive dependencies. Non-key attributes depend only on the primary key. E.g., circuits stores lap_record_driver_id (FK) rather than embedding driver name directly.'],
    ['BCNF (Boyce-Codd)', '✓ Compliant', 'Every determinant is a candidate key. All functional dependencies are on primary keys or unique keys.'],
]
make_table(doc, ['Normal Form', 'Status', 'Justification'], nf_data)

doc.add_heading('6.2 Functional Dependencies', level=2)
add_code_block(doc, '''season_id          → year, total_races, champion_driver_id, champion_constructor_id
driver_id          → first_name, last_name, nationality, date_of_birth, driver_number, code
constructor_id     → name, nationality, base_location, logo_url, color
circuit_id         → name, location, country, length_km, lap_record_time, lap_record_driver_id
race_id            → season_id, circuit_id, round_number, name, race_date, weather_condition, scheduled_laps
result_id          → race_id, driver_id, constructor_id, grid_position, position, position_order,
                     points, laps_completed, time_retired, fastest_lap, fastest_lap_time, status
(race_id, driver_id) → result_id, constructor_id, grid_position, position, position_order, points,
                        laps_completed, time_retired, fastest_lap, fastest_lap_time, status''')

doc.add_heading('6.3 Why 3NF is Appropriate', level=2)
doc.add_paragraph(
    'The schema is fully normalized to 3NF/BCNF, which is appropriate for an analytical system with '
    'predominantly read-heavy workloads. This design minimizes data redundancy, eliminates update '
    'anomalies, and maintains referential integrity. For reporting purposes, the de-normalized views '
    '(e.g., v_driver_career_stats, v_race_summary) provide pre-joined data to avoid repetitive JOIN '
    'operations in common queries.'
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 7. SEED DATA
# ═══════════════════════════════════════════════════════════════
doc.add_heading('7. Seed Data & Sample Records', level=1)

doc.add_heading('7.1 Data Volume Summary', level=2)
vol_data = [
    ['seasons', '2', '2022, 2023'],
    ['drivers', '24', 'Verstappen, Perez, Hamilton, Russell, Leclerc, Sainz, Norris, Piastri, Alonso, Stroll, Ocon, Gasly, Albon, Sargeant, Tsunoda, de Vries, Magnussen, Hulkenberg, Bottas, Zhou, Ricciardo, Schumacher, Vettel, Latifi'],
    ['constructors', '10', 'Red Bull Racing, Mercedes, Ferrari, McLaren, Aston Martin, Alpine, Williams, AlphaTauri, Haas, Alfa Romeo'],
    ['circuits', '23', 'Bahrain, Jeddah, Albert Park, Imola, Miami, Barcelona, Monaco, Baku, Montreal, Silverstone, Red Bull Ring, Paul Ricard, Hungaroring, Spa, Zandvoort, Monza, Singapore, Suzuka, Losail, COTA, Mexico City, Interlagos, Yas Marina'],
    ['races', '44', '22 races × 2 seasons'],
    ['driver_standings', '39', '20 drivers (2022) + 20 drivers (2023) — 1 duplicate'],
    ['constructor_standings', '20', '10 constructors × 2 seasons'],
]
make_table(doc, ['Table', 'Rows', 'Details'], vol_data)

doc.add_heading('7.2 Sample Data – Top 5 Drivers (2023)', level=2)
sample_data = [
    ['1', 'Max Verstappen', 'VER', 'Red Bull Racing', '575', '19'],
    ['2', 'Sergio Perez', 'PER', 'Red Bull Racing', '285', '2'],
    ['3', 'Lewis Hamilton', 'HAM', 'Mercedes', '234', '0'],
    ['4', 'Fernando Alonso', 'ALO', 'Aston Martin', '206', '0'],
    ['5', 'Charles Leclerc', 'LEC', 'Ferrari', '206', '0'],
]
make_table(doc, ['Pos', 'Driver', 'Code', 'Constructor', 'Points', 'Wins'], sample_data)

doc.add_heading('7.3 Sample Data – Constructor Standings (2023)', level=2)
con_sample = [
    ['1', 'Red Bull Racing', '860', '21'],
    ['2', 'Mercedes', '409', '0'],
    ['3', 'Ferrari', '406', '1'],
    ['4', 'McLaren', '302', '0'],
    ['5', 'Aston Martin', '280', '0'],
]
make_table(doc, ['Pos', 'Constructor', 'Points', 'Wins'], con_sample)

doc.add_heading('7.4 Champion Records', level=2)
add_code_block(doc, '''UPDATE seasons SET champion_driver_id = 1, champion_constructor_id = 1 WHERE year = 2022;
UPDATE seasons SET champion_driver_id = 1, champion_constructor_id = 1 WHERE year = 2023;
-- Max Verstappen & Red Bull Racing won both 2022 and 2023 championships''')

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 8. VIEWS
# ═══════════════════════════════════════════════════════════════
doc.add_heading('8. Views – Logical Abstraction Layer', level=1)

doc.add_paragraph(
    'Four views are defined in `database/views.sql` to provide pre-joined, aggregated representations '
    'of the data. Views encapsulate complex JOIN logic, provide column-level security, and simplify '
    'client-side querying.'
)

doc.add_heading('8.1 v_current_driver_standings', level=2)
add_code_block(doc, '''CREATE OR REPLACE VIEW v_current_driver_standings AS
SELECT s.year, ds.position,
       CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
       d.code, d.nationality,
       c.name AS constructor, ds.points, ds.wins
FROM driver_standings ds
JOIN seasons s ON ds.season_id = s.season_id
JOIN drivers d ON ds.driver_id = d.driver_id
LEFT JOIN (...subquery for current constructor...) c
 ON d.driver_id = c.driver_id AND s.season_id = c.season_id
WHERE ds.round = (SELECT MAX(round) FROM driver_standings sub WHERE sub.season_id = ds.season_id)
GROUP BY s.year, ds.position, d.driver_id, c.name, ds.points, ds.wins
ORDER BY ds.position;''')
doc.add_paragraph('Purpose: Provides final driver standings for each season with driver details and constructor affiliation.')

doc.add_heading('8.2 v_current_constructor_standings', level=2)
add_code_block(doc, '''CREATE OR REPLACE VIEW v_current_constructor_standings AS
SELECT s.year, cs.position, c.name AS constructor_name, cs.points, cs.wins
FROM constructor_standings cs
JOIN seasons s ON cs.season_id = s.season_id
JOIN constructors c ON cs.constructor_id = c.constructor_id
WHERE cs.round = (SELECT MAX(round) FROM constructor_standings sub WHERE sub.season_id = cs.season_id)
ORDER BY cs.position;''')
doc.add_paragraph('Purpose: Provides final constructor standings for each season.')

doc.add_heading('8.3 v_driver_career_stats', level=2)
add_code_block(doc, '''CREATE OR REPLACE VIEW v_driver_career_stats AS
SELECT d.driver_id,
       CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
       d.nationality, d.code,
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
GROUP BY d.driver_id;''')
doc.add_paragraph('Purpose: Aggregated career statistics for every driver including wins, podiums, poles, fastest laps, average finish, and total points.')

doc.add_heading('8.4 v_race_summary', level=2)
add_code_block(doc, '''CREATE OR REPLACE VIEW v_race_summary AS
SELECT r.race_id, r.name AS race_name, r.round_number, r.race_date,
       s.year, ci.name AS circuit_name, ci.country,
       CONCAT(d.first_name, ' ', d.last_name) AS winner_name,
       d.code AS winner_code, c.name AS winner_constructor,
       rr.fastest_lap_time, rr2.driver_name AS pole_sitter
FROM races r
JOIN seasons s ON r.season_id = s.season_id
JOIN circuits ci ON r.circuit_id = ci.circuit_id
LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.position = 1
LEFT JOIN drivers d ON rr.driver_id = d.driver_id
LEFT JOIN constructors c ON rr.constructor_id = c.constructor_id
LEFT JOIN (SELECT race_id, CONCAT(d2.first_name, ' ', d2.last_name) AS driver_name
           FROM race_results rr_inner JOIN drivers d2 ON rr_inner.driver_id = d2.driver_id
           WHERE rr_inner.grid_position = 1) rr2 ON r.race_id = rr2.race_id;''')
doc.add_paragraph('Purpose: Provides a complete race summary with winner, constructor, pole sitter, and fastest lap time in a single view.')

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 9. INDEXES
# ═══════════════════════════════════════════════════════════════
doc.add_heading('9. Indexes & Performance Optimization', level=1)

doc.add_heading('9.1 Index Definitions', level=2)
idx_data = [
    ['idx_race_results_driver', 'race_results', 'driver_id', 'Accelerates lookups of all results for a specific driver'],
    ['idx_race_results_race', 'race_results', 'race_id', 'Accelerates lookups of all results for a specific race'],
    ['idx_lap_times_race', 'lap_times', 'race_id', 'Accelerates lap time queries per race'],
    ['idx_lap_times_driver', 'lap_times', 'driver_id', 'Accelerates lap time queries per driver'],
    ['idx_driver_standings_season', 'driver_standings', 'season_id', 'Accelerates driver standings queries filtered by season'],
    ['idx_constructor_standings_season', 'constructor_standings', 'season_id', 'Accelerates constructor standings queries filtered by season'],
]
make_table(doc, ['Index Name', 'Table', 'Column(s)', 'Purpose'], idx_data)

doc.add_heading('9.2 Additional Index Candidates', level=2)
doc.add_paragraph(
    'While the existing indexes cover the most frequent access patterns, the following indexes could '
    'further optimize specific queries:'
)
cand_data = [
    ['race_results (position)', 'Q3, Q4, Q7 — filtering/aggregating on finishing position'],
    ['race_results (grid_position)', 'Q5 — pole position analysis'],
    ['races (season_id, round_number)', 'Already covered by UNIQUE constraint (implicit index)'],
    ['lap_times (race_id, driver_id)', 'Composite index for per-driver-per-race lap analysis'],
    ['driver_standings (season_id, driver_id)', 'Composite index for driver season progression queries'],
]
make_table(doc, ['Suggested Index', 'Queries That Would Benefit'], cand_data)

doc.add_heading('9.3 Query Performance Considerations', level=2)
doc.add_paragraph(
    'The database uses SQLite\'s B-tree indexing engine. All PRIMARY KEY and UNIQUE constraints '
    'automatically create indexes. The six explicit indexes are single-column indexes on foreign key '
    'columns, which are the most common JOIN and filter predicates. For a dataset of this size '
    '(~200 race results), performance is already optimal without composite indexes.'
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 10. ANALYTICAL QUERIES
# ═══════════════════════════════════════════════════════════════
doc.add_heading('10. Analytical SQL Queries (12 Queries)', level=1)

doc.add_paragraph(
    'The project includes 12 analytical queries in `database/queries.sql` that collectively demonstrate '
    'a comprehensive range of SQL and DBMS capabilities. Each query addresses a real analytical question '
    'about Formula 1 racing data.'
)

queries_detail = [
    {
        'id': 'Q1',
        'name': 'All-Time Drivers Ranked by Career Points',
        'concepts': 'JOIN, GROUP BY, SUM, Window Function (RANK)',
        'code': '''SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver, d.nationality,
       SUM(rr.points) AS career_points,
       RANK() OVER (ORDER BY SUM(rr.points) DESC) AS rank
FROM drivers d
JOIN race_results rr ON d.driver_id = rr.driver_id
GROUP BY d.driver_id
ORDER BY career_points DESC;''',
        'description': 'Ranks all drivers by their total career points using RANK() window function. Shows driver name, nationality, career points, and rank.'
    },
    {
        'id': 'Q2',
        'name': 'Constructor Standings for a Season',
        'concepts': 'JOIN, Subquery (MAX round), Window Function (RANK)',
        'code': '''SELECT c.name AS constructor, cs.points, cs.wins,
       RANK() OVER (ORDER BY cs.points DESC) AS rank
FROM constructor_standings cs
JOIN constructors c ON cs.constructor_id = c.constructor_id
JOIN seasons s ON cs.season_id = s.season_id
WHERE s.year = 2023
  AND cs.round = (SELECT MAX(round) FROM constructor_standings WHERE season_id = cs.season_id)
ORDER BY rank;''',
        'description': 'Retrieves final constructor standings for 2023 using a correlated subquery to find the latest round.'
    },
    {
        'id': 'Q3',
        'name': 'Average Finishing Position by Driver (Min 10 Races)',
        'concepts': 'JOIN, GROUP BY, HAVING, AVG, CASE, ROUND',
        'code': '''SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
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
ORDER BY avg_finish ASC;''',
        'description': 'Finds the most consistent drivers in 2023 by average finishing position, filtering for drivers who finished at least 10 races.'
    },
    {
        'id': 'Q4',
        'name': 'Most Wins at a Specific Circuit',
        'concepts': 'JOIN, LIKE, GROUP BY, COUNT, ORDER BY',
        'code': '''SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
       COUNT(*) AS wins_at_circuit
FROM race_results rr
JOIN drivers d ON rr.driver_id = d.driver_id
JOIN races r ON rr.race_id = r.race_id
JOIN circuits ci ON r.circuit_id = ci.circuit_id
WHERE ci.name LIKE '%Monaco%' AND rr.position = 1
GROUP BY d.driver_id
ORDER BY wins_at_circuit DESC;''',
        'description': 'Shows which drivers have won the most at Monaco Grand Prix, demonstrating pattern matching with LIKE.'
    },
    {
        'id': 'Q5',
        'name': 'Pole-to-Win Conversion Rate',
        'concepts': 'GROUP BY, HAVING, CASE ratio, ROUND',
        'code': '''SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
       COUNT(*) AS pole_positions,
       SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) AS wins_from_pole,
       ROUND(SUM(CASE WHEN rr.position = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS conversion_rate
FROM race_results rr
JOIN drivers d ON rr.driver_id = d.driver_id
WHERE rr.grid_position = 1
GROUP BY d.driver_id
HAVING pole_positions >= 10
ORDER BY conversion_rate DESC;''',
        'description': 'Measures how often drivers convert pole position into race wins, requiring a minimum of 10 poles for statistical significance.'
    },
    {
        'id': 'Q6',
        'name': 'Running Points Total Through a Season',
        'concepts': 'Window Function (SUM OVER PARTITION BY ORDER BY ROWS UNBOUNDED PRECEDING)',
        'code': '''SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
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
ORDER BY d.code, r.round_number;''',
        'description': 'Tracks how Verstappen and Perez accumulated points through the 2023 season using a cumulative window sum.'
    },
    {
        'id': 'Q7',
        'name': 'Youngest Grand Prix Winners',
        'concepts': 'TIMESTAMPDIFF, DENSE_RANK, LIMIT',
        'code': '''SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver,
       d.date_of_birth, r.name AS race_name, r.race_date,
       TIMESTAMPDIFF(YEAR, d.date_of_birth, r.race_date) AS age_years,
       DENSE_RANK() OVER (ORDER BY TIMESTAMPDIFF(DAY, d.date_of_birth, r.race_date) ASC) AS youngest_rank
FROM race_results rr
JOIN drivers d ON rr.driver_id = d.driver_id
JOIN races r ON rr.race_id = r.race_id
WHERE rr.position = 1
ORDER BY age_years ASC
LIMIT 10;''',
        'description': 'Lists the 10 youngest race winners in F1 history using date arithmetic and DENSE_RANK.'
    },
    {
        'id': 'Q8',
        'name': 'Constructor Dominance – Championships per Team',
        'concepts': 'GROUP BY, Subquery for max round, GROUP_CONCAT',
        'code': '''SELECT c.name AS constructor,
       COUNT(*) AS constructor_championships,
       GROUP_CONCAT(s.year ORDER BY s.year SEPARATOR ', ') AS years_won
FROM constructors c
JOIN constructor_standings cs ON c.constructor_id = cs.constructor_id
JOIN seasons s ON cs.season_id = s.season_id
WHERE cs.position = 1
  AND cs.round = (SELECT MAX(sub.round) FROM constructor_standings sub WHERE sub.season_id = cs.season_id)
GROUP BY c.constructor_id
ORDER BY constructor_championships DESC;''',
        'description': 'Counts constructor championships using GROUP_CONCAT to list the years each team won.'
    },
    {
        'id': 'Q9',
        'name': 'Fastest Lap Holders per Circuit',
        'concepts': 'CTE (WITH clause), RANK OVER PARTITION BY',
        'code': '''WITH circuit_fastest AS (
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
ORDER BY circuit;''',
        'description': 'Uses a Common Table Expression (CTE) with RANK() partitioned by circuit to find the driver with the most fastest laps at each circuit.'
    },
    {
        'id': 'Q10',
        'name': 'Drivers with Perfect Attendance',
        'concepts': 'Subquery in SELECT, HAVING with COUNT comparison',
        'code': '''SELECT CONCAT(d.first_name, ' ', d.last_name) AS driver, s.year,
       COUNT(rr.result_id) AS races_finished,
       (SELECT COUNT(*) FROM races WHERE season_id = s.season_id) AS total_races
FROM drivers d
JOIN race_results rr ON d.driver_id = rr.driver_id
JOIN races r ON rr.race_id = r.race_id
JOIN seasons s ON r.season_id = s.season_id
WHERE rr.status = 'Finished'
GROUP BY d.driver_id, s.season_id
HAVING races_finished = total_races
ORDER BY s.year DESC;''',
        'description': 'Identifies drivers who finished every race in a season by comparing their finished race count against the total race count using a subquery.'
    },
    {
        'id': 'Q11',
        'name': 'Head-to-Head Comparison (HAM vs VER)',
        'concepts': 'Pivot with MAX(CASE WHEN), GROUP BY, CASE for winner determination',
        'code': '''SELECT r.name AS race_name, r.round_number, r.race_date,
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
ORDER BY r.round_number;''',
        'description': 'Creates a race-by-race head-to-head comparison between Hamilton and Verstappen, pivoting their positions into separate columns.'
    },
    {
        'id': 'Q12',
        'name': 'Circuit Lap Record Holders',
        'concepts': 'Simple JOIN',
        'code': '''SELECT ci.name AS circuit, ci.country,
       CONCAT(d.first_name, ' ', d.last_name) AS driver,
       ci.lap_record_time
FROM circuits ci
JOIN drivers d ON ci.lap_record_driver_id = d.driver_id
ORDER BY ci.name;''',
        'description': 'Lists each circuit\'s lap record holder by joining circuits with drivers on the lap_record_driver_id foreign key.'
    },
]

for q in queries_detail:
    doc.add_heading(f'{q["id"]}: {q["name"]}', level=2)
    p = doc.add_paragraph()
    run = p.add_run('SQL Concepts: ')
    run.bold = True
    run.font.size = Pt(10)
    run2 = p.add_run(q['concepts'])
    run2.font.size = Pt(10)
    
    add_code_block(doc, q['code'])
    
    p = doc.add_paragraph()
    run = p.add_run('Purpose: ')
    run.bold = True
    run.font.size = Pt(10)
    run2 = p.add_run(q['description'])
    run2.font.size = Pt(10)
    doc.add_paragraph()

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 11. BACKEND API
# ═══════════════════════════════════════════════════════════════
doc.add_heading('11. Backend API – Database Integration', level=1)

doc.add_heading('11.1 API Endpoint Reference', level=2)
api_data = [
    ['GET', '/api/drivers', 'drivers.controller.getAllDrivers', '?nationality=British', 'List all drivers with current constructor'],
    ['GET', '/api/drivers/:id', 'drivers.controller.getDriverById', '—', 'Get single driver details'],
    ['GET', '/api/drivers/:id/standings', 'drivers.controller.getDriverStandings', '—', 'Driver championship history'],
    ['GET', '/api/drivers/:id/races', 'drivers.controller.getDriverRaceHistory', '—', 'Driver race-by-race history'],
    ['GET', '/api/drivers/head-to-head/:d1/:d2', 'drivers.controller.getHeadToHead', '?year=2023', 'Head-to-head comparison'],
    ['GET', '/api/constructors', 'constructors.controller.getAllConstructors', '—', 'List all constructors'],
    ['GET', '/api/constructors/:id', 'constructors.controller.getConstructorById', '—', 'Constructor details + top driver'],
    ['GET', '/api/constructors/:id/standings', 'constructors.controller.getConstructorStandings', '?year=2023', 'Constructor standings history'],
    ['GET', '/api/circuits', 'circuits.controller.getAllCircuits', '—', 'List all circuits'],
    ['GET', '/api/circuits/:id', 'circuits.controller.getCircuitById', '—', 'Circuit details with lap record driver'],
    ['GET', '/api/circuits/:id/winners', 'circuits.controller.getCircuitWinners', '—', 'Historical winners at circuit'],
    ['GET', '/api/races/:year', 'races.controller.getRacesBySeason', '—', 'Race calendar for a season'],
    ['GET', '/api/race/:id', 'races.controller.getRaceById', '—', 'Single race details'],
    ['GET', '/api/race/:id/results', 'races.controller.getRaceResults', '—', 'Race classification results'],
    ['GET', '/api/standings/drivers/:year', 'standings.controller.getDriverStandingsBySeason', '?round=22', 'Driver standings by season/round'],
    ['GET', '/api/standings/constructors/:year', 'standings.controller.getConstructorStandingsBySeason', '?round=22', 'Constructor standings by season/round'],
    ['GET', '/api/standings/current', 'standings.controller.getCurrentStandings', '—', 'Current season both standings'],
    ['GET', '/api/stats/career', 'stats.controller.getCareerStats', '—', 'Career stats from v_driver_career_stats'],
    ['GET', '/api/stats/season/:year', 'stats.controller.getSeasonSummary', '—', 'Season summary (champion, most wins)'],
    ['GET', '/api/stats/records', 'stats.controller.getRecords', '—', 'Leaderboards for wins, poles, avg finish'],
    ['GET', '/api/stats/compare', 'stats.controller.getDriverComparison', '?d1=1&d2=3', 'Compare two drivers head-to-head'],
]
make_table(doc, ['Method', 'Endpoint', 'Handler', 'Query Params', 'Description'], api_data)

doc.add_heading('11.2 Controller-to-Database Mapping', level=2)
doc.add_paragraph(
    'Each controller function follows a consistent pattern: build a SQL string (with optional '
    'query parameter filtering), execute via the query model, and return JSON results. Error handling '
    'is delegated to the global error handler middleware via try/catch + next(err).'
)
add_code_block(doc, '''// Pattern used in every controller:
const { query } = require('../models/query');

const getSomeData = async (req, res, next) => {
  try {
    const { filter } = req.query;
    let sql = `SELECT ... FROM ... JOIN ... WHERE ...`;
    const params = [];
    if (filter) { sql += ` AND column = ?`; params.push(filter); }
    sql += ` ORDER BY ...`;
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};''')

doc.add_heading('11.3 Route Registration', level=2)
add_code_block(doc, '''// backend/src/routes/index.js
const { Router } = require('express');
const router = Router();

router.use('/drivers', require('./drivers.routes'));
router.use('/constructors', require('./constructors.routes'));
router.use('/circuits', require('./circuits.routes'));
router.use('/races', require('./races.routes'));
router.use('/standings', require('./standings.routes'));
router.use('/stats', require('./stats.routes'));

module.exports = router;

// Mounted in app.js:
app.use('/api', routes);''')

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 12. FRONTEND
# ═══════════════════════════════════════════════════════════════
doc.add_heading('12. Frontend Application – Data Visualization', level=1)

doc.add_heading('12.1 Page Routing', level=2)
add_code_block(doc, '''// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/"              element={<Dashboard />} />
  <Route path="/drivers"       element={<Drivers />} />
  <Route path="/drivers/:id"   element={<DriverDetail />} />
  <Route path="/constructors"  element={<Constructors />} />
  <Route path="/constructors/:id" element={<ConstructorDetail />} />
  <Route path="/circuits"      element={<Circuits />} />
  <Route path="/circuits/:id"  element={<CircuitDetail />} />
  <Route path="/races/:year"   element={<Races />} />
  <Route path="/race/:id"      element={<RaceDetail />} />
  <Route path="/standings"     element={<Standings />} />
  <Route path="/compare"       element={<Compare />} />
  <Route path="/records"       element={<Records />} />
</Routes>''')

doc.add_heading('12.2 Frontend Technology Details', level=2)
fe_data = [
    ['React 18', 'UI framework', 'Component-based architecture with hooks'],
    ['React Router v6', 'Client-side routing', '12 routes with parameterized URLs'],
    ['Vite 5', 'Build tool & dev server', 'Fast HMR, port 3000, proxy to backend'],
    ['Axios', 'HTTP client', 'Pre-configured instance in api/client.js'],
    ['Recharts 2', 'Charting library', 'Bar charts, line charts for standings & stats'],
    ['API Proxy', 'Vite config', '/api requests proxied to localhost:5000'],
]
make_table(doc, ['Technology', 'Role', 'Details'], fe_data)

doc.add_heading('12.3 API Client Configuration', level=2)
add_code_block(doc, '''// frontend/src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export default api;

// Usage in components:
// import api from '../api/client';
// const { data } = await api.get('/drivers');
// const { data } = await api.get('/standings/current');''')

doc.add_heading('12.4 Data Flow Architecture', level=2)
add_code_block(doc, '''React Component                 Express API                    SQLite
     │                              │                             │
     │  useEffect()                  │                             │
     │  api.get('/standings/current')│                             │
     │ ─────────────────────────────>│                             │
     │                              │  query("SELECT ...")         │
     │                              │ ────────────────────────────>│
     │                              │  <── JSON rows ─────────────│
     │  <── JSON response ──────────│                             │
     │                              │                             │
     │  setState(data)               │                             │
     │  Recharts renders chart       │                             │
     └───────────────────────────────┘                             └────────────''')

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 13. TRANSACTION MANAGEMENT
# ═══════════════════════════════════════════════════════════════
doc.add_heading('13. Transaction Management & Concurrency', level=1)

doc.add_heading('13.1 SQLite WAL Mode', level=2)
doc.add_paragraph(
    'The database is configured with Write-Ahead Logging (WAL) mode via `PRAGMA journal_mode = WAL`. '
    'This provides significant performance benefits:'
)
wal_points = [
    'Concurrent reads and writes: Readers do not block writers and writers do not block readers.',
    'Improved write performance: WAL batches writes into the WAL file before checkpointing to the main database.',
    'Better read performance: Readers read from the WAL file while writes are in progress.',
    'Crash recovery: WAL provides better crash recovery guarantees.',
]
for wp in wal_points:
    add_bullet(doc, wp)

doc.add_heading('13.2 Foreign Key Enforcement', level=2)
doc.add_paragraph(
    'SQLite does not enforce foreign keys by default. The backend explicitly enables enforcement via '
    '`PRAGMA foreign_keys = ON` on every database connection (see `backend/src/config/db.js`). This ensures '
    'referential integrity is maintained at the database level.'
)

doc.add_heading('13.3 Transaction Use Cases', level=2)
doc.add_paragraph(
    'While the current API endpoints are read-only (GET operations), the schema supports transactional '
    'write operations. Potential transaction scenarios include:'
)
tx_data = [
    ['Race Result Entry', 'INSERT into race_results + UPDATE driver_standings + UPDATE constructor_standings', 'Ensures consistency across 3 tables'],
    ['Season Initialization', 'INSERT seasons + INSERT races (22 rows)', 'All-or-nothing season setup'],
    ['Champion Update', 'UPDATE seasons SET champion_driver_id + champion_constructor_id', 'Atomic champion record update'],
]
make_table(doc, ['Scenario', 'Tables Involved', 'Atomicity Requirement'], tx_data)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 14. SECURITY
# ═══════════════════════════════════════════════════════════════
doc.add_heading('14. Security Considerations', level=1)

sec_data = [
    ['Parameterized Queries', 'All queries use? placeholders with parameter arrays. The query() model passes params to better-sqlite3\'s prepared statements, preventing SQL injection.', 'Every controller endpoint'],
    ['Input Validation', 'Route parameters are parsed with parseInt() where numeric values are expected.', 'drivers.controller.js:84, standings.controller.js:44'],
    ['CORS', 'Cross-Origin Resource Sharing is enabled via the cors middleware, allowing the frontend dev server (port 3000) to access the backend API (port 5000).', 'app.js:11'],
    ['Error Handling', 'A centralized error handler middleware catches all errors and returns consistent JSON error responses. Stack traces are not leaked in production.', 'middleware/errorHandler.js'],
    ['No Authentication', 'The application currently has no authentication/authorization layer. This is appropriate for a local development/educational project but would need JWT or session-based auth for production deployment.', 'Not implemented'],
    ['No Secrets in Code', 'Database path and port are configured via .env file (not hardcoded).', '.env file'],
]
make_table(doc, ['Measure', 'Description', 'Implementation'], sec_data)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 15. LIMITATIONS & FUTURE
# ═══════════════════════════════════════════════════════════════
doc.add_heading('15. Limitations & Future Enhancements', level=1)

doc.add_heading('15.1 Current Limitations', level=2)
lim_data = [
    ['No Stored Procedures', 'All database logic is in application-layer JavaScript. MySQL stored procedures could encapsulate complex multi-step operations.'],
    ['No Triggers', 'Triggers could automate standings updates when new race results are inserted. Currently this must be done in application code.'],
    ['No CHECK Constraints', 'SQLite supports CHECK constraints in recent versions, but none are defined. Data validation relies on application logic.'],
    ['Limited Race Results Data', 'Race-level results are derived from standings tables rather than individually seeded, which limits granular querying on per-race events.'],
    ['No lap_times / pit_stops Data', 'These tables are defined but empty. Seeding would require extensive telemetry data.'],
    ['Read-Only API', 'All current endpoints are GET-only. No POST/PUT/DELETE for data modification.'],
    ['SQLite Limitations', 'No user management, no concurrent write scaling, no network access (embedded).'],
]
make_table(doc, ['Limitation', 'Description'], lim_data)

doc.add_heading('15.2 Future Enhancements', level=2)
future_data = [
    ['Stored Procedures', 'Implement MySQL stored procedures for race result entry, standings recalculation, and season roll-up.'],
    ['Database Triggers', 'Add AFTER INSERT triggers on race_results to automatically update driver_standings and constructor_standings tables.'],
    ['Full CRUD API', 'Extend the API with POST, PUT, DELETE endpoints for data administration.'],
    ['Authentication', 'Add JWT-based authentication for admin users and role-based access control.'],
    ['Real-Time Data', 'Integrate with the official F1 data feeds for live race timing and standings updates.'],
    ['Migration to MySQL/PostgreSQL', 'Migrate from SQLite to a production-grade RDBMS for better concurrent access and advanced features.'],
    ['Data Warehouse Extension', 'Add historical data going back to the 1950 F1 season, implement star-schema design for dimensional analysis.'],
    ['Advanced Analytics', 'Add predictive models (race outcome prediction, driver performance forecasting) using ML on historical data.'],
    ['Pit Stop Analytics', 'Seed pit_stops data and analyze pit strategy effectiveness, average stop times, and undercut/overcut strategies.'],
    ['Full-Text Search', 'Implement full-text search on driver names, circuit names, and race names using SQLite FTS5.'],
]
make_table(doc, ['Enhancement', 'Description'], future_data)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# 16. CONCLUSION
# ═══════════════════════════════════════════════════════════════
doc.add_heading('16. Conclusion', level=1)

doc.add_paragraph(
    'The F1 Analytics project successfully demonstrates the complete lifecycle of a database-driven '
    'web application, from logical schema design through physical implementation to full-stack integration.'
)
doc.add_paragraph(
    'The database schema implements 8 normalized tables with proper primary keys, foreign keys, '
    'unique constraints, and indexes — achieving 3NF/BCNF compliance. Four views provide logical '
    'data abstraction for common analytical patterns. Twelve analytical queries demonstrate a '
    'comprehensive range of SQL capabilities including window functions (RANK, DENSE_RANK, SUM OVER), '
    'Common Table Expressions (CTEs), correlated subqueries, conditional aggregation (CASE WHEN), '
    'date arithmetic, and string aggregation (GROUP_CONCAT).'
)
doc.add_paragraph(
    'The Express.js backend exposes 21 RESTful endpoints that map controller logic to parameterized '
    'database queries, with centralized error handling and CORS support. The React frontend provides '
    'an interactive user interface with 12 routes, powered by Recharts for data visualization and '
    'Axios for API communication — all proxied through Vite\'s development server.'
)
doc.add_paragraph(
    'Key metrics: 8 tables, 4 views, 6 indexes, 24 drivers, 10 constructors, 23 circuits, 44 races, '
    '12 analytical queries, 21 API endpoints, 12 frontend routes — spanning both the 2022 and 2023 '
    'Formula 1 seasons. The project is well-positioned for future enhancements including stored '
    'procedures, triggers, migration to a production RDBMS, and expansion to the full 75-year history '
    'of Formula 1 racing.'
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════
# APPENDICES
# ═══════════════════════════════════════════════════════════════
doc.add_heading('Appendices', level=1)

doc.add_heading('Appendix A: Complete DDL Script', level=2)
with open(r'C:\Users\priya\OneDrive\Desktop\Reva\f1-analytics\database\schema.sql', 'r', encoding='utf-8') as f:
    ddl = f.read()
add_code_block(doc, ddl)

doc.add_heading('Appendix B: Complete Seed Data Script', level=2)
with open(r'C:\Users\priya\OneDrive\Desktop\Reva\f1-analytics\database\seed.sql', 'r', encoding='utf-8') as f:
    seed = f.read()
add_code_block(doc, seed)

doc.add_heading('Appendix C: View Definitions', level=2)
with open(r'C:\Users\priya\OneDrive\Desktop\Reva\f1-analytics\database\views.sql', 'r', encoding='utf-8') as f:
    views = f.read()
add_code_block(doc, views)

doc.add_heading('Appendix D: Complete Query Reference', level=2)
with open(r'C:\Users\priya\OneDrive\Desktop\Reva\f1-analytics\database\queries.sql', 'r', encoding='utf-8') as f:
    queries = f.read()
add_code_block(doc, queries)

doc.add_heading('Appendix E: API Endpoint Reference', level=2)
api_ref = [
    ['GET', '/api/drivers', 'List all drivers', 'drivers.controller.getAllDrivers'],
    ['GET', '/api/drivers/:id', 'Get driver by ID', 'drivers.controller.getDriverById'],
    ['GET', '/api/drivers/:id/standings', 'Driver standings history', 'drivers.controller.getDriverStandings'],
    ['GET', '/api/drivers/:id/races', 'Driver race history', 'drivers.controller.getDriverRaceHistory'],
    ['GET', '/api/drivers/head-to-head/:d1/:d2', 'Head-to-head comparison', 'drivers.controller.getHeadToHead'],
    ['GET', '/api/constructors', 'List all constructors', 'constructors.controller.getAllConstructors'],
    ['GET', '/api/constructors/:id', 'Get constructor by ID', 'constructors.controller.getConstructorById'],
    ['GET', '/api/constructors/:id/standings', 'Constructor standings', 'constructors.controller.getConstructorStandings'],
    ['GET', '/api/circuits', 'List all circuits', 'circuits.controller.getAllCircuits'],
    ['GET', '/api/circuits/:id', 'Get circuit by ID', 'circuits.controller.getCircuitById'],
    ['GET', '/api/circuits/:id/winners', 'Circuit winners history', 'circuits.controller.getCircuitWinners'],
    ['GET', '/api/races/:year', 'Races by season', 'races.controller.getRacesBySeason'],
    ['GET', '/api/race/:id', 'Get race by ID', 'races.controller.getRaceById'],
    ['GET', '/api/race/:id/results', 'Race results', 'races.controller.getRaceResults'],
    ['GET', '/api/standings/drivers/:year', 'Driver standings by season', 'standings.controller.getDriverStandingsBySeason'],
    ['GET', '/api/standings/constructors/:year', 'Constructor standings by season', 'standings.controller.getConstructorStandingsBySeason'],
    ['GET', '/api/standings/current', 'Current season standings', 'standings.controller.getCurrentStandings'],
    ['GET', '/api/stats/career', 'Career statistics', 'stats.controller.getCareerStats'],
    ['GET', '/api/stats/season/:year', 'Season summary', 'stats.controller.getSeasonSummary'],
    ['GET', '/api/stats/records', 'Leaderboard records', 'stats.controller.getRecords'],
    ['GET', '/api/stats/compare', 'Driver comparison', 'stats.controller.getDriverComparison'],
]
make_table(doc, ['Method', 'Endpoint', 'Description', 'Controller Handler'], api_ref)

# ── Save ──
output_path = r'C:\Users\priya\OneDrive\Desktop\Reva\f1-analytics\F1_Analytics_DBMS_Report.docx'
doc.save(output_path)
print(f'Report saved to: {output_path}')

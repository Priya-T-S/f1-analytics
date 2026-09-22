const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const LEGACY_TABLES = [
  'pit_stops', 'lap_times', 'race_results', 'driver_standings', 'constructor_standings',
  'races', 'circuits', 'drivers', 'constructors', 'seasons',
];

// The old hand-written seed database has no *_ref columns and cannot be synced into.
async function dropLegacySchema() {
  const cols = await db.execute("SELECT name FROM pragma_table_info('drivers')");
  const hasDrivers = cols.rows.length > 0;
  const hasRef = cols.rows.some((r) => r.name === 'driver_ref');
  if (!hasDrivers || hasRef) return false;

  console.log('Found the old seed schema - dropping it so real data can be imported.');
  await db.executeMultiple([
    'DROP VIEW IF EXISTS v_driver_career_stats;',
    ...LEGACY_TABLES.map((t) => `DROP TABLE IF EXISTS ${t};`),
  ].join('\n'));
  return true;
}

// Columns added after the first release; CREATE TABLE IF NOT EXISTS won't add them to existing tables.
const ADDED_COLUMNS = [
  ['drivers', 'wiki_url', 'TEXT'],
];

async function addMissingColumns() {
  for (const [table, column, type] of ADDED_COLUMNS) {
    const cols = await db.execute(`SELECT name FROM pragma_table_info('${table}')`);
    if (!cols.rows.some((r) => r.name === column)) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  }
}

async function migrate() {
  await dropLegacySchema();
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.executeMultiple(sql);
  await addMissingColumns();
}

if (require.main === module) {
  migrate()
    .then(() => { console.log(`Schema is up to date (${db.isRemote ? 'Turso' : 'local file'}).`); })
    .catch((err) => { console.error(err); process.exitCode = 1; });
}

module.exports = { migrate };

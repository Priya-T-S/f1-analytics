const db = require('../config/db');

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
    return stmt.all(...params);
  }
  return stmt.run(...params);
}

module.exports = { query };

const db = require('../config/db');

function toObjects(result) {
  return result.rows.map((row) => {
    const obj = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

async function query(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
    return toObjects(result);
  }
  return { changes: result.rowsAffected, lastInsertRowid: Number(result.lastInsertRowid) };
}

// Runs a list of { sql, args } statements in one transaction.
async function batch(statements) {
  if (!statements.length) return [];
  return db.batch(statements, 'write');
}

module.exports = { query, batch, toObjects };

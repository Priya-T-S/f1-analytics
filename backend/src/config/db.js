const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config();

// Hosted Turso database in production; a local SQLite file for development.
const localPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'f1_analytics.db');
const url = process.env.TURSO_DATABASE_URL || `file:${localPath.split(path.sep).join('/')}`;

const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

db.isRemote = !url.startsWith('file:');

module.exports = db;

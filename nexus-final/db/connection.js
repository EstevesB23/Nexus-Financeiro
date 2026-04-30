// db/connection.js
'use strict';

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, 'xcredit.db');
let _db = null;

const runMigrations = (db) => {
  const cols = db.pragma('table_info(clientes)').map(c => c.name);
  if (!cols.includes('banco')) {
    db.exec("ALTER TABLE clientes ADD COLUMN banco TEXT NOT NULL DEFAULT ''");
  }
};

const getDB = () => {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('busy_timeout = 5000');  // evita SQLITE_BUSY em concorrência
    runMigrations(_db);
  }
  return _db;
};

module.exports = { getDB };

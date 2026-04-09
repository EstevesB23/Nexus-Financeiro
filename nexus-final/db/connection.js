// db/connection.js
'use strict';

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, 'nexus.db');
let _db = null;

const getDB = () => {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('busy_timeout = 5000');  // evita SQLITE_BUSY em concorrência
  }
  return _db;
};

module.exports = { getDB };

const Database = require('better-sqlite3');
const path = require('path');

// Chemin vers la base de données payments.db
const dbPath = path.join(__dirname, 'payments.db');
const db = new Database(dbPath);

// Création de la table payments si elle n'existe pas
db.prepare(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE,
    amount REAL NOT NULL,
    status TEXT CHECK(status IN ('pending','completed','failed','refunded')) NOT NULL,
    method TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
  )
`).run();

console.log('payments.db créé ou table payments initialisée');

module.exports = db;
// Gestion de la base SQLite3 pour MS Produit

const Database = require('better-sqlite3');
const path = require('path');

// Chemin du fichier SQLite
const dbPath = path.join(__dirname, 'products.db');

// Ouvre la base de données (crée automatiquement si inexistante)
const db = new Database(dbPath, { verbose: console.log });

// Création de la table products si elle n'existe pas
const createTableSQL = `
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    category TEXT,
    promo_price REAL,
    promo_expires_at TEXT,
    created_at TEXT NOT NULL
);
`;

// Exécuter la requête
db.exec(createTableSQL);

console.log('SQLite3 : table products prête dans products.db');

// Exporter l’instance pour l’utiliser dans productService et server.js
module.exports = db;
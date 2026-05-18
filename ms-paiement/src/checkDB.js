// checkDB.js — Vérifier la table payments et son contenu
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'payments.db');
const db = new Database(dbPath);

// Vérifier si la table payments existe
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' AND name='payments';
`).get();

if (!tableExists) {
  console.log('La table "payments" n’existe pas encore.');
} else {
  console.log('Table "payments" trouvée !');

  // Lister les colonnes
  const columns = db.prepare(`PRAGMA table_info(payments);`).all();
  console.log('Colonnes :', columns.map(c => c.name).join(', '));

  // Lister le contenu (limité à 10 lignes pour test)
  const rows = db.prepare(`SELECT * FROM payments LIMIT 10;`).all();
  console.log('Contenu actuel de la table :', rows.length ? rows : 'Vide');
}

db.close();
// productService.js
// Module métier pour MS Produit

const db = require('./db');
const { v4: uuidv4 } = require('uuid');

// Créer un produit
function createProduct(data) {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO products
    (id, name, description, price, stock, category, promo_price, promo_expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    data.description || '',
    data.price,
    data.stock,
    data.category || '',
    data.promo_price || null,
    data.promo_expires_at || null,
    createdAt
  );

  return {
    id,
    name: data.name,
    description: data.description || '',
    price: data.price,
    stock: data.stock,
    category: data.category || '',
    promo_price: data.promo_price || null,
    promo_expires_at: data.promo_expires_at || null,
    created_at: createdAt
  };
}

// Récupérer un produit par ID
function getProductById(id) {
  const stmt = db.prepare(`SELECT * FROM products WHERE id = ?`);
  const product = stmt.get(id);
  return product || null;
}

// Lister tous les produits, option filtrage par catégorie
function listProducts(category) {
  let stmt;
  if (category) {
    stmt = db.prepare(`SELECT * FROM products WHERE category = ?`);
    return stmt.all(category);
  } else {
    stmt = db.prepare(`SELECT * FROM products`);
    return stmt.all();
  }
}

// Mettre à jour le stock
function updateStock(id, quantity) {
  const product = getProductById(id);
  if (!product) throw new Error('Product not found');

  const newStock = product.stock + quantity;
  if (newStock < 0) throw new Error('Stock cannot be negative');

  const stmt = db.prepare(`UPDATE products SET stock = ? WHERE id = ?`);
  stmt.run(newStock, id);

  return getProductById(id);
}

// Rechercher produits par nom ou description
function searchProducts(query) {
  const stmt = db.prepare(`
    SELECT * FROM products
    WHERE name LIKE ? OR description LIKE ?
  `);
  const pattern = `%${query}%`;
  return stmt.all(pattern, pattern);
}

// Produits avec promo encore valides
function getPromoProducts() {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    SELECT * FROM products
    WHERE promo_price IS NOT NULL
    AND promo_expires_at > ?
  `);
  return stmt.all(now);
}

// Export des fonctions
module.exports = {
  createProduct,
  getProductById,
  listProducts,
  updateStock,
  searchProducts,
  getPromoProducts
};
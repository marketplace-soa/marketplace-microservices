// products.js — routes REST pour les produits
// Le Gateway reçoit les requêtes HTTP et les traduit en appels gRPC vers MS Produit

const express = require('express');
const router = express.Router();
const productClient = require('../../grpc-clients/productClient');

// ─── Helper — convertit callback gRPC en Promise ──────────
// Évite de répéter le pattern callback dans chaque route
const grpcCall = (method, request) => {
  return new Promise((resolve, reject) => {
    productClient[method](request, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

// ─── GET /products ────────────────────────────────────────
// Lister tous les produits — filtre optionnel par category
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;  // ex: GET /products?category=electronics
    const response = await grpcCall('listProducts', { category: category || '' });
    res.json(response.products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /products/promo ──────────────────────────────────
// Produits en promotion — doit être AVANT /:id sinon Express capte "promo" comme id
router.get('/promo', async (req, res) => {
  try {
    const response = await grpcCall('getPromoProducts', {});
    res.json(response.products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /products/:id ────────────────────────────────────
// Récupérer un produit par son id
router.get('/:id', async (req, res) => {
  try {
    const response = await grpcCall('getProduct', { id: req.params.id });
    if (!response.product) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(response.product);
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;  // code 5 = NOT_FOUND en gRPC
    res.status(status).json({ error: err.message });
  }
});

// ─── POST /products ───────────────────────────────────────
// Créer un nouveau produit
router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, category, promo_price, promo_expires_at } = req.body;
    const response = await grpcCall('createProduct', {
      name,
      description,
      price,
      stock,
      category,
      promo_price:      promo_price      || 0,
      promo_expires_at: promo_expires_at || ''
    });
    res.status(201).json(response.product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /products/:id/stock ────────────────────────────
// Mettre à jour le stock d'un produit
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity } = req.body;
    const response = await grpcCall('updateStock', {
      id: req.params.id,
      quantity
    });
    res.json(response.product);
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ─── GET /products/search/:query ──────────────────────────
// Rechercher des produits par nom ou description
router.get('/search/:query', async (req, res) => {
  try {
    const response = await grpcCall('searchProducts', { query: req.params.query });
    res.json(response.products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
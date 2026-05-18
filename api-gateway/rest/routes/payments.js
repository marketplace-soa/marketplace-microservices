// payments.js — routes REST pour les paiements

const express = require('express');
const router = express.Router();
const paymentClient = require('../../grpc-clients/paymentClient');

// Helper — même pattern que products
const grpcCall = (method, request) => {
  return new Promise((resolve, reject) => {
    paymentClient[method](request, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

// ─── POST /payments ───────────────────────────────────────
// Initier un paiement manuellement
router.post('/', async (req, res) => {
  try {
    const { order_id, amount, method } = req.body;
    const response = await grpcCall('processPayment', {
      order_id,
      amount,
      method
    });
    res.status(201).json(response.payment);
  } catch (err) {
    const status = err.code === 6 ? 409 : 500;  // code 6 = ALREADY_EXISTS
    res.status(status).json({ error: err.message });
  }
});

// ─── GET /payments/:orderId ───────────────────────────────
// Récupérer le statut d'un paiement par order_id
router.get('/:orderId', async (req, res) => {
  try {
    const response = await grpcCall('getPaymentStatus', {
      order_id: req.params.orderId
    });
    if (!response.payment) return res.status(404).json({ error: 'Paiement introuvable' });
    res.json(response.payment);
  } catch (err) {
    const status = err.code === 5 ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ─── POST /payments/:paymentId/refund ─────────────────────
// Rembourser un paiement
router.post('/:paymentId/refund', async (req, res) => {
  try {
    const response = await grpcCall('refundPayment', {
      payment_id: req.params.paymentId
    });
    res.json(response.payment);
  } catch (err) {
    const status = err.code === 5 ? 404 : err.code === 9 ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
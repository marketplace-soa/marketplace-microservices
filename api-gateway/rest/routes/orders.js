// Import Express
const express = require('express');

// Création du router Express
const router = express.Router();

// Import du client gRPC OrderService
const orderClient = require('../../grpc-clients/orderClient');


// =============================
// POST /orders
// Créer une commande
// =============================
router.post('/', (req, res) => {
  const { user_id, items, total_amount } = req.body;

  orderClient.CreateOrder(
    {
      user_id,
      items,
      total_amount
    },
    (error, response) => {
      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.status(201).json(response.order);
    }
  );
});


// =============================
// GET /orders/:id
// Récupérer une commande par ID
// =============================
router.get('/:id', (req, res) => {
  orderClient.GetOrder(
    {
      id: req.params.id
    },
    (error, response) => {
      if (error) {
        return res.status(404).json({
          message: error.message
        });
      }

      res.json(response.order);
    }
  );
});


// =============================
// GET /orders/user/:userId
// Lister les commandes d'un utilisateur
// =============================
router.get('/user/:userId', (req, res) => {
  orderClient.ListOrders(
    {
      user_id: req.params.userId
    },
    (error, response) => {
      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json(response.orders);
    }
  );
});


// =============================
// PATCH /orders/:id/status
// Modifier le statut d'une commande
// =============================
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;

  orderClient.UpdateOrderStatus(
    {
      id: req.params.id,
      status
    },
    (error, response) => {
      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json(response.order);
    }
  );
});


// =============================
// PATCH /orders/:id/cancel
// Annuler une commande
// =============================
router.patch('/:id/cancel', (req, res) => {
  const { reason } = req.body;

  orderClient.CancelOrder(
    {
      id: req.params.id,
      reason
    },
    (error, response) => {
      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json(response.order);
    }
  );
});


module.exports = router;
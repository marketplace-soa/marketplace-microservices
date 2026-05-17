// Import Express
const express = require('express');

// Création du router Express
const router = express.Router();

// Import du client gRPC NotificationService
const notificationClient = require('../../grpc-clients/notificationClient');


// =============================
// GET /notifications/:userId
// Lister les notifications d'un utilisateur
// =============================
router.get('/:userId', (req, res) => {
  notificationClient.ListNotifications(
    {
      user_id: req.params.userId
    },
    (error, response) => {
      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json(response.notifications);
    }
  );
});


// =============================
// GET /notifications/:userId/unread
// Nombre de notifications non lues
// =============================
router.get('/:userId/unread', (req, res) => {
  notificationClient.GetUnreadCount(
    {
      user_id: req.params.userId
    },
    (error, response) => {
      if (error) {
        return res.status(500).json({
          message: error.message
        });
      }

      res.json({
        count: response.count
      });
    }
  );
});


// =============================
// PATCH /notifications/:id/read
// Marquer une notification comme lue
// =============================
router.patch('/:id/read', (req, res) => {
  notificationClient.MarkAsRead(
    {
      notification_id: req.params.id
    },
    (error, response) => {
      if (error) {
        return res.status(404).json({
          message: error.message
        });
      }

      res.json(response.notification);
    }
  );
});


module.exports = router;
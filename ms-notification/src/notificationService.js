// Import du module gRPC pour gérer les erreurs gRPC
const grpc = require('@grpc/grpc-js');

// Import de la base RxDB notifications
const initDB = require('./db');


// =============================
// LIST NOTIFICATIONS
// =============================
async function ListNotifications(call, callback) {
  try {
    // Récupérer user_id depuis la requête gRPC
    const { user_id } = call.request;

    // Initialiser la DB
    const db = await initDB();

    // Chercher les notifications de l'utilisateur
    const notifications = await db.notifications
      .find({
        selector: {
          userId: user_id
        }
      })
      .exec();

    // Formater la réponse selon notification.proto
    const formattedNotifications = notifications
      .map(notification => ({
        id: notification.id,
        user_id: notification.userId,
        type: notification.type,
        message: notification.message,
        read: notification.read,
        created_at: notification.createdAt
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Réponse gRPC
    callback(null, {
      notifications: formattedNotifications
    });

  } catch (error) {
    console.error(error);

    callback({
      code: grpc.status.INTERNAL,
      message: 'Internal server error'
    });
  }
}


// =============================
// MARK AS READ
// =============================
async function MarkAsRead(call, callback) {
  try {
    // Récupérer notification_id depuis la requête gRPC
    const { notification_id } = call.request;

    // Initialiser la DB
    const db = await initDB();

    // Chercher la notification par ID
    const notification = await db.notifications
      .findOne(notification_id)
      .exec();

    // Si notification introuvable
    if (!notification) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Notification not found'
      });
    }

    // Marquer comme lue
    await notification.patch({
      read: true
    });

    // Réponse gRPC
    callback(null, {
      notification: {
        id: notification.id,
        user_id: notification.userId,
        type: notification.type,
        message: notification.message,
        read: true,
        created_at: notification.createdAt
      }
    });

  } catch (error) {
    console.error(error);

    callback({
      code: grpc.status.INTERNAL,
      message: 'Internal server error'
    });
  }
}


// =============================
// GET UNREAD COUNT
// =============================
async function GetUnreadCount(call, callback) {
  try {
    // Récupérer user_id depuis la requête gRPC
    const { user_id } = call.request;

    // Initialiser la DB
    const db = await initDB();

    // Chercher les notifications non lues de l'utilisateur
    const unreadNotifications = await db.notifications
      .find({
        selector: {
          userId: user_id,
          read: false
        }
      })
      .exec();

    // Réponse gRPC avec le nombre
    callback(null, {
      count: unreadNotifications.length
    });

  } catch (error) {
    console.error(error);

    callback({
      code: grpc.status.INTERNAL,
      message: 'Internal server error'
    });
  }
}


// Export des méthodes gRPC
module.exports = {
  ListNotifications,
  MarkAsRead,
  GetUnreadCount
};
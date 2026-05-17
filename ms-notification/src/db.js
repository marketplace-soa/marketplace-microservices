// Import de RxDB
const { createRxDatabase } = require('rxdb');

// Storage mémoire pour simplifier le mini-projet
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');

// Instance unique de la base de données
let dbInstance = null;

// Initialisation de la base Notification
async function initDB() {
  // Si la DB existe déjà, on la retourne
  if (dbInstance) {
    return dbInstance;
  }

  // Création de la base RxDB
  const db = await createRxDatabase({
    name: 'notificationsdb',
    storage: getRxStorageMemory()
  });

  // Création de la collection notifications
  await db.addCollections({
    notifications: {
      schema: {
        title: 'notifications schema',
        description: 'Schema de la collection des notifications',
        version: 0,
        primaryKey: 'id',
        type: 'object',

        properties: {
          // ID unique de la notification
          // maxLength obligatoire pour une clé primaire string avec RxDB
          id: {
            type: 'string',
            maxLength: 100
          },

          // ID utilisateur destinataire
          userId: {
            type: 'string'
          },

          // Type de notification
          // exemples: order, payment, stock
          type: {
            type: 'string'
          },

          // Message affiché à l'utilisateur
          message: {
            type: 'string'
          },

          // false = non lue, true = lue
          read: {
            type: 'boolean'
          },

          // Date de création
          createdAt: {
            type: 'string'
          }
        },

        // Champs obligatoires
        required: [
          'id',
          'userId',
          'type',
          'message',
          'read',
          'createdAt'
        ]
      }
    }
  });

  // Sauvegarder l'instance pour éviter de recréer la DB
  dbInstance = db;

  console.log('RxDB Notifications initialized');

  return db;
}

// Export de la fonction
module.exports = initDB;
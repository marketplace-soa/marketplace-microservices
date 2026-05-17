// Import de RxDB
const { createRxDatabase } = require('rxdb');

// Storage mémoire pour simplifier le projet
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');

// Une seule instance de base pour éviter de recréer la DB
let dbInstance = null;

// Fonction d'initialisation de la base de données
async function initDB() {
  // Si la base existe déjà, on la retourne
  if (dbInstance) {
    return dbInstance;
  }

  // Création de la base RxDB
  const db = await createRxDatabase({
    name: 'ordersdb',
    storage: getRxStorageMemory()
  });

  // Création de la collection orders
  await db.addCollections({
    orders: {
      schema: {
        title: 'orders schema',
        description: 'Schema de la collection des commandes',
        version: 0,
        primaryKey: 'id',
        type: 'object',

        properties: {
          // Clé primaire
          // IMPORTANT : RxDB exige maxLength pour une clé primaire string
          id: {
            type: 'string',
            maxLength: 100
          },

          // Identifiant de l'utilisateur
          userId: {
            type: 'string'
          },

          // Liste des produits dans la commande
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: {
                  type: 'string'
                },
                qty: {
                  type: 'number'
                },
                unitPrice: {
                  type: 'number'
                }
              },
              required: ['productId', 'qty', 'unitPrice']
            }
          },

          // Montant total de la commande
          totalAmount: {
            type: 'number'
          },

          // Statut de la commande
          status: {
            type: 'string'
          },

          // Date de création
          createdAt: {
            type: 'string'
          },

          // Date de mise à jour
          updatedAt: {
            type: 'string'
          }
        },

        // Champs obligatoires
        required: [
          'id',
          'userId',
          'items',
          'totalAmount',
          'status',
          'createdAt',
          'updatedAt'
        ]
      }
    }
  });

  // Sauvegarde de l'instance
  dbInstance = db;

  console.log('RxDB Orders initialized');

  return db;
}

// Export de la fonction initDB
module.exports = initDB;
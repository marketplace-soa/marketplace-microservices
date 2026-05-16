// Import des fonctions principales de RxDB
const { createRxDatabase } = require('rxdb');

// Storage en mémoire pour RxDB
// (simple pour un mini-projet et facile à tester)
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');


// Variable globale pour éviter de recréer la DB plusieurs fois
let dbInstance = null;


// Fonction d'initialisation de la base de données
async function initDB() {

  // Si la DB existe déjà, on la retourne directement
  if (dbInstance) {
    return dbInstance;
  }

  // Création de la base RxDB
  const db = await createRxDatabase({

    // Nom de la base
    name: 'ordersdb',

    // Type de stockage utilisé
    storage: getRxStorageMemory()
  });


  // Création des collections
  await db.addCollections({

    // Collection des commandes
    orders: {

      // Schéma JSON de la collection
      schema: {

        // Nom du schéma
        title: 'orders schema',

        // Version du schéma
        version: 0,

        // Clé primaire
        primaryKey: 'id',

        // Type principal
        type: 'object',

        // Définition des champs
        properties: {

          // ID unique de la commande
          id: {
            type: 'string'
          },

          // ID de l'utilisateur
          userId: {
            type: 'string'
          },

          // Liste des produits commandés
          items: {

            type: 'array',

            items: {

              type: 'object',

              properties: {

                // ID du produit
                productId: {
                  type: 'string'
                },

                // Quantité commandée
                qty: {
                  type: 'number'
                },

                // Prix unitaire du produit
                unitPrice: {
                  type: 'number'
                }
              }
            }
          },

          // Montant total de la commande
          totalAmount: {
            type: 'number'
          },

          // Statut de la commande
          // Exemples :
          // pending
          // confirmed
          // cancelled
          // payment_failed
          status: {
            type: 'string'
          },

          // Date de création
          createdAt: {
            type: 'string'
          },

          // Date de dernière modification
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


  // Sauvegarde de l'instance de la DB
  dbInstance = db;

  console.log('RxDB Orders initialized');


  // Retourne la DB
  return db;
}


// Export de la fonction
module.exports = initDB;
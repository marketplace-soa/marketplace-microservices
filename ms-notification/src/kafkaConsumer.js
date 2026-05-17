// Import KafkaJS
const { Kafka } = require('kafkajs');

// Import UUID pour générer des IDs
const { v4: uuidv4 } = require('uuid');

// Import de la base RxDB notifications
const initDB = require('./db');

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'ms-notification',
  brokers: ['localhost:9092']
});

// Création du consumer Kafka
const consumer = kafka.consumer({
  groupId: 'notification-group'
});


// Fonction principale du consumer
async function startConsumer() {

  try {

    // Connexion Kafka
    await consumer.connect();

    console.log('Kafka Consumer Notification connecté');

    // Souscription aux topics
    await consumer.subscribe({
      topic: 'order.events',
      fromBeginning: true
    });

    await consumer.subscribe({
      topic: 'payment.events',
      fromBeginning: true
    });

    await consumer.subscribe({
      topic: 'product.events',
      fromBeginning: true
    });

    // Traitement des messages Kafka
    await consumer.run({

      eachMessage: async ({ topic, message }) => {

        // Conversion du message JSON
        const event = JSON.parse(message.value.toString());

        console.log('Event reçu:', event);

        // Initialisation DB
        const db = await initDB();

        let notification = null;

        // =============================
        // ORDER CREATED
        // =============================
        if (event.type === 'order.created') {

          notification = {
            id: uuidv4(),
            userId: event.userId,
            type: 'order',
            message: `Votre commande ${event.orderId} a été créée`,
            read: false,
            createdAt: new Date().toISOString()
          };
        }

        // =============================
        // ORDER CANCELLED
        // =============================
        else if (event.type === 'order.cancelled') {

          notification = {
            id: uuidv4(),
            userId: 'user123',
            type: 'order',
            message: `Votre commande ${event.orderId} a été annulée`,
            read: false,
            createdAt: new Date().toISOString()
          };
        }

        // =============================
        // PAYMENT COMPLETED
        // =============================
        else if (event.type === 'payment.completed') {

          notification = {
            id: uuidv4(),
            userId: event.userId,
            type: 'payment',
            message: `Paiement confirmé pour la commande ${event.orderId}`,
            read: false,
            createdAt: new Date().toISOString()
          };
        }

        // =============================
        // PAYMENT FAILED
        // =============================
        else if (event.type === 'payment.failed') {

          notification = {
            id: uuidv4(),
            userId: event.userId,
            type: 'payment',
            message: `Échec du paiement pour la commande ${event.orderId}`,
            read: false,
            createdAt: new Date().toISOString()
          };
        }

        // =============================
        // STOCK LOW
        // =============================
        else if (event.type === 'stock.low') {

          notification = {
            id: uuidv4(),
            userId: 'admin',
            type: 'stock',
            message: `Stock faible pour le produit ${event.productId}`,
            read: false,
            createdAt: new Date().toISOString()
          };
        }

        // Sauvegarde notification
        if (notification) {

          await db.notifications.insert(notification);

          console.log('Notification créée');
        }
      }
    });

  } catch (error) {

    console.log('Kafka non disponible pour le moment');
  }
}


// Export
module.exports = {
  startConsumer
};
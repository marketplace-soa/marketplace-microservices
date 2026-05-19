// kafkaProducer.js — producteur Kafka pour MS Paiement
const { Kafka } = require('kafkajs');

// 1. Créer l’instance Kafka
// clientId = nom du microservice pour l’identifier
// brokers = liste de brokers Kafka
const kafka = require('./kafkaClient');

// 2. Créer le producteur
const producer = kafka.producer({ timeout: 30000 });

// 3.Fonction pour connecter le producteur
//  Doit être awaitée avant de démarrer le serveur gRPC
const connectProducer = async (retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await producer.connect();
      console.log('Kafka Producer connecté pour MS Paiement');
      return; // connexion réussie — on sort
    } catch (err) {
      console.warn(`Tentative ${i}/${retries} échouée — retry dans ${delay/1000}s`);
      if (i === retries) throw err; // toutes les tentatives épuisées
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// 4. Fonction pour publier paiement réussi
const publishPaymentCompleted = async (payment) => {
  try {
    await producer.send({
      topic: 'payment.events',
      messages: [{ value: JSON.stringify({ type: 'payment.completed', ...payment }) }]
    });
    console.log(' payment.completed publié — order_id:', payment.order_id);
  } catch (err) {
    console.error(' Erreur publication payment.events:', err.message);
  }
};

// 5. Fonction pour publier paiement échoué
const publishPaymentFailed = async (payment) => {
  try {
    await producer.send({
      topic: 'payment.events',
      messages: [{ value: JSON.stringify({ type: 'payment.failed', ...payment }) }]
    });
    console.log('payment.failed publié — order_id:', payment.order_id);
  } catch (err) {
    console.error(' Erreur publication payment.events:', err.message);
  }
};

// 6. Fonction pour publier paiement remboursé
const publishPaymentRefunded = async (payment) => {
  try {
    await producer.send({
      topic: 'payment.events',
      messages: [{ value: JSON.stringify({ type: 'payment.refunded', ...payment }) }]
    });
    console.log('payment.refunded publié — order_id:', payment.order_id);
  } catch (err) {
    console.error('Erreur publication payment.events:', err.message);
  }
};

// Exporter le producteur et les fonctions
module.exports = {
  producer,
  connectProducer,
  publishPaymentCompleted,
  publishPaymentFailed,
  publishPaymentRefunded
};
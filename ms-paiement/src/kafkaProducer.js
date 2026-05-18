// kafkaProducer.js — producteur Kafka pour MS Paiement
const { Kafka } = require('kafkajs');

// 1. Créer l’instance Kafka
// clientId = nom du microservice pour l’identifier
// brokers = liste de brokers Kafka
const kafka = new Kafka({
  clientId: 'ms-paiement',
  brokers: ['localhost:9092']
});

// 2. Créer le producteur
const producer = kafka.producer();

// 3.Fonction pour connecter le producteur
//  Doit être awaitée avant de démarrer le serveur gRPC
const connectProducer = async () => {
  await producer.connect(); // connexion asynchrone
  console.log('Kafka Producer connecté pour MS Paiement');
};

// 4. Fonction pour publier paiement réussi
const publishPaymentCompleted = async (payment) => {
  await producer.send({
    topic: 'payment.events',         // Topic Kafka cible
    messages: [
      {
        value: JSON.stringify({      // Convertir l’objet en JSON
          type: 'payment.completed', // Type d’événement
          ...payment                  // Toutes les infos du paiement
        })
      }
    ]
  });
};

// 5. Fonction pour publier paiement échoué
const publishPaymentFailed = async (payment) => {
  await producer.send({
    topic: 'payment.events',
    messages: [
      { value: JSON.stringify({ type: 'payment.failed', ...payment }) }
    ]
  });
};

// 6. Fonction pour publier paiement remboursé
const publishPaymentRefunded = async (payment) => {
  await producer.send({
    topic: 'payment.events',
    messages: [
      { value: JSON.stringify({ type: 'payment.refunded', ...payment }) }
    ]
  });
};

// Exporter le producteur et les fonctions
module.exports = {
  producer,
  connectProducer,
  publishPaymentCompleted,
  publishPaymentFailed,
  publishPaymentRefunded
};
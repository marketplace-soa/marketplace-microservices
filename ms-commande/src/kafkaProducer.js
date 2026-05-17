// Import KafkaJS
const { Kafka } = require('kafkajs');

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'ms-commande',
  brokers: ['localhost:9092']
});

// Création du producer Kafka
const producer = kafka.producer();


// Fonction de connexion du producer
async function connectProducer() {

  await producer.connect();

  console.log('Kafka Producer connected');
}


// Fonction générique pour envoyer un événement
async function sendEvent(topic, event) {

  try {

    await producer.send({
      topic: topic,

      messages: [
        {
          value: JSON.stringify(event)
        }
      ]
    });

    console.log(`Event sent to ${topic}`);

  } catch (error) {

    console.error('Kafka Producer Error:', error);
  }
}


// Export des fonctions
module.exports = {
  connectProducer,
  sendEvent
};
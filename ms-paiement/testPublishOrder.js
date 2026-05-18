// testPublishOrder.js
// Simule MS Commande (M2) qui publie un order.created sur order.events
// Fichier de test uniquement — ne pas inclure dans la version finale

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-publisher',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const run = async () => {
  // 1. Connecter le producteur
  await producer.connect();
  console.log('Producteur de test connecté');

  // 2. Construire le message order.created
  // Structure PLATE — orderId, amount, method directement dans le message
  // C'est exactement ce que M2 publiera plus tard
  const orderMessage = {
    type: 'order.created',
    orderId: 'order-test-' + Date.now(), // id unique à chaque exécution
    amount: 150.00,
    method: 'card'
  };

  // 3. Publier sur order.events
  await producer.send({
    topic: 'order.events',
    messages: [
      { value: JSON.stringify(orderMessage) }
    ]
  });

  console.log('Message publié sur order.events :');
  console.log(orderMessage);

  // 4. Attendre 3 secondes pour laisser le consumer traiter
  console.log('En attente de traitement par MS Paiement...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 5. Déconnecter
  await producer.disconnect();
  console.log('Producteur de test déconnecté — test terminé');
};

run().catch(console.error);
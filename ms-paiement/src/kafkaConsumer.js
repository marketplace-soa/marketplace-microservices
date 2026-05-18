const { Kafka } = require('kafkajs');
const paymentService = require('./paymentService');
const { publishPaymentCompleted, publishPaymentFailed } = require('./kafkaProducer');

const kafka = new Kafka({
  clientId: 'ms-paiement-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'paiement-group' });

const startConsumer = async () => {
  // 1. Connexion
  await consumer.connect();

  // 2. S'abonner au topic order.events
  await consumer.subscribe({ topic: 'order.events', fromBeginning: false });

  // 3. Boucle infinie pour chaque message reçu
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {

      // 3.a Conversion en string
      const raw = message.value?.toString();
      if (!raw) return;

      // 3.b Parser JSON avec protection
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error('Message JSON invalide, ignoré');
        return;
      }

      //  Log pour voir la structure exacte reçue
      console.log('Message reçu sur order.events :', JSON.stringify(data, null, 2));

      // 3.c Vérifier le type
      if (data.type !== 'order.created') return;

      //  Extraction robuste des champs
      // supporte structure plate ET structure imbriquée
        // ✅ structure plate : data.orderId, data.amount, data.method
        const orderId = data.orderId || data.order?.id;
        const amount  = data.amount  || data.order?.amount;
        const method  = data.method  || data.order?.method || 'card';

        if (!orderId || amount === undefined) {
        console.error('Champs manquants dans le message:', data);
        return;
        }

const payment = paymentService.processPayment(orderId, amount, method);
      // 4. Créer paiement automatiquement
      try {
        const payment = paymentService.processPayment(orderId, amount, method);

        // 5. Publier résultat sur payment.events
        if (payment.status === 'completed') {
          await publishPaymentCompleted(payment);
          console.log('payment.completed publié pour orderId:', orderId);
        } else {
          await publishPaymentFailed(payment);
          console.log(' payment.failed publié pour orderId:', orderId);
        }

      } catch (e) {
        // Logger l'erreur complète avec le contexte
        console.error('Erreur processPayment:', e.message, '| orderId:', orderId);
      }
    }
  });

  console.log('Kafka Consumer MS Paiement démarré sur order.events');
};

module.exports = { startConsumer };
const { Kafka } = require('kafkajs');
const paymentService = require('./paymentService');
const { publishPaymentCompleted, publishPaymentFailed } = require('./kafkaProducer');

const kafka = new Kafka({
  clientId: 'ms-paiement-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'paiement-group' });

const startConsumer = async (retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await consumer.connect();
      break; // connexion réussie
    } catch (err) {
      console.warn(`Consumer tentative ${i}/${retries} — retry dans ${delay/1000}s`);
      if (i === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  await consumer.subscribe({ topic: 'order.events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error('Message JSON invalide, ignoré');
        return;
      }

      console.log('Message reçu sur order.events :', JSON.stringify(data, null, 2));

      if (data.type !== 'order.created') return;

      const orderId = data.orderId || data.order?.id;
      const amount  = data.amount  || data.order?.amount;
      const method  = data.method  || data.order?.method || 'card';

      if (!orderId || amount === undefined) {
        console.error('Champs manquants:', data);
        return;
      }

      try {
        const payment = paymentService.processPayment(orderId, amount, method);
        if (payment.status === 'completed') {
          await publishPaymentCompleted(payment);
          console.log('payment.completed publié pour orderId:', orderId);
        } else {
          await publishPaymentFailed(payment);
          console.log(' payment.failed publié pour orderId:', orderId);
        }
      } catch (e) {
        console.error('Erreur processPayment:', e.message, '| orderId:', orderId);
      }
    }
  });

  console.log('Kafka Consumer MS Paiement démarré sur order.events');
};

module.exports = { startConsumer };
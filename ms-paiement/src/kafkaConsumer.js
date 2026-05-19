// kafkaConsumer.js — MS Paiement
const paymentService = require('./paymentService');
const { publishPaymentCompleted, publishPaymentFailed } = require('./kafkaProducer');

//  Instance Kafka partagée — une seule déclaration
const kafka = require('./kafkaClient');

//  Consumer créé ici avec timeouts explicites
const consumer = kafka.consumer({
  groupId: 'paiement-group-v2',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxWaitTimeInMs: 5000
});

const startConsumer = async (retries = 5, delay = 3000) => {

  // Connexion avec retry
  for (let i = 1; i <= retries; i++) {
    try {
      await consumer.connect();
      console.log('Kafka Consumer connecté');
      break;
    } catch (err) {
      console.warn(`Consumer tentative ${i}/${retries} — retry dans ${delay/1000}s`);
      if (i === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // S'abonner à order.events
  await consumer.subscribe({ topic: 'order.events', fromBeginning: false });

  // Boucle de traitement
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

      // Ignorer tout ce qui n'est pas order.created
      if (data.type !== 'order.created') return;

      //  Support structure plate ET imbriquée + totalAmount de M2
      const orderId = data.orderId || data.order?.id;
      const amount  = data.amount  || data.totalAmount || data.order?.amount;
      const method  = data.method  || data.order?.method || 'card';
      const userId  = data.userId  || data.order?.userId || '';

      if (!orderId || amount === undefined) {
        console.error('Champs manquants dans message:', data);
        return;
      }

      try {
        const payment = paymentService.processPayment(orderId, amount, method);

        // Enrichir l'objet payment
        payment.userId   = userId;
        payment.order_id = payment.order_id || payment.orderId || orderId;

        if (payment.status === 'completed') {
          await publishPaymentCompleted(payment);
          console.log(' payment.completed publié pour orderId:', orderId);
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
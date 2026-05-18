const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const paymentService = require('./paymentService');
const { connectProducer, publishPaymentCompleted, publishPaymentFailed, publishPaymentRefunded } = require('./kafkaProducer');
const { startConsumer } = require('./kafkaConsumer');

const PROTO_PATH = path.join(__dirname, '../../protos/payment.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,   // ✅ garde snake_case — cohérent avec le proto
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const paymentProto = grpc.loadPackageDefinition(packageDefinition).payment;

const server = new grpc.Server();

// ✅ Helper — snake_case partout car keepCase: true
const toGrpcPayment = (payment) => ({
  id:         payment.id                            || '',
  order_id:   payment.order_id  || payment.orderId  || '',
  amount:     payment.amount                        || 0,
  status:     payment.status                        || 'unknown',
  method:     payment.method                        || '',
  created_at: payment.created_at                    || '',
  updated_at: payment.updated_at                    || ''
});

server.addService(paymentProto.PaymentService.service, {

  // Handler 1 — ProcessPayment
  ProcessPayment: async (call, callback) => {
    try {
      // keepCase:true → proto order_id reste order_id dans call.request
      const { order_id, amount, method } = call.request;

      console.log('ProcessPayment reçu — order_id:', order_id, '| amount:', amount);

      const payment = paymentService.processPayment(order_id, amount, method);

      if (!payment || !payment.id)  
        console.error("Erreur: payment est undefined ou id manquant");
        return callback({ code: grpc.status.INTERNAL, message: 'Payment not created' });

      if (payment.status === 'completed') {
        await publishPaymentCompleted(payment);
      } else {
        await publishPaymentFailed(payment);
      }

      callback(null, { payment: toGrpcPayment(payment) });

    } catch (e) {
      console.error('Erreur ProcessPayment:', e.message);
      callback({ code: grpc.status.ALREADY_EXISTS, message: e.message });
    }
  },

  // Handler 2 — GetPaymentStatus
  GetPaymentStatus: (call, callback) => {
    try {
      // keepCase:true → order_id dans call.request
      const { order_id } = call.request;

      console.log('GetPaymentStatus reçu — order_id:', order_id);

      const payment = paymentService.getPaymentByOrderId(order_id);

      if (!payment) return callback({ code: grpc.status.NOT_FOUND, message: 'Paiement introuvable' });

      callback(null, { payment: toGrpcPayment(payment) });

    } catch (e) {
      console.error('Erreur GetPaymentStatus:', e.message);
      callback({ code: grpc.status.INTERNAL, message: e.message });
    }
  },

  // Handler 3 — RefundPayment
  RefundPayment: async (call, callback) => {
    try {
      // keepCase:true → payment_id dans call.request
      const { payment_id } = call.request;

      console.log('RefundPayment reçu — payment_id:', payment_id);

      const payment = paymentService.refundPayment(payment_id);

      if (!payment) return callback({ code: grpc.status.NOT_FOUND, message: 'Paiement introuvable' });

      await publishPaymentRefunded(payment);

      callback(null, { payment: toGrpcPayment(payment) });

    } catch (e) {
      console.error('Erreur RefundPayment:', e.message);
      const code = e.message === 'NOT_FOUND'
        ? grpc.status.NOT_FOUND
        : grpc.status.FAILED_PRECONDITION;
      callback({ code, message: e.message });
    }
  }

});

const main = async () => {
  await connectProducer();
  startConsumer();
  server.bindAsync(
    '0.0.0.0:50053',
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) { console.error('Erreur démarrage:', err); return; }
      console.log(`MS Paiement gRPC server démarré sur port ${port}`);
    }
  );
};

main().catch(console.error); 

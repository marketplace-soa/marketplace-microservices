// paymentClient.js
// Client gRPC qui permet au Gateway d'appeler MS Paiement (port 50053)

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../protos/payment.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,   // snake_case — cohérent avec MS Paiement
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const paymentProto = grpc.loadPackageDefinition(packageDefinition).payment;

// Créer le client gRPC connecté à MS Paiement
const paymentClient = new paymentProto.PaymentService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

module.exports = paymentClient;
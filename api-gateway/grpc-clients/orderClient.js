// Import du module gRPC
const grpc = require('@grpc/grpc-js');

// Import du loader proto
const protoLoader = require('@grpc/proto-loader');

// Module path pour gérer les chemins
const path = require('path');

// Chemin vers le proto order
const PROTO_PATH = path.join(
  __dirname,
  '../../protos/order.proto'
);

// Chargement du fichier proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Transformation du proto en package gRPC
const orderProto =
  grpc.loadPackageDefinition(packageDefinition).order;

// Création du client gRPC vers MS Commande
const orderClient = new orderProto.OrderService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

// Export du client
module.exports = orderClient;
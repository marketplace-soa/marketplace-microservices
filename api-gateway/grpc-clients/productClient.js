// Client gRPC qui permet au Gateway d'appeler MS Produit (port 50051)

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Charger le proto — même fichier que MS Produit utilise
const PROTO_PATH = path.join(__dirname, '../../protos/product.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,   // snake_case — cohérent avec MS Produit
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// Créer le client gRPC connecté à MS Produit
const productClient = new productProto.ProductService(
  'localhost:50051',                      // adresse de MS Produit
  grpc.credentials.createInsecure()       // pas de TLS en local
);

module.exports = productClient;
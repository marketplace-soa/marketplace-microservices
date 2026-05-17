// Import du module gRPC
const grpc = require('@grpc/grpc-js');

// Import du loader pour charger les fichiers .proto
const protoLoader = require('@grpc/proto-loader');

// Import du module path pour gérer les chemins
const path = require('path');

// Import des méthodes gRPC du service Commande
const orderService = require('./orderService');

// Import du producer Kafka
const kafkaProducer = require('./kafkaProducer');

// Chemin vers le fichier order.proto
const PROTO_PATH = path.join(__dirname, '../../protos/order.proto');

// Chargement du fichier .proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Transformation du proto en objet utilisable par gRPC
const orderProto = grpc.loadPackageDefinition(packageDefinition).order;

// Création du serveur gRPC
const server = new grpc.Server();

// Ajout du service OrderService dans le serveur gRPC
server.addService(orderProto.OrderService.service, {
  CreateOrder: orderService.CreateOrder,
  GetOrder: orderService.GetOrder,
  ListOrders: orderService.ListOrders,
  UpdateOrderStatus: orderService.UpdateOrderStatus,
  CancelOrder: orderService.CancelOrder
});

// Port du microservice Commande
const PORT = '0.0.0.0:50052';

// Démarrage du serveur gRPC
server.bindAsync(
  PORT,
  grpc.ServerCredentials.createInsecure(),

  // Callback async pour pouvoir connecter Kafka avant le démarrage complet
  async (error, port) => {
    if (error) {
      console.error('Erreur lors du démarrage du serveur gRPC:', error);
      return;
    }

    try {
        // Connexion du producer Kafka
        await kafkaProducer.connectProducer();

        console.log('Kafka Producer connecté');
    } catch (err) {
        // Kafka n'est pas encore démarré
        // On continue quand même pour tester gRPC
        console.warn('Kafka non connecté. Démarre Kafka plus tard sur localhost:9092.');
    }

  console.log(`MS Commande gRPC démarré sur le port ${port}`);
  server.start();
  }
);
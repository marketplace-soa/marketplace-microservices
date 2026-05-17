// Import du module gRPC
const grpc = require('@grpc/grpc-js');

// Import du loader pour charger les fichiers .proto
const protoLoader = require('@grpc/proto-loader');


const kafkaConsumer = require('./kafkaConsumer');

// Import du module path pour gérer les chemins
const path = require('path');

// Import des méthodes gRPC du service Notification
const notificationService = require('./notificationService');

// Chemin vers le fichier notification.proto
const PROTO_PATH = path.join(__dirname, '../../protos/notification.proto');

// Chargement du fichier .proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Transformation du proto en objet utilisable par gRPC
const notificationProto =
  grpc.loadPackageDefinition(packageDefinition).notification;

// Création du serveur gRPC
const server = new grpc.Server();

// Ajout du service NotificationService dans le serveur gRPC
server.addService(notificationProto.NotificationService.service, {
  ListNotifications: notificationService.ListNotifications,
  MarkAsRead: notificationService.MarkAsRead,
  GetUnreadCount: notificationService.GetUnreadCount
});

// Port du microservice Notification
const PORT = '0.0.0.0:50054';

// Démarrage du serveur gRPC
server.bindAsync(
  PORT,
  grpc.ServerCredentials.createInsecure(),

  async (error, port) => {

    if (error) {
      console.error('Erreur lors du démarrage du serveur Notification:', error);
      return;
    }

    // Démarrage Kafka Consumer
    try {
      await kafkaConsumer.startConsumer();
    } catch (error) {
      console.log('Kafka non connecté');
    }

    console.log(`MS Notification gRPC démarré sur le port ${port}`);

    server.start();
  }
);
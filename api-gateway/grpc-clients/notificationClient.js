// Import du module gRPC
const grpc = require('@grpc/grpc-js');

// Import du loader proto
const protoLoader = require('@grpc/proto-loader');

// Module path
const path = require('path');

// Chemin vers notification.proto
const PROTO_PATH = path.join(
  __dirname,
  '../../protos/notification.proto'
);

// Chargement du proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Transformation en package gRPC
const notificationProto =
  grpc.loadPackageDefinition(packageDefinition).notification;

// Client gRPC vers MS Notification
const notificationClient =
  new notificationProto.NotificationService(
    'localhost:50054',
    grpc.credentials.createInsecure()
  );

// Export
module.exports = notificationClient;
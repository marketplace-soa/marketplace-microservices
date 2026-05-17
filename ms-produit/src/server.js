// Serveur gRPC pour MS Produit point d’accès officiel pour d’autres services (et API Gateway plus tard).

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Modules métier et Kafka
const productService = require('./productService');
const kafka = require('./kafkaProducer');

// Chemin du proto
const PROTO_PATH = path.join(__dirname, '../../protos/product.proto');

// Charger le proto
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcObject = grpc.loadPackageDefinition(packageDef);
const productProto = grpcObject.product;

// Handlers gRPC
const handlers = {
  GetProduct: (call, callback) => {
    try {
      const product = productService.getProductById(call.request.id);
      if (!product) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Product not found'
        });
      }
      callback(null, { product });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  ListProducts: (call, callback) => {
    try {
      const products = productService.listProducts(call.request.category);
      callback(null, { products });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  CreateProduct: async (call, callback) => {
    try {
      const product = productService.createProduct(call.request);

      // Publier dans Kafka
      await kafka.publishProductCreated(product);
      callback(null, { product });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  UpdateStock: async (call, callback) => {
    try {
      const product = productService.updateStock(call.request.id, call.request.quantity);
      
      // Publier événements Kafka
      await kafka.publishStockUpdated(product);
      await kafka.publishStockLow(product);
      callback(null, { product });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  SearchProducts: (call, callback) => {
    try {
      const products = productService.searchProducts(call.request.query);
      callback(null, { products });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  GetPromoProducts: (call, callback) => {
    try {
      const products = productService.getPromoProducts();
      callback(null, { products });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  }
};

// Démarrage du serveur gRPC
async function startServer() {
  await kafka.connectProducer();

  const server = new grpc.Server();
  server.addService(productProto.ProductService.service, handlers);

  const PORT = '0.0.0.0:50051';
  server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Error binding gRPC server:', err);
      return;
    }
    server.start();
    console.log(`MS Produit gRPC server started on port ${port}`);
  });
}

startServer();
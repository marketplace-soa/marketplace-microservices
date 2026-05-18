// =============================
// IMPORTS
// =============================

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const { ApolloServer }      = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');


// =============================
// IMPORT ROUTES REST
// =============================

// Membre 2 — Commande + Notification
const ordersRoutes        = require('../rest/routes/orders');
const notificationsRoutes = require('../rest/routes/notifications');

// Membre 1 — Produit + Paiement
const productsRoutes      = require('../rest/routes/products');
const paymentsRoutes      = require('../rest/routes/payments');


// =============================
// IMPORT GRAPHQL RESOLVERS
// =============================

const resolvers = require('../graphql/resolvers');


// =============================
// FONCTION PRINCIPALE
// =============================
async function startServer() {

  const app = express();

  app.use(cors());
  app.use(express.json());


  // =============================
  // ROUTES REST
  // =============================

  // Membre 2
  app.use('/orders',        ordersRoutes);
  app.use('/notifications', notificationsRoutes);

  // Membre 1
  app.use('/products',      productsRoutes);
  app.use('/payments',      paymentsRoutes);


  // =============================
  // ROUTE SANTÉ — GET /
  // =============================
  app.get('/', (req, res) => {
    res.json({
      message: 'API Gateway — Marketplace Microservices',

      // Membre 2
      rest_m2: {
        orders:        'GET  /orders',
        order:         'GET  /orders/:id',
        createOrder:   'POST /orders',
        cancelOrder:   'PATCH /orders/:id/cancel',
        notifications: 'GET  /notifications/:userId',
        unread:        'GET  /notifications/:userId/unread'
      },

      // Membre 1
      rest_m1: {
        products:      'GET  /products',
        product:       'GET  /products/:id',
        promos:        'GET  /products/promo',
        search:        'GET  /products/search/:query',
        createProduct: 'POST /products',
        updateStock:   'PATCH /products/:id/stock',
        payment:       'GET  /payments/:orderId',
        processPayment:'POST /payments',
        refund:        'POST /payments/:paymentId/refund'
      },

      graphql: 'POST /graphql'
    });
  });


  // =============================
  // GRAPHQL
  // =============================

  const typeDefs = fs.readFileSync(
    path.join(__dirname, '../graphql/schema.gql'),
    'utf8'
  );

  const apolloServer = new ApolloServer({ typeDefs, resolvers });

  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer)
  );


  // =============================
  // DÉMARRAGE DU SERVEUR
  // =============================
  const PORT = 3000;

  app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`REST     → http://localhost:${PORT}/products`);
    console.log(`REST     → http://localhost:${PORT}/payments`);
    console.log(`REST     → http://localhost:${PORT}/orders`);
    console.log(`REST     → http://localhost:${PORT}/notifications`);
    console.log(`GraphQL  → http://localhost:${PORT}/graphql`);
  });
}


// =============================
// DÉMARRAGE APPLICATION
// =============================
startServer().catch((error) => {
  console.error('Erreur démarrage Gateway:', error);
});
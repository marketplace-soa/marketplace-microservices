// =============================
// IMPORTS
// =============================

// Framework Express
const express = require('express');

// Middleware CORS pour autoriser les requêtes externes
const cors = require('cors');

// Apollo Server pour GraphQL
const { ApolloServer } = require('@apollo/server');

// Middleware Apollo pour Express v4
const { expressMiddleware } = require('@as-integrations/express4');

// Module File System pour lire schema.gql
const fs = require('fs');

// Module path pour gérer les chemins
const path = require('path');


// =============================
// IMPORT ROUTES REST
// =============================

// Routes REST des commandes
const ordersRoutes = require('../rest/routes/orders');

// Routes REST des notifications
const notificationsRoutes = require('../rest/routes/notifications');


// =============================
// IMPORT GRAPHQL RESOLVERS
// =============================

// Resolvers GraphQL
const resolvers = require('../graphql/resolvers');


// =============================
// FONCTION PRINCIPALE
// =============================
async function startServer() {

  // Création de l'application Express
  const app = express();

  // Middleware CORS
  app.use(cors());

  // Middleware JSON
  app.use(express.json());


  // =============================
  // ROUTES REST
  // =============================

  // Routes REST commandes
  app.use('/orders', ordersRoutes);

  // Routes REST notifications
  app.use('/notifications', notificationsRoutes);


  // =============================
  // ROUTE TEST API
  // =============================
  app.get('/', (req, res) => {

    res.json({
      message: 'API Gateway running'
    });
  });


  // =============================
  // GRAPHQL
  // =============================

  // Lecture du fichier schema.gql
  const typeDefs = fs.readFileSync(

    path.join(__dirname, '../graphql/schema.gql'),

    'utf8'
  );

  // Création du serveur Apollo GraphQL
  const apolloServer = new ApolloServer({

    // Schéma GraphQL
    typeDefs,

    // Resolvers GraphQL
    resolvers
  });

  // Démarrage Apollo
  await apolloServer.start();


  // =============================
  // ENDPOINT GRAPHQL
  // =============================
  app.use(

    '/graphql',

    // Middleware Apollo
    expressMiddleware(apolloServer)
  );


  // =============================
  // DÉMARRAGE DU SERVEUR
  // =============================
  const PORT = 3000;

  app.listen(PORT, () => {

    console.log(`API Gateway running on port ${PORT}`);

    console.log(
      `GraphQL endpoint: http://localhost:${PORT}/graphql`
    );
  });
}


// =============================
// DÉMARRAGE APPLICATION
// =============================
startServer().catch((error) => {

  console.error(error);
});
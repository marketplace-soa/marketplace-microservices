
const {
  connectProducer,
  publishProductCreated
} = require('./src/kafkaProducer');

async function test() {
  try {
    // Connecter le producteur
    await connectProducer();

    // Exemple de produit à publier
    const product = {
      id: 'p001',
      name: 'Test Product',
      description: 'Produit pour test Kafka',
      price: 99.99,
      stock: 20,
      category: 'Test'
    };

    // Publier l'événement product.created
    await publishProductCreated(product);

    console.log('Test message publié sur Kafka !');

  } catch (err) {
    console.error('Erreur Kafka:', err);
  } finally {
    // Déconnecter proprement
    process.exit(0);
  }
}

// Lancer le test
test();
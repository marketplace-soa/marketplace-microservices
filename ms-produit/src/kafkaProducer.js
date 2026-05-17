// Producteur Kafka pour MS Produit

const { Kafka } = require('kafkajs');

// Créer l'instance Kafka
const kafka = new Kafka({
  clientId: 'ms-produit',
  brokers: ['localhost:9092'] // ton broker local
});

// Créer le producteur
const producer = kafka.producer();

// Connecter le producteur
async function connectProducer() {
  await producer.connect();
  console.log('Kafka Producer connected for MS Produit');
}

// Publier produit créé
async function publishProductCreated(product) {
  await producer.send({
    topic: 'product.events',
    messages: [
      {
        value: JSON.stringify({
          type: 'product.created',
          product
        })
      }
    ]
  });
  console.log(`Published product.created for ${product.id}`);
}

// Publier stock mis à jour
async function publishStockUpdated(product) {
  await producer.send({
    topic: 'product.events',
    messages: [
      {
        value: JSON.stringify({
          type: 'stock.updated',
          productId: product.id,
          newStock: product.stock
        })
      }
    ]
  });
  console.log(`Published stock.updated for ${product.id} -> ${product.stock}`);
}

// Publier stock bas
async function publishStockLow(product) {
  if (product.stock <= 5) { // seuil critique
    await producer.send({
      topic: 'product.events',
      messages: [
        {
          value: JSON.stringify({
            type: 'stock.low',
            productId: product.id,
            stock: product.stock
          })
        }
      ]
    });
    console.log(`Published stock.low for ${product.id} -> ${product.stock}`);
  }
}

// Exporter fonctions
module.exports = {
  connectProducer,
  publishProductCreated,
  publishStockUpdated,
  publishStockLow
};
// Import du module gRPC
const grpc = require('@grpc/grpc-js');

// Import pour générer des IDs uniques
const { v4: uuidv4 } = require('uuid');

// Import de la base RxDB
const initDB = require('./db');


const kafkaProducer = require('./kafkaProducer');


// =============================
// CREATE ORDER
// =============================
async function CreateOrder(call, callback) {

  try {

    // Récupération des données envoyées par le client
    const { user_id, items, total_amount } = call.request;

    // Initialisation de la DB
    const db = await initDB();

    // Création de l'objet commande
    const newOrder = {

      // ID unique
      id: uuidv4(),

      // ID utilisateur
      userId: user_id,

      // Produits commandés
      items: items.map(item => ({
        productId: item.product_id,
        qty: item.qty,
        unitPrice: item.unit_price
      })),

      // Montant total
      totalAmount: total_amount,

      // Statut initial
      status: 'pending',

      // Dates
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insertion dans RxDB
    await db.orders.insert(newOrder);

    console.log('✅ Order created:', newOrder.id);

    // Publication événement Kafka
    try {
        await kafkaProducer.sendEvent('order.events', {
            type: 'order.created',
            orderId: newOrder.id,
            userId: newOrder.userId,
            items: newOrder.items,
            totalAmount: newOrder.totalAmount,
            createdAt: newOrder.createdAt
        });
    } catch (error) {
        console.log('Kafka indisponible: order.created non envoyé');
    }

    // Réponse gRPC
    callback(null, {
      order: {
        id: newOrder.id,
        user_id: newOrder.userId,
        items: call.request.items,
        total_amount: newOrder.totalAmount,
        status: newOrder.status,
        created_at: newOrder.createdAt,
        updated_at: newOrder.updatedAt
      }
    });

  } catch (error) {

    console.error(error);

    callback({
      code: grpc.status.INTERNAL,
      message: 'Internal server error'
    });
  }
}


// =============================
// GET ORDER
// =============================
async function GetOrder(call, callback) {

  try {

    const { id } = call.request;

    const db = await initDB();

    // Recherche de la commande
    const order = await db.orders
      .findOne(id)
      .exec();

    // Si commande introuvable
    if (!order) {

      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Order not found'
      });
    }

    // Réponse gRPC
    callback(null, {
      order: {
        id: order.id,
        user_id: order.userId,

        items: order.items.map(item => ({
          product_id: item.productId,
          qty: item.qty,
          unit_price: item.unitPrice
        })),

        total_amount: order.totalAmount,
        status: order.status,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      }
    });

  } catch (error) {

    console.error(error);

    callback({
      code: grpc.status.INTERNAL,
      message: 'Internal server error'
    });
  }
}


// =============================
// LIST ORDERS
// =============================
async function ListOrders(call, callback) {

  try {

    const { user_id } = call.request;

    const db = await initDB();

    // Recherche des commandes de l'utilisateur
    const orders = await db.orders
      .find({
        selector: {
          userId: user_id
        }
      })
      .exec();

    // Transformation des données
    const formattedOrders = orders.map(order => ({
      id: order.id,

      user_id: order.userId,

      items: order.items.map(item => ({
        product_id: item.productId,
        qty: item.qty,
        unit_price: item.unitPrice
      })),

      total_amount: order.totalAmount,
      status: order.status,
      created_at: order.createdAt,
      updated_at: order.updatedAt
    }));

    // Réponse gRPC
    callback(null, {
      orders: formattedOrders
    });

  } catch (error) {

    console.error(error);

    callback({
      code: grpc.status.INTERNAL,
      message: 'Internal server error'
    });
  }
}


// =============================
// UPDATE ORDER STATUS
// =============================
async function UpdateOrderStatus(call, callback) {

  try {

    const { id, status } = call.request;

    const db = await initDB();

    // Recherche de la commande
    const order = await db.orders
      .findOne(id)
      .exec();

    // Si commande introuvable
    if (!order) {

      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Order not found'
      });
    }

    // Nouvelle date de modification
    const updatedAt = new Date().toISOString();

    // Mise à jour du document RxDB
    // patch() ne nécessite pas le plugin RxDBUpdatePlugin
    await order.patch({
        status: status,
        updatedAt: updatedAt
    });

    console.log('✅ Order updated:', order.id);

    // Réponse gRPC
    callback(null, {
      order: {
        id: order.id,
        user_id: order.userId,

        items: order.items.map(item => ({
          product_id: item.productId,
          qty: item.qty,
          unit_price: item.unitPrice
        })),

        total_amount: order.totalAmount,
        status: status,
        created_at: order.createdAt,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {

    console.error(error);

    callback({
      code: grpc.status.INTERNAL,
      message: 'Internal server error'
    });
  }
}


// =============================
// CANCEL ORDER
// =============================
async function CancelOrder(call, callback) {

  try {

    const { id } = call.request;

    const db = await initDB();

    // Recherche de la commande
    const order = await db.orders
      .findOne(id)
      .exec();

    // Commande introuvable
    if (!order) {

      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Order not found'
      });
    }

    // Impossible d'annuler une commande livrée
    if (order.status === 'delivered') {

      return callback({
        code: grpc.status.FAILED_PRECONDITION,
        message: 'Delivered order cannot be cancelled'
      });
    }

    // Nouvelle date de modification
    const updatedAt = new Date().toISOString();

    // Mise à jour du document RxDB
    await order.patch({
      status: 'cancelled',
      updatedAt: updatedAt
    });

    console.log('✅ Order cancelled:', order.id);

    // Publication événement Kafka
    try {
        await kafkaProducer.sendEvent('order.events', {
            type: 'order.cancelled',
            orderId: order.id,
            cancelledAt: updatedAt
        });
    } catch (error) {
        console.log('Kafka indisponible: order.cancelled non envoyé');
    }

    // Réponse gRPC
    callback(null, {
      order: {
        id: order.id,
        user_id: order.userId,

        items: order.items.map(item => ({
          product_id: item.productId,
          qty: item.qty,
          unit_price: item.unitPrice
        })),

        total_amount: order.totalAmount,
        status: 'cancelled',
        created_at: order.createdAt,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {

    console.error(error);

    callback({
      code: grpc.status.INTERNAL,
      message: 'Internal server error'
    });
  }
}


// Export des méthodes gRPC
module.exports = {
  CreateOrder,
  GetOrder,
  ListOrders,
  UpdateOrderStatus,
  CancelOrder
};
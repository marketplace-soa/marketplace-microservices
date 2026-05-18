// resolvers.js — API Gateway
// Membre 2 : Commande + Notification
// Membre 1 : Produit + Paiement

// ─────────────────────────────────────────────
// Clients gRPC
// ─────────────────────────────────────────────

// Membre 2
const orderClient        = require('../grpc-clients/orderClient');
const notificationClient = require('../grpc-clients/notificationClient');

// Membre 1
const productClient      = require('../grpc-clients/productClient');
const paymentClient      = require('../grpc-clients/paymentClient');

// ─────────────────────────────────────────────
// Helper — transforme un appel gRPC en Promise
// ─────────────────────────────────────────────

// Version M2 — prend une méthode bindée
function grpcCall(clientMethod, request) {
  return new Promise((resolve, reject) => {
    clientMethod(request, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
}

// Version M1 — prend le client + le nom de la méthode
// Les deux helpers coexistent sans conflit
const grpcCallByName = (client, method, request) => {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

// ─────────────────────────────────────────────
// Resolvers
// ─────────────────────────────────────────────

const resolvers = {
  Query: {

    // ── Membre 2 — Commande ─────────────────────────────
    order: async (_, args) => {
      const response = await grpcCall(
        orderClient.GetOrder.bind(orderClient),
        { id: args.id }
      );
      return response.order;
    },

    orders: async (_, args) => {
      const response = await grpcCall(
        orderClient.ListOrders.bind(orderClient),
        { user_id: args.user_id }
      );
      return response.orders;
    },

    // ── Membre 2 — Notification ─────────────────────────
    notifications: async (_, args) => {
      const response = await grpcCall(
        notificationClient.ListNotifications.bind(notificationClient),
        { user_id: args.user_id }
      );
      return response.notifications;
    },

    unreadCount: async (_, args) => {
      const response = await grpcCall(
        notificationClient.GetUnreadCount.bind(notificationClient),
        { user_id: args.user_id }
      );
      return response.count;
    },

    // ── Membre 1 — Produit ──────────────────────────────
    product: async (_, { id }) => {
      const res = await grpcCallByName(productClient, 'getProduct', { id });
      return res.product;
    },

    products: async (_, { category }) => {
      const res = await grpcCallByName(productClient, 'listProducts', { category: category || '' });
      return res.products;
    },

    promoProducts: async () => {
      const res = await grpcCallByName(productClient, 'getPromoProducts', {});
      return res.products;
    },

    searchProducts: async (_, { query }) => {
      const res = await grpcCallByName(productClient, 'searchProducts', { query });
      return res.products;
    },

    // ── Membre 1 — Paiement ─────────────────────────────
    paymentStatus: async (_, { orderId }) => {
      const res = await grpcCallByName(paymentClient, 'getPaymentStatus', { order_id: orderId });
      return res.payment;
    }
  },

  Mutation: {

    // ── Membre 2 — Commande ─────────────────────────────
    createOrder: async (_, args) => {
      const response = await grpcCall(
        orderClient.CreateOrder.bind(orderClient),
        {
          user_id:      args.user_id,
          items:        args.items,
          total_amount: args.total_amount
        }
      );
      return response.order;
    },

    updateOrderStatus: async (_, args) => {
      const response = await grpcCall(
        orderClient.UpdateOrderStatus.bind(orderClient),
        {
          id:     args.id,
          status: args.status
        }
      );
      return response.order;
    },

    cancelOrder: async (_, args) => {
      const response = await grpcCall(
        orderClient.CancelOrder.bind(orderClient),
        {
          id:     args.id,
          reason: args.reason || ''
        }
      );
      return response.order;
    },

    // ── Membre 2 — Notification ─────────────────────────
    markNotificationAsRead: async (_, args) => {
      const response = await grpcCall(
        notificationClient.MarkAsRead.bind(notificationClient),
        { notification_id: args.notification_id }
      );
      return response.notification;
    },

    // ── Membre 1 — Produit ──────────────────────────────
    createProduct: async (_, args) => {
      const res = await grpcCallByName(productClient, 'createProduct', {
        name:             args.name,
        description:      args.description      || '',
        price:            args.price,
        stock:            args.stock,
        category:         args.category,
        promo_price:      args.promo_price      || 0,
        promo_expires_at: args.promo_expires_at || ''
      });
      return res.product;
    },

    updateStock: async (_, { id, quantity }) => {
      const res = await grpcCallByName(productClient, 'updateStock', { id, quantity });
      return res.product;
    },

    // ── Membre 1 — Paiement ─────────────────────────────
    processPayment: async (_, { order_id, amount, method }) => {
      const res = await grpcCallByName(paymentClient, 'processPayment', {
        order_id,
        amount,
        method
      });
      return res.payment;
    },

    refundPayment: async (_, { paymentId }) => {
      const res = await grpcCallByName(paymentClient, 'refundPayment', {
        payment_id: paymentId
      });
      return res.payment;
    }
  }
};

module.exports = resolvers;
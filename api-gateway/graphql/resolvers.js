// Client gRPC du microservice Commande
const orderClient = require('../grpc-clients/orderClient');

// Client gRPC du microservice Notification
const notificationClient = require('../grpc-clients/notificationClient');


// Petite fonction utilitaire pour transformer un appel gRPC callback en Promise
function grpcCall(clientMethod, request) {
  return new Promise((resolve, reject) => {
    clientMethod(request, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}


// Resolvers GraphQL
const resolvers = {
  Query: {
    // Récupérer une commande par ID
    order: async (_, args) => {
      const response = await grpcCall(
        orderClient.GetOrder.bind(orderClient),
        { id: args.id }
      );

      return response.order;
    },

    // Lister les commandes d'un utilisateur
    orders: async (_, args) => {
      const response = await grpcCall(
        orderClient.ListOrders.bind(orderClient),
        { user_id: args.user_id }
      );

      return response.orders;
    },

    // Lister les notifications d'un utilisateur
    notifications: async (_, args) => {
      const response = await grpcCall(
        notificationClient.ListNotifications.bind(notificationClient),
        { user_id: args.user_id }
      );

      return response.notifications;
    },

    // Récupérer le nombre de notifications non lues
    unreadCount: async (_, args) => {
      const response = await grpcCall(
        notificationClient.GetUnreadCount.bind(notificationClient),
        { user_id: args.user_id }
      );

      return response.count;
    }
  },

  Mutation: {
    // Créer une commande
    createOrder: async (_, args) => {
      const response = await grpcCall(
        orderClient.CreateOrder.bind(orderClient),
        {
          user_id: args.user_id,
          items: args.items,
          total_amount: args.total_amount
        }
      );

      return response.order;
    },

    // Modifier le statut d'une commande
    updateOrderStatus: async (_, args) => {
      const response = await grpcCall(
        orderClient.UpdateOrderStatus.bind(orderClient),
        {
          id: args.id,
          status: args.status
        }
      );

      return response.order;
    },

    // Annuler une commande
    cancelOrder: async (_, args) => {
      const response = await grpcCall(
        orderClient.CancelOrder.bind(orderClient),
        {
          id: args.id,
          reason: args.reason || ''
        }
      );

      return response.order;
    },

    // Marquer une notification comme lue
    markNotificationAsRead: async (_, args) => {
      const response = await grpcCall(
        notificationClient.MarkAsRead.bind(notificationClient),
        {
          notification_id: args.notification_id
        }
      );

      return response.notification;
    }
  }
};

module.exports = resolvers;
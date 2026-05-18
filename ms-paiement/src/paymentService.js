const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const paymentService = {

  // 1. ProcessPayment
  processPayment: (orderId, amount, method) => {
    // Protection double paiement
    const existing = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId);
    if (existing) throw new Error('ALREADY_EXISTS');

    const id = uuidv4();

    // Simulation : 90% completed, 10% failed
    const status = amount > 0 ? (Math.random() < 0.9 ? 'completed' : 'failed') : 'failed';

    // Insérer en base
    db.prepare(`
      INSERT INTO payments (id, order_id, amount, status, method, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(id, orderId, amount, status, method);

    // Retourner avec les deux formes
    return {
      id,
      order_id: orderId,   // snake_case — pour proto et DB
      orderId,             // camelCase — pour compatibilité JS
      amount,
      status,
      method,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  // 2. GetPaymentByOrderId
  getPaymentByOrderId: (orderId) => {
    const row = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId);
    if (!row) return null;

    return {
      id:         row.id,
      order_id:   row.order_id,
      orderId:    row.order_id,
      amount:     row.amount,
      status:     row.status,
      method:     row.method,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }, // ✅ accolade et virgule correctes

  // 3. RefundPayment
  refundPayment: (paymentId) => {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    if (!payment) throw new Error('NOT_FOUND');
    if (payment.status !== 'completed') throw new Error('FAILED_PRECONDITION');

    db.prepare('UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('refunded', paymentId);

    return {
      id:         payment.id,
      order_id:   payment.order_id,
      orderId:    payment.order_id,
      amount:     payment.amount,
      status:     'refunded',
      method:     payment.method,
      created_at: payment.created_at,
      updated_at: new Date().toISOString()
    };
  } // ✅ pas de virgule sur le dernier

}; // ✅ fermeture de l'objet paymentService

// ✅ Export correct — l'objet entier
module.exports = paymentService;



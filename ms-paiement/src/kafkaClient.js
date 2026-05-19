const { Kafka } = require('kafkajs');

// Fix Node.js v24 — patcher Date.now avant création Kafka
const originalDateNow = Date.now;
Date.now = () => Math.max(0, originalDateNow());

const kafka = new Kafka({
  clientId: 'ms-paiement',
  brokers: ['localhost:9092'],
  connectionTimeout: 10000,
  requestTimeout: 30000,
  enforceRequestTimeout: false,
  retry: {
    initialRetryTime: 3000,
    retries: 5
  }
});

// Restaurer Date.now après création
Date.now = originalDateNow;

module.exports = kafka;
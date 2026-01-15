const Queue = require('bull');
const dotenv = require('dotenv');

dotenv.config();

const redisConfig = {
    redis: process.env.REDIS_URL || 'redis://redis:6379'
};

// Create Queues
const paymentQueue = new Queue('payment-processing', redisConfig);
const webhookQueue = new Queue('webhook-delivery', redisConfig);
const refundQueue = new Queue('refund-processing', redisConfig);

module.exports = {
    paymentQueue,
    webhookQueue,
    refundQueue
};
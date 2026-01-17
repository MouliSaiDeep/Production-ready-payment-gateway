const Queue = require('bull');
const dotenv = require('dotenv');

dotenv.config();

const redisConfig = {
    redis: process.env.REDIS_URL || 'redis://redis:6379',
    settings: {
        backoffStrategies: {
            webhookBackoff: (attemptsMade) => {
                const isTest = process.env.WEBHOOK_RETRY_INTERVALS_TEST === 'true';
                if (isTest) {
                    // Test delays: 5s, 10s, 15s, 20s
                    const testDelays = {
                        1: 5000,
                        2: 10000,
                        3: 15000,
                        4: 20000
                    };
                    return testDelays[attemptsMade] || 20000;
                }
                
                // Production delays: 1m, 5m, 30m, 2h
                const delays = {
                    1: 60000,      // 1 min
                    2: 300000,     // 5 min
                    3: 1800000,    // 30 min
                    4: 7200000     // 2 hours
                };
                return delays[attemptsMade] || 7200000;
            }
        }
    }
};

// Create Queues
const paymentQueue = new Queue('payment-processing', process.env.REDIS_URL || 'redis://redis:6379');
const webhookQueue = new Queue('webhook-delivery', process.env.REDIS_URL || 'redis://redis:6379', redisConfig);
const refundQueue = new Queue('refund-processing', process.env.REDIS_URL || 'redis://redis:6379');

module.exports = {
    paymentQueue,
    webhookQueue,
    refundQueue
};
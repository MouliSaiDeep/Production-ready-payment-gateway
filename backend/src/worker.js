const { paymentQueue, webhookQueue, refundQueue } = require('./config/queue');
const processPayment = require('./jobs/processPayment');
const deliverWebhook = require('./jobs/deliverWebhook');
const processRefund = require('./jobs/processRefund'); // Import new job
const db = require('./config/db');

console.log('🚀 Worker Service Starting...');

db.pool.connect()
    .then(() => console.log('✅ Worker connected to Database'))
    .catch(err => console.error('❌ Worker DB connection failed', err));

// 1. Process Payment Jobs
paymentQueue.process(async (job) => {
    return processPayment(job);
});

// 2. Process Webhook Jobs
webhookQueue.process(async (job) => {
    return deliverWebhook(job);
});

webhookQueue.on('failed', async (job, err) => {
    console.log(`[Queue] Webhook job ${job.id} failed. Attempt ${job.attemptsMade}.`);
});

// 3. Process Refund Jobs (UPDATED)
refundQueue.process(async (job) => {
    return processRefund(job);
});

console.log('✅ Worker Service is listening for jobs...');

// --- Heartbeat ---
setInterval(async () => {
    try {
        // Use paymentQueue's client to set heartbeat (Expires in 30s)
        await paymentQueue.client.set('worker_status', 'running', 'EX', 30);
    } catch (err) {
        console.error('Heartbeat Error:', err);
    }
}, 10000);
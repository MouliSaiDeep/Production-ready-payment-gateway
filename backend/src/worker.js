const { paymentQueue, webhookQueue, refundQueue } = require('./config/queue');
const processPayment = require('./jobs/processPayment');
const db = require('./config/db');

console.log('🚀 Worker Service Starting...');

// Connect to DB (Ensure DB is ready)
db.pool.connect()
    .then(() => console.log('✅ Worker connected to Database'))
    .catch(err => console.error('❌ Worker DB connection failed', err));

// 1. Process Payment Jobs
paymentQueue.process(async (job) => {
    return processPayment(job);
});

// 2. Process Webhook Jobs (Placeholder for next phase)
webhookQueue.process(async (job) => {
    console.log(`[Job] Webhook delivery placeholder for event: ${job.data.event}`);
});

// 3. Process Refund Jobs (Placeholder)
refundQueue.process(async (job) => {
    console.log(`[Job] Refund processing placeholder for ID: ${job.data.refundId}`);
});

console.log('✅ Worker Service is listening for jobs...');
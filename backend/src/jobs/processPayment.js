const db = require('../config/db');
const { webhookQueue } = require('../config/queue');

const processPayment = async (job) => {
    const { paymentId } = job.data;
    console.log(`[Job] Processing payment: ${paymentId}`);

    try {
        // 1. Fetch Payment
        const res = await db.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
        if (res.rows.length === 0) throw new Error('Payment not found');
        const payment = res.rows[0];

        // 2. Simulate Delay (5-10s) or use Test Delay
        let delay = Math.floor(Math.random() * 5000) + 5000;
        if (process.env.TEST_MODE === 'true' && process.env.TEST_PROCESSING_DELAY) {
            delay = parseInt(process.env.TEST_PROCESSING_DELAY, 10);
        }
        await new Promise(resolve => setTimeout(resolve, delay));

        // 3. Determine Outcome
        let isSuccess = false;

        if (process.env.TEST_MODE === 'true') {
            // Deterministic Test Mode
            isSuccess = process.env.TEST_PAYMENT_SUCCESS !== 'false';
        } else {
            // Random Simulation
            const rand = Math.random();
            if (payment.method === 'upi') {
                isSuccess = rand < 0.90; // 90% Success for UPI
            } else {
                isSuccess = rand < 0.95; // 95% Success for Card
            }
        }

        // 4. Update Database
        const status = isSuccess ? 'success' : 'failed';
        const errorCode = isSuccess ? null : 'PAYMENT_FAILED';
        const errorDesc = isSuccess ? null : 'Bank declined transaction';

        await db.query(
            `UPDATE payments SET 
                status = $1, 
                error_code = $2, 
                error_description = $3, 
                updated_at = NOW() 
            WHERE id = $4`,
            [status, errorCode, errorDesc, paymentId]
        );

        console.log(`[Job] Payment ${paymentId} ${status}`);

        // 5. Trigger Webhook Job
        // We add this to the webhook queue to be processed by a separate worker
        await webhookQueue.add({
            merchantId: payment.merchant_id,
            event: isSuccess ? 'payment.success' : 'payment.failed',
            payload: {
                payment: {
                    id: payment.id,
                    order_id: payment.order_id,
                    amount: payment.amount,
                    currency: payment.currency,
                    method: payment.method,
                    status: status,
                    vpa: payment.vpa,
                    created_at: payment.created_at
                }
            }
        }, {
            attempts: 5,
            backoff: {
                type: 'webhookBackoff'
            }
        });

    } catch (error) {
        console.error(`[Job] Error processing payment ${paymentId}:`, error);
        throw error;
    }
};

module.exports = processPayment;
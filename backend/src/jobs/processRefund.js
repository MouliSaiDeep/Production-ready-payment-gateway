const db = require('../config/db');
const { webhookQueue } = require('../config/queue');

const processRefund = async (job) => {
    const { refundId } = job.data;
    console.log(`[Job] Processing refund: ${refundId}`);

    try {
        // 1. Fetch Refund & Payment
        const res = await db.query('SELECT * FROM refunds WHERE id = $1', [refundId]);
        if (res.rows.length === 0) throw new Error('Refund not found');
        const refund = res.rows[0];

        const payRes = await db.query('SELECT * FROM payments WHERE id = $1', [refund.payment_id]);
        const payment = payRes.rows[0];

        // 2. Simulate Delay (3-5s) [cite: 223]
        const delay = Math.floor(Math.random() * 2000) + 3000;
        await new Promise(resolve => setTimeout(resolve, delay));

        // 3. Update Refund Status
        await db.query(
            `UPDATE refunds SET 
                status = 'processed', 
                processed_at = NOW() 
            WHERE id = $1`,
            [refundId]
        );

        console.log(`[Job] Refund ${refundId} processed successfully`);

        // 4. Trigger Webhook (refund.processed) [cite: 230]
        await webhookQueue.add({
            merchantId: refund.merchant_id,
            event: 'refund.processed',
            payload: {
                refund: {
                    id: refund.id,
                    payment_id: refund.payment_id,
                    amount: refund.amount,
                    status: 'processed',
                    created_at: refund.created_at
                }
            }
        });

    } catch (error) {
        console.error(`[Job] Error processing refund ${refundId}:`, error);
        throw error;
    }
};

module.exports = processRefund;
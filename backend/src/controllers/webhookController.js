const db = require('../config/db');
const { webhookQueue } = require('../config/queue');

// GET /api/v1/webhooks
const listWebhooks = async (req, res) => {
    const merchantId = req.merchant.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const logsQuery = `
            SELECT * FROM webhook_logs 
            WHERE merchant_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        `;
        const countQuery = `SELECT COUNT(*) FROM webhook_logs WHERE merchant_id = $1`;

        const logs = await db.query(logsQuery, [merchantId, limit, offset]);
        const count = await db.query(countQuery, [merchantId]);

        res.json({
            data: logs.rows,
            total: parseInt(count.rows[0].count),
            limit,
            offset
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

// POST /api/v1/webhooks/{id}/retry
const retryWebhook = async (req, res) => {
    const { id } = req.params;
    const merchantId = req.merchant.id;

    try {
        // 1. Check ownership & existence
        const logRes = await db.query(
            'SELECT * FROM webhook_logs WHERE id = $1 AND merchant_id = $2',
            [id, merchantId]
        );

        if (logRes.rows.length === 0) {
            return res.status(404).json({ error: 'Webhook log not found' });
        }
        const log = logRes.rows[0];

        // 2. Reset log status
        await db.query(
            `UPDATE webhook_logs SET status = 'pending', attempts = 0, next_retry_at = NULL WHERE id = $1`,
            [id]
        );

        // 3. Enqueue Job
        // We reuse the existing payload and event from the log
        await webhookQueue.add({
            merchantId,
            event: log.event,
            payload: log.payload
        }, {
            attempts: 5,
            backoff: { type: 'webhookBackoff' }
        });

        res.json({
            id: id,
            status: 'pending',
            message: 'Webhook retry scheduled'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal error' });
    }
};

module.exports = { listWebhooks, retryWebhook };
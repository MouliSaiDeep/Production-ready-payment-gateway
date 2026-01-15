const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/db');
const { webhookQueue } = require('../config/queue');

const deliverWebhook = async (job) => {
    const { merchantId, event, payload } = job.data;
    const attempt = job.attemptsMade + 1;

    console.log(`[Webhook] Processing ${event} for merchant ${merchantId} (Attempt ${attempt})`);

    try {
        // 1. Fetch Merchant Config
        const res = await db.query(
            'SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1',
            [merchantId]
        );

        if (res.rows.length === 0) return; // Merchant not found
        const { webhook_url, webhook_secret } = res.rows[0];

        // If no URL configured, just log and exit (Don't retry)
        if (!webhook_url) {
            console.log(`[Webhook] No URL configured for merchant ${merchantId}. Skipping.`);
            return;
        }

        // 2. Generate Signature
        // The payload must be stringified exactly as it is sent
        const payloadString = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', webhook_secret || '')
            .update(payloadString)
            .digest('hex');

        // 3. Send Request
        const startTime = Date.now();
        let responseCode = 0;
        let responseBody = '';
        let status = 'pending';

        try {
            const response = await axios.post(webhook_url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature
                },
                timeout: 5000 // 5s timeout [cite: 201]
            });

            responseCode = response.status;
            responseBody = JSON.stringify(response.data).substring(0, 1000); // Truncate logs
            status = 'success';
            console.log(`[Webhook] Delivered successfully to ${webhook_url} (Status: ${responseCode})`);

        } catch (error) {
            status = 'failed';
            responseCode = error.response ? error.response.status : 0;
            responseBody = error.message;
            console.error(`[Webhook] Delivery failed: ${error.message}`);
            // We throw error so Bull Queue handles the retry logic automatically
            throw error;
        } finally {
            // 4. Log Attempt to Database [cite: 202]
            // We calculate the next retry time manually for logging purposes
            let nextRetry = null;
            if (status === 'failed' && attempt < 5) {
                // Calculate backoff based on Deliverable 2 rules
                const delays = [0, 60, 300, 1800, 7200]; // Standard: 1m, 5m, 30m, 2h [cite: 232-236]

                // TEST MODE override [cite: 238-244]
                if (process.env.WEBHOOK_RETRY_INTERVALS_TEST === 'true') {
                    const testDelays = [0, 5, 10, 15, 20]; // Fast retries for testing
                    nextRetry = new Date(Date.now() + testDelays[attempt] * 1000);
                } else {
                    nextRetry = new Date(Date.now() + delays[attempt] * 1000);
                }
            }

            await db.query(
                `INSERT INTO webhook_logs (
                    merchant_id, event, payload, status, attempts, 
                    last_attempt_at, next_retry_at, response_code, response_body
                ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)`,
                [merchantId, event, payload, status, attempt, nextRetry, responseCode, responseBody]
            );
        }

    } catch (error) {
        // Bull Queue will catch this and schedule the retry based on our worker config
        throw error;
    }
};

module.exports = deliverWebhook;
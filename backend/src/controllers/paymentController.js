const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');
const validation = require('../services/validationService');
const { paymentQueue } = require('../config/queue'); // Import Queue
const db = require('../config/db'); // Import DB for Idempotency

const createPayment = async (req, res) => {
    const { order_id, method, vpa, card } = req.body;
    const merchantId = req.merchant ? req.merchant.id : null;
    const idempotencyKey = req.headers['idempotency-key']; // Read Header

    try {
        // --- 1. IDEMPOTENCY CHECK (New Requirement) ---
        if (idempotencyKey && merchantId) {
            const idemQuery = `SELECT * FROM idempotency_keys WHERE key = $1 AND merchant_id = $2`;
            const idemRes = await db.query(idemQuery, [idempotencyKey, merchantId]);

            if (idemRes.rows.length > 0) {
                const keyRecord = idemRes.rows[0];
                // Check expiry (24 hours)
                if (new Date() < new Date(keyRecord.expires_at)) {
                    console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
                    return res.status(201).json(keyRecord.response);
                } else {
                    // Delete expired key
                    await db.query('DELETE FROM idempotency_keys WHERE key = $1', [idempotencyKey]);
                }
            }
        }
        // ----------------------------------------------

        // 2. Validate Order
        const order = await orderService.getOrderById(order_id, merchantId);
        if (!order) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND_ERROR', description: 'Order not found or access denied' }
            });
        }

        // 3. Validate Inputs (Method, VPA, Card)
        let paymentData = { method };

        if (method === 'upi') {
            if (!vpa || !validation.validateVPA(vpa)) {
                return res.status(400).json({ error: { code: 'INVALID_VPA', description: 'Invalid VPA format' } });
            }
            paymentData.vpa = vpa;
        } else if (method === 'card') {
            if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv) {
                return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Missing card details' } });
            }
            // Strict CVV Check
            if (!/^[0-9]{3,4}$/.test(card.cvv)) {
                return res.status(400).json({ error: { code: 'INVALID_CARD', description: 'CVV must be 3 or 4 digits' } });
            }
            if (!validation.validateLuhn(card.number)) {
                return res.status(400).json({ error: { code: 'INVALID_CARD', description: 'Invalid card number' } });
            }
            if (!validation.validateExpiry(card.expiry_month, card.expiry_year)) {
                return res.status(400).json({ error: { code: 'EXPIRED_CARD', description: 'Card has expired' } });
            }
            paymentData.card_network = validation.detectCardNetwork(card.number);
            paymentData.card_last4 = card.number.replace(/[\s-]/g, '').slice(-4);
        } else {
            return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid payment method' } });
        }

        // 4. Create "Pending" Payment in DB
        const payment = await paymentService.createPayment(order, order.merchant_id, paymentData);

        // 5. Add to Redis Queue (Async Processing)
        // This hands off the heavy lifting to the Worker
        await paymentQueue.add({ paymentId: payment.id });
        console.log(`[API] Payment ${payment.id} enqueued`);

        // 6. Save Idempotency Key (If provided)
        if (idempotencyKey && merchantId) {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

            await db.query(
                `INSERT INTO idempotency_keys (key, merchant_id, response, expires_at) VALUES ($1, $2, $3, $4)`,
                [idempotencyKey, merchantId, payment, expiresAt]
            );
        }

        // 7. Return Response Immediately
        // Client receives "pending" status
        res.status(201).json(payment);

    } catch (error) {
        console.error('Payment Error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Payment processing failed' } });
    }
};

const getPayment = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentById(req.params.id);
        if (!payment) return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Internal error' } });
    }
};

const listPayments = async (req, res) => {
    try {
        const payments = await paymentService.getPaymentsByMerchant(req.merchant.id);
        res.json(payments);
    } catch (e) {
        res.status(500).json({ error: 'Internal error' });
    }
};

const getStats = async (req, res) => {
    try {
        const stats = await paymentService.getMerchantStats(req.merchant.id);
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: 'Internal error' });
    }
};

// --- NEW ENDPOINTS (For Deliverable 2) ---

const capturePayment = async (req, res) => {
    // Placeholder for capture logic
    res.status(200).json({ status: 'captured' });
};

const createRefund = async (req, res) => {
    // Placeholder for refund logic
    res.status(201).json({ status: 'refund_pending' });
};

module.exports = { createPayment, getPayment, listPayments, getStats, capturePayment, createRefund };
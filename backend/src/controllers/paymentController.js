const crypto = require('crypto');
const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');
const validation = require('../services/validationService');
const { paymentQueue, refundQueue, webhookQueue } = require('../config/queue');
const db = require('../config/db');

// --- 1. CREATE PAYMENT ---
const createPayment = async (req, res) => {
    const { order_id, method, vpa, card } = req.body;
    const merchantId = req.merchant ? req.merchant.id : null;
    const idempotencyKey = req.headers['idempotency-key'];

    try {
        // A. Idempotency Check
        if (idempotencyKey && merchantId) {
            const idemQuery = `SELECT * FROM idempotency_keys WHERE key = $1 AND merchant_id = $2`;
            const idemRes = await db.query(idemQuery, [idempotencyKey, merchantId]);
            if (idemRes.rows.length > 0) {
                const keyRecord = idemRes.rows[0];
                if (new Date() < new Date(keyRecord.expires_at)) {
                    return res.status(201).json(keyRecord.response);
                } else {
                    await db.query('DELETE FROM idempotency_keys WHERE key = $1', [idempotencyKey]);
                }
            }
        }

        // B. Validation
        const order = await orderService.getOrderById(order_id, merchantId);
        if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Order not found' } });

        let paymentData = { method };
        if (method === 'upi') {
            if (!vpa || !validation.validateVPA(vpa)) return res.status(400).json({ error: { code: 'INVALID_VPA', description: 'Invalid VPA' } });
            paymentData.vpa = vpa;
        } else if (method === 'card') {
            if (!card || !card.number || !card.cvv) return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Missing card details' } });
            if (!/^[0-9]{3,4}$/.test(card.cvv)) return res.status(400).json({ error: { code: 'INVALID_CARD', description: 'CVV must be 3-4 digits' } });
            if (!validation.validateLuhn(card.number)) return res.status(400).json({ error: { code: 'INVALID_CARD', description: 'Invalid card number' } });
            if (!validation.validateExpiry(card.expiry_month, card.expiry_year)) return res.status(400).json({ error: { code: 'EXPIRED_CARD', description: 'Card expired' } });

            paymentData.card_network = validation.detectCardNetwork(card.number);
            paymentData.card_last4 = card.number.replace(/[\s-]/g, '').slice(-4);
        } else {
            return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid method' } });
        }

        // C. Create Payment Record
        const payment = await paymentService.createPayment(order, order.merchant_id, paymentData);

        // --- Trigger Webhooks ---
        const webhookPayload = { payment };
        await webhookQueue.add({ merchantId, event: 'payment.created', payload: webhookPayload }, { attempts: 5, backoff: { type: 'webhookBackoff' } });
        await webhookQueue.add({ merchantId, event: 'payment.pending', payload: webhookPayload }, { attempts: 5, backoff: { type: 'webhookBackoff' } });

        // D. Enqueue Job
        await paymentQueue.add({ paymentId: payment.id });

        // E. Save Idempotency
        if (idempotencyKey && merchantId) {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            await db.query(
                `INSERT INTO idempotency_keys (key, merchant_id, response, expires_at) VALUES ($1, $2, $3, $4)`,
                [idempotencyKey, merchantId, payment, expiresAt]
            );
        }

        res.status(201).json(payment);

    } catch (error) {
        console.error('Payment Error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Processing failed' } });
    }
};

// --- 2. CREATE REFUND ---
const createRefund = async (req, res) => {
    const { payment_id } = req.params;
    const { amount, reason } = req.body;
    const merchantId = req.merchant.id;

    try {
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid or missing amount' }
            });
        }

        const payRes = await db.query('SELECT * FROM payments WHERE id = $1 AND merchant_id = $2', [payment_id, merchantId]);
        if (payRes.rows.length === 0) return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        const payment = payRes.rows[0];

        if (payment.status !== 'success') {
            return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment not in refundable state' } });
        }

        const refRes = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM refunds WHERE payment_id = $1", [payment_id]);
        const totalRefunded = parseInt(refRes.rows[0].total);

        if (amount > (payment.amount - totalRefunded)) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Refund amount exceeds available amount' } });
        }

        // --- FIX: Use Crypto for exactly 16 hex chars ---
        const random = crypto.randomBytes(8).toString('hex');
        const refundId = `rfnd_${random}`;
        // ------------------------------------------------

        await db.query(
            `INSERT INTO refunds (id, payment_id, merchant_id, amount, reason, status, created_at)
             VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
            [refundId, payment_id, merchantId, amount, reason]
        );

        await webhookQueue.add({
            merchantId,
            event: 'refund.created',
            payload: { refund: { id: refundId, payment_id, amount, reason, status: 'pending' } }
        }, {
            attempts: 5,
            backoff: { type: 'webhookBackoff' }
        });

        await refundQueue.add({ refundId });

        res.status(201).json({
            id: refundId,
            payment_id,
            amount,
            reason,
            status: 'pending',
            created_at: new Date()
        });

    } catch (error) {
        console.error('Refund Error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Refund failed' } });
    }
};

// --- 3. GET REFUND ---
const getRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM refunds WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Refund not found' } });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Internal error' } });
    }
};

// --- Standard Getters & Capture ---
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

const capturePayment = async (req, res) => {
    const { payment_id } = req.params;
    const merchantId = req.merchant.id;

    try {
        const result = await db.query('SELECT * FROM payments WHERE id = $1 AND merchant_id = $2', [payment_id, merchantId]);
        if (result.rows.length === 0) return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });

        const payment = result.rows[0];
        if (payment.status !== 'success') return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment must be successful to capture' } });
        if (payment.captured) return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment already captured' } });

        await db.query('UPDATE payments SET captured = true, updated_at = NOW() WHERE id = $1', [payment_id]);

        const updated = await db.query('SELECT * FROM payments WHERE id = $1', [payment_id]);
        res.status(200).json(updated.rows[0]);

    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Capture failed' } });
    }
};

const getPublicPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch only necessary public fields
        const result = await db.query('SELECT id, status, amount, currency, method, created_at FROM payments WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Internal error' } });
    }
};

module.exports = { createPayment, getPayment, listPayments, getStats, capturePayment, createRefund, getRefund, getPublicPaymentStatus };
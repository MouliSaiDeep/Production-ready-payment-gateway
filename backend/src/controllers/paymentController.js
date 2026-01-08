const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const validation = require('../services/validationService');

const createPayment = async (req, res) => {
    const { order_id, method, vpa, card } = req.body;
    const merchantId = req.merchant ? req.merchant.id : null; // Handle public/private access

    // 1. Validate Order
    try {
        // If authenticated (merchantId exists), ensure order belongs to merchant
        // If public (checkout page), just ensure order exists
        const order = await orderService.getOrderById(order_id, merchantId);

        if (!order) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND_ERROR', description: 'Order not found or access denied' }
            });
        }

        // 2. Validate Method Specifics
        let paymentData = { method };

        if (method === 'upi') {
            // UPI Validation
            if (!vpa || !validation.validateVPA(vpa)) {
                return res.status(400).json({
                    error: { code: 'INVALID_VPA', description: 'Invalid VPA format' }
                });
            }
            paymentData.vpa = vpa;

        } else if (method === 'card') {
            // Card Validation
            if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv || !card.holder_name) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST_ERROR', description: 'Missing card details' }
                });
            }

            // Luhn Check
            if (!validation.validateLuhn(card.number)) {
                return res.status(400).json({
                    error: { code: 'INVALID_CARD', description: 'Invalid card number' }
                });
            }

            // Expiry Check
            if (!validation.validateExpiry(card.expiry_month, card.expiry_year)) {
                return res.status(400).json({
                    error: { code: 'EXPIRED_CARD', description: 'Card has expired' }
                });
            }

            // Network Detection & Last4
            paymentData.card_network = validation.detectCardNetwork(card.number);
            paymentData.card_last4 = card.number.replace(/[\s-]/g, '').slice(-4);

        } else {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid payment method' }
            });
        }

        // 3. Process Payment
        const payment = await paymentService.createPayment(order, order.merchant_id, paymentData);
        res.status(201).json(payment);

    } catch (error) {
        console.error('Payment Error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Payment processing failed' } });
    }
};

const getPayment = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Internal error' } });
    }
};

module.exports = { createPayment, getPayment };
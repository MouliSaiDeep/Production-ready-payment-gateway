const orderService = require('../services/orderService');

const createOrder = async (req, res) => {
    const { amount } = req.body;

    if (!Number.isInteger(amount) || amount < 100) {
        return res.status(400).json({
            error: { code: 'BAD_REQUEST_ERROR', description: 'amount must be at least 100' }
        });
    }

    try {
        const order = await orderService.createOrder(req.merchant.id, req.body);
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Internal error' } });
    }
};

const getOrder = async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id, req.merchant.id);
        if (!order) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Order not found' } });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Internal error' } });
    }
};

module.exports = { createOrder, getOrder };
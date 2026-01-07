const db = require('../config/db');
const { generateId } = require('../utils/helpers');

const createOrder = async (req, res) => {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    const merchantId = req.merchant.id;

    // Validation: Amount must be >= 100 
    if (!Number.isInteger(amount) || amount < 100) {
        return res.status(400).json({
            error: {
                code: 'BAD_REQUEST_ERROR',
                description: 'amount must be at least 100'
            }
        });
    }

    try {
        // Generate Unique ID 
        let orderId;
        let isUnique = false;

        // Simple collision check loop
        while (!isUnique) {
            orderId = generateId('order_');
            const check = await db.query('SELECT 1 FROM orders WHERE id = $1', [orderId]);
            if (check.rowCount === 0) isUnique = true;
        }

        const query = `
            INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'created', NOW(), NOW())
            RETURNING *;
        `;

        const values = [orderId, merchantId, amount, currency, receipt, notes];
        const result = await db.query(query, values);
        const order = result.rows[0];

        // Return 201 with order details 
        res.status(201).json({
            id: order.id,
            merchant_id: order.merchant_id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes,
            status: order.status,
            created_at: order.created_at,
            updated_at: order.updated_at
        });

    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Could not create order' } });
    }
};

const getOrder = async (req, res) => {
    const { id } = req.params;

    // Auth middleware already validated credentials, but we must ensure the order belongs to this specific merchant (security best practice)
    const merchantId = req.merchant.id;

    try {
        const result = await db.query(
            'SELECT * FROM orders WHERE id = $1 AND merchant_id = $2',
            [id, merchantId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Order not found'
                }
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Get Order Error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', description: 'Could not fetch order' } });
    }
};

module.exports = { createOrder, getOrder };
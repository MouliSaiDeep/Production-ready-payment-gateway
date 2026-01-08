const db = require('../config/db');
// Ensure this path is correct relative to this file
const { generateId } = require('../utils/helpers');

const createOrder = async (merchantId, data) => {
    // Unique ID Generation
    let orderId;
    let isUnique = false;

    // Safety break to prevent infinite loops if DB is down
    let attempts = 0;
    while (!isUnique && attempts < 5) {
        orderId = generateId('order_');
        const check = await db.query('SELECT 1 FROM orders WHERE id = $1', [orderId]);
        if (check.rowCount === 0) isUnique = true;
        attempts++;
    }

    if (!isUnique) throw new Error("Failed to generate unique Order ID");

    const query = `
        INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'created', NOW(), NOW())
        RETURNING *;
    `;

    // Ensure data.currency defaults to INR if null/undefined
    const values = [
        orderId,
        merchantId,
        data.amount,
        data.currency || 'INR',
        data.receipt || null,
        data.notes || {} // Ensure notes is an object, not undefined
    ];

    const result = await db.query(query, values);
    return result.rows[0];
};

const getOrderById = async (orderId, merchantId) => {
    let query = 'SELECT * FROM orders WHERE id = $1';
    let values = [orderId];

    if (merchantId) {
        query += ' AND merchant_id = $2';
        values.push(merchantId);
    }

    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = { createOrder, getOrderById };
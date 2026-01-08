const db = require('../config/db');
const { generateId } = require('../utils/helpers');

const createOrder = async (merchantId, data) => {
    // Unique ID Generation
    let orderId;
    let isUnique = false;
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
    
    const values = [orderId, merchantId, data.amount, data.currency || 'INR', data.receipt, data.notes];
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
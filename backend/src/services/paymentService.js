const db = require('../config/db');
const { generateId } = require('../utils/helpers'); // Using your existing helper

// 1. CREATE PAYMENT (Now lighter - just saves to DB)
const createPayment = async (order, merchantId, paymentData) => {
    // Generate ID
    let paymentId;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
        paymentId = generateId('pay_');
        const check = await db.query('SELECT 1 FROM payments WHERE id = $1', [paymentId]);
        if (check.rowCount === 0) isUnique = true;
        attempts++;
    }

    if (!isUnique) throw new Error("Failed to generate Payment ID");

    // Insert Record (Status: PENDING)
    // We REMOVED the synchronous processing logic here.
    // The Queue Worker will handle the processing in the background.
    const insertQuery = `
        INSERT INTO payments (
            id, order_id, merchant_id, amount, currency, method, status, 
            vpa, card_network, card_last4, captured, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, false, NOW(), NOW())
        RETURNING *;
    `;

    const values = [
        paymentId,
        order.id,
        merchantId,
        order.amount,
        order.currency,
        paymentData.method,
        paymentData.vpa || null,
        paymentData.card_network || null,
        paymentData.card_last4 || null
    ];

    const result = await db.query(insertQuery, values);
    return result.rows[0];
};

// 2. GET PAYMENT BY ID (Unchanged)
const getPaymentById = async (id) => {
    const result = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
};

// 3. GET PAYMENTS BY MERCHANT (Unchanged)
const getPaymentsByMerchant = async (merchantId) => {
    const result = await db.query(
        'SELECT * FROM payments WHERE merchant_id = $1 ORDER BY created_at DESC',
        [merchantId]
    );
    return result.rows;
};

// 4. GET MERCHANT STATS (Unchanged)
const getMerchantStats = async (merchantId) => {
    const query = `
        SELECT 
            COUNT(*) as total_transactions,
            COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_amount,
            COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count
        FROM payments 
        WHERE merchant_id = $1
    `;
    const result = await db.query(query, [merchantId]);
    const data = result.rows[0];

    const total = parseInt(data.total_transactions);
    const success = parseInt(data.success_count);
    const rate = total === 0 ? 0 : Math.round((success / total) * 100);

    return {
        total_transactions: total,
        total_amount: parseInt(data.total_amount),
        success_rate: rate
    };
};

module.exports = {
    createPayment,
    getPaymentById,
    getPaymentsByMerchant,
    getMerchantStats
};
const db = require('../config/db');
const { generateId } = require('../utils/helpers');

// Helper for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createPayment = async (order, merchantId, paymentData) => {
    // 1. Generate ID
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

    // 2. Insert Initial Record (Status: PROCESSING)
    const insertQuery = `
        INSERT INTO payments (
            id, order_id, merchant_id, amount, currency, method, status, 
            vpa, card_network, card_last4, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, $8, $9, NOW(), NOW())
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
    const payment = result.rows[0];

    // 3. Process Payment (Synchronous Simulation)
    await processPaymentSimulation(payment);

    // 4. Return updated payment
    const finalResult = await db.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    return finalResult.rows[0];
};

const processPaymentSimulation = async (payment) => {
    // Load Config
    const isTestMode = process.env.TEST_MODE === 'true';
    const upiSuccessRate = parseFloat(process.env.UPI_SUCCESS_RATE || 0.90);
    const cardSuccessRate = parseFloat(process.env.CARD_SUCCESS_RATE || 0.95);

    // 1. Determine Delay
    let delayMs;
    if (isTestMode) {
        delayMs = parseInt(process.env.TEST_PROCESSING_DELAY || 1000);
    } else {
        const min = parseInt(process.env.PROCESSING_DELAY_MIN || 5000);
        const max = parseInt(process.env.PROCESSING_DELAY_MAX || 10000);
        delayMs = Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Wait
    await sleep(delayMs);

    // 2. Determine Outcome
    let isSuccess;
    if (isTestMode) {
        const testSuccessEnv = process.env.TEST_PAYMENT_SUCCESS;
        if (testSuccessEnv === undefined) {
            isSuccess = true;
        } else {
            isSuccess = testSuccessEnv === 'true';
        }
    } else {
        const threshold = payment.method === 'upi' ? upiSuccessRate : cardSuccessRate;
        isSuccess = Math.random() < threshold;
    }

    // 3. Update Status
    const status = isSuccess ? 'success' : 'failed';
    const error_code = isSuccess ? null : 'PAYMENT_FAILED';
    const error_desc = isSuccess ? null : 'Bank rejected transaction';

    await db.query(
        'UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = NOW() WHERE id = $4',
        [status, error_code, error_desc, payment.id]
    );
};

const getPaymentById = async (id) => {
    const result = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
};
const getPaymentsByMerchant = async (merchantId) => {
    const result = await db.query(
        'SELECT * FROM payments WHERE merchant_id = $1 ORDER BY created_at DESC',
        [merchantId]
    );
    return result.rows;
};

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

module.exports = { createPayment, getPaymentById, getPaymentsByMerchant, getMerchantStats };
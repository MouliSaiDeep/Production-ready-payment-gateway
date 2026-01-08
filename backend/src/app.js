const express = require('express');
const cors = require('cors');
const { getHealth } = require('./controllers/healthController');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/health', getHealth);

// 2. API Routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 3. Test Endpoint (Required)
app.get('/api/v1/test/merchant', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM merchants WHERE email = 'test@example.com'");
        if (result.rowCount === 0) return res.status(404).json({ error: 'Test merchant not found' });
        const m = result.rows[0];
        res.json({ id: m.id, email: m.email, api_key: m.api_key, seeded: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. Public Routes for Checkout (Handling the unauthenticated checkout requirement) 
// We explicitly add a public route for fetching order details and creating payments without headers
const { getOrderById } = require('./services/orderService');
const { createPayment: createPublicPayment } = require('./controllers/paymentController');

app.get('/api/v1/orders/:id/public', async (req, res) => {
    try {
        const order = await getOrderById(req.params.id); // No merchant ID filter
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (e) {
        res.status(500).json({ error: 'Internal error' });
    }
});
app.post('/api/v1/payments/public', createPublicPayment);

module.exports = app;
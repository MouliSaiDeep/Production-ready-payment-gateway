const express = require('express');
const cors = require('cors');
const { getHealth } = require('./controllers/healthController');
const { createOrder, getOrder } = require('./controllers/orderController');
const authenticateMerchant = require('./middleware/auth');
// Note: Payment controller will be added in Phase 4

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health Check (Public)
app.get('/health', getHealth);

// 2. Order Routes (Protected)
app.post('/api/v1/orders', authenticateMerchant, createOrder);
app.get('/api/v1/orders/:id', authenticateMerchant, getOrder);

// 3. Test Endpoint (Required for Evaluation)
// We will implement the controller for this inline or separate, but for structure, let's add a quick route here to satisfy the requirement
const db = require('./config/db');
app.get('/api/v1/test/merchant', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM merchants WHERE email = 'test@example.com'");
        if (result.rowCount === 0) return res.status(404).json({ error: 'Test merchant not found' });
        
        const m = result.rows[0];
        res.json({
            id: m.id,
            email: m.email,
            api_key: m.api_key,
            seeded: true
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = app;
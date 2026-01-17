const express = require('express');
const cors = require('cors');
const { getHealth } = require('./controllers/healthController');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const db = require('./config/db');
const webhookController = require('./controllers/webhookController');
const jobController = require('./controllers/jobController');
const paymentController = require('./controllers/paymentController');

const authenticateMerchant = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/health', getHealth);

// 2. API Routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Spec requires: GET /api/v1/refunds/{id}
app.get('/api/v1/refunds/:id', authenticateMerchant, paymentController.getRefund);
// ---------------------------------------------

// 3. Test Endpoint
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

// 4. Public Routes for Checkout
const { getOrderById } = require('./services/orderService');
const { createPayment: createPublicPayment } = require('./controllers/paymentController');

app.get('/api/v1/orders/:id/public', async (req, res) => {
    try {
        const order = await getOrderById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (e) {
        res.status(500).json({ error: 'Internal error' });
    }
});

app.post('/api/v1/payments/public', createPublicPayment);

// 5. Webhook Routes
const webhookRouter = express.Router();
webhookRouter.get('/', authenticateMerchant, webhookController.listWebhooks);
webhookRouter.post('/:id/retry', authenticateMerchant, webhookController.retryWebhook);
app.use('/api/v1/webhooks', webhookRouter);

// --- Merchant Routes ---
const merchantController = require('./controllers/merchantController');
const merchantRouter = express.Router();
merchantRouter.put('/', authenticateMerchant, merchantController.updateWebhookConfig);
merchantRouter.get('/', authenticateMerchant, merchantController.getMerchantDetails);
merchantRouter.post('/secret/regenerate', authenticateMerchant, merchantController.regenerateSecret);
app.use('/api/v1/merchant', merchantRouter);
// -----------------------

// 6. Test/Job Routes
const testRouter = express.Router();
testRouter.get('/jobs/status', jobController.getJobStatus);
app.use('/api/v1/test', testRouter);

module.exports = app;
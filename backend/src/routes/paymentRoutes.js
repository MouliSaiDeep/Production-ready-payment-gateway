const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Import your authentication middleware
const authenticateMerchant = require('../middleware/auth');

// 1. Create Payment (Authenticated)
router.post('/', authenticateMerchant, paymentController.createPayment);

// 2. Create Payment (Public/Checkout)
router.post('/public', paymentController.createPayment);

// 3. Stats & List (Must come BEFORE /:id)
router.get('/stats', authenticateMerchant, paymentController.getStats);
router.get('/', authenticateMerchant, paymentController.listPayments);

// 4. Get Single Payment
router.get('/:id/public', paymentController.getPublicPaymentStatus); // Public polling
router.get('/:id', authenticateMerchant, paymentController.getPayment);

// 5. Capture & Refund Actions
router.post('/:payment_id/capture', authenticateMerchant, paymentController.capturePayment);
router.post('/:payment_id/refunds', authenticateMerchant, paymentController.createRefund);

module.exports = router;
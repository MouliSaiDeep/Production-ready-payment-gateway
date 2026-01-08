const express = require('express');
const router = express.Router();
const { createPayment, getPayment } = require('../controllers/paymentController');
const authenticateMerchant = require('../middleware/auth');

// Secure Endpoints
router.post('/', authenticateMerchant, createPayment);
router.get('/:id', authenticateMerchant, getPayment);

module.exports = router;
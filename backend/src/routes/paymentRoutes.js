const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateMerchant = require('../middleware/auth');

router.post('/', authenticateMerchant, paymentController.createPayment);
router.post('/public', paymentController.createPayment);
router.get('/stats', authenticateMerchant, paymentController.getStats); // New Stats Route
router.get('/', authenticateMerchant, paymentController.listPayments);  // New List Route
router.get('/:id', paymentController.getPayment);

module.exports = router;
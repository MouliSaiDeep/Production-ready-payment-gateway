const express = require('express');
const router = express.Router();
const { createOrder, getOrder } = require('../controllers/orderController');
const authenticateMerchant = require('../middleware/auth');

// All order routes are protected by merchant auth
router.post('/', authenticateMerchant, createOrder);
router.get('/:id', authenticateMerchant, getOrder);
// Public endpoint for checkout page
router.get('/:id/public', async (req, res, next) => {
    next();
});

module.exports = router;
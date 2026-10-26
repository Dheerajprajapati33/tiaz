const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/auth.middleware');

// Public config to get Razorpay Key ID
router.get('/config', paymentController.getConfig);

// Protected endpoints for generating order and verifying payment
router.use(authenticate);
router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

module.exports = router;

const express = require('express');
const router = express.Router();
const silverController = require('../controllers/silver.controller');
const authenticate = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const validate = require('../middleware/validation.middleware');
const {
  buySilverValidator,
  sellSilverValidator,
  updateRateValidator
} = require('../validators/silver.validator');

// Live rates (Public)
router.get('/rates', silverController.getRates);

// Admin rate update
router.post('/rates', authenticate, requireAdmin, updateRateValidator, validate, silverController.updateRate);

// Authenticated User Endpoints
router.use(authenticate);
router.get('/sell-screen', silverController.getSellScreen);
router.post('/create-order', silverController.createPaymentOrder);
router.post('/buy', buySilverValidator, validate, silverController.buySilver);
router.post('/sell', sellSilverValidator, validate, silverController.sellSilver);
router.get('/orders', silverController.getOrders);

module.exports = router;

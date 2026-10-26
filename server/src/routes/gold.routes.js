const express = require('express');
const router = express.Router();
const goldController = require('../controllers/gold.controller');
const authenticate = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const validate = require('../middleware/validation.middleware');
const {
  buyGoldValidator,
  sellGoldValidator,
  updateRateValidator
} = require('../validators/gold.validator');

// Live rates (Public)
router.get('/rates', goldController.getRates);

// Admin rate update
router.post('/rates', authenticate, requireAdmin, updateRateValidator, validate, goldController.updateRate);

// Authenticated User Endpoints
router.use(authenticate);
router.get('/sell-screen', goldController.getSellScreen);
router.post('/create-order', goldController.createPaymentOrder);
router.post('/buy', buyGoldValidator, validate, goldController.buyGold);
router.post('/sell', sellGoldValidator, validate, goldController.sellGold);
router.get('/orders', goldController.getOrders);

module.exports = router;

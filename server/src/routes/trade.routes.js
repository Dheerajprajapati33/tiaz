const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/trade.controller');
const authenticate = require('../middleware/auth.middleware');

// Protect trade endpoints with the existing centralized auth middleware
router.use(authenticate);

/**
 * 1. UNIFIED BUY RATE & CALCULATION API
 * Accepts both GET and POST:
 * GET  /api/v1/trade/buy?metalType=gold&amount=1000
 * POST /api/v1/trade/buy  { "metalType": "gold", "amount": 1000 }
 */
router.get('/buy', tradeController.getBuyRateOrQuote);
router.post('/buy', tradeController.getBuyRateOrQuote);

/**
 * 2. UNIFIED SELL RATE & CALCULATION API
 * Accepts both GET and POST:
 * GET  /api/v1/trade/sell?metalType=gold&grams=0.5
 * POST /api/v1/trade/sell { "metalType": "gold", "grams": 0.5 }
 */
router.get('/sell', tradeController.getSellRateOrQuote);
router.post('/sell', tradeController.getSellRateOrQuote);

module.exports = router;

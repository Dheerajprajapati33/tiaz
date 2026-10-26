const tradeService = require('../services/trade.service');
const { successResponse, errorResponse } = require('../utils/response');

class TradeController {
  /**
   * 1. Unified Buy Rate & Calculation Quote API
   * Handles GET (?metalType=gold&amount=1000) and POST ({ metalType: "gold", amount: 1000 })
   */
  async getBuyRateOrQuote(req, res) {
    try {
      const params = {
        ...req.query,
        ...req.body
      };
      const userId = req.user?._id || null;
      const data = await tradeService.getBuyRateOrQuote(userId, params);
      return successResponse(res, 'Buy rate & calculation data retrieved', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * 2. Unified Sell Rate & Calculation Quote API
   * Handles GET (?metalType=gold&grams=0.5) and POST ({ metalType: "gold", grams: 0.5 })
   */
  async getSellRateOrQuote(req, res) {
    try {
      const params = {
        ...req.query,
        ...req.body
      };
      const userId = req.user?._id || null;
      const data = await tradeService.getSellRateOrQuote(userId, params);
      return successResponse(res, 'Sell rate & calculation data retrieved', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new TradeController();

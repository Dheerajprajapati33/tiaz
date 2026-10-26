const goldService = require('../services/gold.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

class GoldController {
  async getRates(req, res) {
    try {
      const rates = await goldService.getLiveRates();
      return successResponse(res, 'Live gold rates', rates);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getSellScreen(req, res) {
    try {
      const data = await goldService.getSellScreenData(req.user._id);
      return successResponse(res, 'Sell gold screen data retrieved successfully', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async updateRate(req, res) {
    try {
      const rate = await goldService.updateGoldRate(req.body);
      return successResponse(res, 'Gold rate updated successfully', rate, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async createPaymentOrder(req, res) {
    try {
      const result = await goldService.createRazorpayOrder(req.user._id, req.body);
      return successResponse(res, 'Razorpay order created for gold purchase', result, 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  async buyGold(req, res) {
    try {
      const result = await goldService.buyGold(req.user._id, req.body);
      return successResponse(res, 'Gold purchased successfully', result, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async sellGold(req, res) {
    try {
      const result = await goldService.sellGold(req.user._id, req.body);
      return successResponse(res, 'Gold sold successfully', result, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getOrders(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const type = req.query.type;
      const { orders, total } = await goldService.getOrders(req.user._id, { page, limit, type });
      return paginatedResponse(res, 'Orders list', orders, { page, limit, total });
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new GoldController();

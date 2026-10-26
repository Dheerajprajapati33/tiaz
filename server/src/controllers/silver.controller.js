const silverService = require('../services/silver.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

class SilverController {
  async getRates(req, res) {
    try {
      const rates = await silverService.getLiveRates();
      return successResponse(res, 'Live silver rates', rates);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getSellScreen(req, res) {
    try {
      const data = await silverService.getSellScreenData(req.user._id);
      return successResponse(res, 'Sell silver screen data retrieved successfully', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async updateRate(req, res) {
    try {
      const rate = await silverService.updateSilverRate(req.body);
      return successResponse(res, 'Silver rate updated successfully', rate, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async createPaymentOrder(req, res) {
    try {
      const result = await silverService.createRazorpayOrder(req.user._id, req.body);
      return successResponse(res, 'Razorpay order created for silver purchase', result, 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  async buySilver(req, res) {
    try {
      const result = await silverService.buySilver(req.user._id, req.body);
      return successResponse(res, 'Silver purchased successfully', result, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async sellSilver(req, res) {
    try {
      const result = await silverService.sellSilver(req.user._id, req.body);
      return successResponse(res, 'Silver sold successfully', result, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getOrders(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const type = req.query.type;
      const { orders, total } = await silverService.getOrders(req.user._id, { page, limit, type });
      return paginatedResponse(res, 'Silver orders list', orders, { page, limit, total });
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new SilverController();

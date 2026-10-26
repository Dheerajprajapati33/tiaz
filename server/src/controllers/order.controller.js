const orderService = require('../services/order.service');
const { successResponse, errorResponse } = require('../utils/response');

class OrderController {
  /**
   * GET /api/v1/orders/my-orders or /api/v1/orders
   * Retrieve all bullion orders for the authenticated user
   */
  async getMyOrders(req, res) {
    try {
      const {
        status = 'ALL',
        metalType = 'ALL',
        buyType = 'ALL',
        search = '',
        page = 1,
        limit = 10
      } = req.query;

      const result = await orderService.getUserOrders(req.user._id, {
        status,
        metalType,
        buyType,
        search,
        page,
        limit
      });

      return successResponse(res, 'User orders retrieved successfully', result);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/orders/:orderId
   * Retrieve full details of a specific order (by MongoDB _id or orderNumber)
   */
  async getOrderDetails(req, res) {
    try {
      const order = await orderService.getUserOrderDetails(req.user._id, req.params.orderId);
      return successResponse(res, 'Order details retrieved successfully', order);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 404);
    }
  }


  /**
   * POST /api/v1/orders/create-payment
   * Generate Razorpay Order for purchasing a physical product
   */
  async createPaymentOrder(req, res) {
    try {
      const productId = req.body.productId || req.body.id || req.params.id;
      const quantity = req.body.quantity || 1;
      const result = await orderService.createRazorpayOrder(req.user._id, { productId, quantity });
      return successResponse(res, 'Razorpay order created for product purchase', result, 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  /**
   * POST /api/v1/orders/buy
   * Dedicated Physical Product Purchase API matching mobile UI
   * Supports paymentMode: 'COD' | 'WALLET' | 'ONLINE'
   */
  async buyPhysicalProduct(req, res) {
    try {
      const productId = req.body.productId || req.body.id || req.params.id || req.params.productId;
      const payload = { ...req.body, productId };
      const result = await orderService.buyPhysicalProduct(req.user._id, payload);
      return successResponse(res, result.message, result.data, 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  /**
   * Backward-compatibility alias
   */
  async createPhysicalOrder(req, res) {
    return this.buyPhysicalProduct(req, res);
  }
}

module.exports = new OrderController();

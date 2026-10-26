const razorpayService = require('../services/razorpay.service');
const { successResponse, errorResponse } = require('../utils/response');

class PaymentController {
  /**
   * GET /api/v1/payment/config
   * Returns Razorpay public key ID so mobile/web app can open checkout modal
   */
  async getConfig(req, res) {
    try {
      const keyId = razorpayService.getKeyId();
      return successResponse(res, 'Payment gateway configuration', {
        keyId,
        currency: 'INR',
        name: "Tia'z Digital Gold & Silver",
        theme: {
          color: '#EAB308' // Gold theme
        }
      });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * POST /api/v1/payment/create-order
   * Generate Razorpay Order for any transaction (Physical Product, Wallet, Digital Gold/Silver)
   */
  async createOrder(req, res) {
    try {
      const { amount, purpose = 'GENERAL', notes = {} } = req.body;
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        return errorResponse(res, 'Valid amount (in ₹) is required', 400);
      }

      const order = await razorpayService.createOrder({
        amount: numAmount,
        currency: 'INR',
        notes: {
          userId: req.user?._id?.toString() || 'guest',
          purpose,
          ...notes
        }
      });

      return successResponse(res, 'Razorpay order created successfully', order, 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  /**
   * POST /api/v1/payment/verify
   * Verify Razorpay Payment Signature
   */
  async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      razorpayService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      return successResponse(res, 'Payment verified successfully', {
        verified: true,
        razorpay_order_id,
        razorpay_payment_id
      });
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }
}

module.exports = new PaymentController();

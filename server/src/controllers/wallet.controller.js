const walletService = require("../services/wallet.service");
const withdrawalService = require("../services/withdrawal.service");
const { successResponse, errorResponse } = require("../utils/response");

class WalletController {
  async getWallet(req, res) {
    try {
      const wallet = await walletService.getWallet(req.user._id);
      return successResponse(res, "Wallet details", wallet);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async createOrder(req, res) {
    try {
      const { amount } = req.body;
      const order = await walletService.createAddCashOrder(
        req.user._id,
        amount,
      );
      return successResponse(
        res,
        "Razorpay order created for wallet topup",
        order,
        201,
      );
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  async addCash(req, res) {
    try {
      const result = await walletService.addCashBalance(req.user._id, req.body);
      return successResponse(
        res,
        result.message || "Balance added successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  async requestWithdrawal(req, res) {
    try {
      const result = await withdrawalService.requestWithdrawal(
        req.user._id,
        req.body,
      );
      return successResponse(res, result.message, result.withdrawal, 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  async getMyWithdrawals(req, res) {
    try {
      const { status = "ALL", page = 1, limit = 50 } = req.query;
      const result = await withdrawalService.getUserWithdrawals(req.user._id, {
        status,
        page,
        limit,
      });
      return successResponse(res, "Withdrawal history retrieved", result);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }
}

module.exports = new WalletController();

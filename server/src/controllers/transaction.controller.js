const transactionService = require("../services/transaction.service");
const { successResponse, errorResponse } = require("../utils/response");

class TransactionController {
  async getTransactions(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        type: req.query.type || "ALL",
        buyType: req.query.buyType || "ALL",
        metalType: req.query.metalType || "ALL",
        search: req.query.search || "",
        period: req.query.period || req.query.filter || "all_time",
        sortBy: req.query.sortBy || req.query.sort || "latest",
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
      };

      const result = await transactionService.getUserTransactions(
        req.user._id,
        filters,
      );
      return successResponse(
        res,
        "Transactions retrieved successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getTransactionDetails(req, res) {
    try {
      const txn = await transactionService.getTransactionById(
        req.user._id,
        req.params.transactionId,
      );
      return successResponse(res, "Transaction details retrieved", txn);
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }
}

module.exports = new TransactionController();

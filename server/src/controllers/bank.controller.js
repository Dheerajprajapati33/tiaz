const bankService = require('../services/bank.service');
const { successResponse, errorResponse } = require('../utils/response');

class BankController {
  async addAccount(req, res) {
    try {
      const account = await bankService.addAccount(req.user._id, req.body);
      return successResponse(res, 'Bank account added successfully', account, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async addUpi(req, res) {
    try {
      const account = await bankService.addUpiAccount(req.user._id, req.body);
      return successResponse(res, 'UPI ID linked successfully', account, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getAccounts(req, res) {
    try {
      const accounts = await bankService.getAccounts(req.user._id);
      return successResponse(res, 'Bank accounts retrieved', accounts);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async setPrimary(req, res) {
    try {
      const account = await bankService.setPrimary(req.user._id, req.params.accountId);
      return successResponse(res, 'Primary bank account updated', account);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async removeAccount(req, res) {
    try {
      await bankService.removeAccount(req.user._id, req.params.accountId);
      return successResponse(res, 'Bank account deleted successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new BankController();

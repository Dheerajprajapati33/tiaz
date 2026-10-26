const userService = require('../services/user.service');
const kycService = require('../services/kyc.service');
const { successResponse, errorResponse } = require('../utils/response');

class UserController {
  async verifyUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await kycService.verifyUser(userId);
      return successResponse(res, 'User verified successfully', user);
    } catch (error) {
      const statusCode = error.statusCode || 400;
      return errorResponse(res, error.message, statusCode);
    }
  }
  async getProfile(req, res) {
    try {
      const data = await userService.getProfile(req.user._id);
      return successResponse(res, 'User profile retrieved', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async updateProfile(req, res) {
    try {
      const updated = await userService.updateProfile(req.user._id, req.body, req.file);
      return successResponse(res, 'Profile updated successfully', updated);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      await userService.changePassword(req.user._id, oldPassword, newPassword);
      return successResponse(res, 'Password changed successfully');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new UserController();

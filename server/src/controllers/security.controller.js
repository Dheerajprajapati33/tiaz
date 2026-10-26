const securityService = require('../services/security.service');
const { successResponse, errorResponse } = require('../utils/response');

class SecurityController {
  async getLoginHistory(req, res) {
    try {
      const history = await securityService.getLoginHistory(req.user._id);
      return successResponse(res, 'Login history retrieved', history);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async registerDevice(req, res) {
    try {
      const device = await securityService.registerDevice(req.user._id, req.body, req);
      return successResponse(res, 'Device registered successfully', device);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getDevices(req, res) {
    try {
      const devices = await securityService.getUserDevices(req.user._id);
      return successResponse(res, 'User active devices', devices);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new SecurityController();

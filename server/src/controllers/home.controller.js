const homeService = require('../services/home.service');
const { successResponse, errorResponse } = require('../utils/response');

class HomeController {
  async getHomeScreen(req, res) {
    try {
      const period = req.query.period || 'all_time';
      const data = await homeService.getHomeScreenData(req.user._id, period);
      return successResponse(res, 'Home screen data retrieved successfully', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new HomeController();

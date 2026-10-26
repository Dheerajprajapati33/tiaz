const referralService = require("../services/referral.service");
const { successResponse, errorResponse } = require("../utils/response");

class ReferralController {
  async getReferralData(req, res) {
    try {
      const data = await referralService.getReferralScreenData(req.user._id);
      return successResponse(res, "Referral data retrieved successfully", data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getReferralSummary(req, res) {
    try {
      const data = await referralService.getReferralScreenData(req.user._id);
      return successResponse(res, "Referral stats", data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getMyReferrals(req, res) {
    try {
      const data = await referralService.getMyReferredUsers(req.user._id);
      return successResponse(
        res,
        "Referred users retrieved successfully",
        data,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new ReferralController();

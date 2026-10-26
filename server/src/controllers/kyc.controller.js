const kycService = require("../services/kyc.service");
const { successResponse, errorResponse } = require("../utils/response");

class KycController {
  async getKycStatus(req, res) {
    try {
      const status = await kycService.getKycStatus(req.user._id);
      return successResponse(res, "KYC status retrieved", status);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async reUploadDocuments(req, res) {
    try {
      const kyc = await kycService.reUploadKycDocuments(
        req.user._id,
        req.files,
        req.body
      );
      return successResponse(res, "KYC documents re-uploaded for review", kyc);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async reviewKyc(req, res) {
    try {
      const { userId } = req.params;
      const { status, rejectionReason } = req.body;
      const updated = await kycService.reviewKyc(
        req.user._id,
        userId,
        status,
        rejectionReason,
      );
      return successResponse(res, "KYC reviewed successfully", updated);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new KycController();

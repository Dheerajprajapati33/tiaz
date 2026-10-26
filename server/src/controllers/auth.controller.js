const authService = require("../services/auth.service");
const securityService = require("../services/security.service");
const { successResponse, errorResponse } = require("../utils/response");

class AuthController {
  async sendOtp(req, res) {
    try {
      const mobile = req.body.mobile || req.body.phone;
      const result = await authService.sendLoginOtp(mobile);
      return successResponse(res, "OTP sent successfully.", result);
    } catch (error) {
      const statusCode = error.statusCode || 400;
      return errorResponse(res, error.message, statusCode, null, {
        isRegistered:
          error.isRegistered !== undefined ? error.isRegistered : true,
        kycStatus: error.kycStatus || undefined,
        rejectionReason: error.rejectionReason || undefined,
      });
    }
  }

  async verifyOtp(req, res) {
    try {
      const mobile = req.body.mobile || req.body.phone;
      const { otp } = req.body;
      const data = await authService.verifyOtpAndLogin(mobile, otp);
      await securityService.logLogin(data.user._id, req, "SUCCESS");
      return successResponse(res, "Login successful.", data);
    } catch (error) {
      const statusCode = error.statusCode || 400;
      return errorResponse(res, error.message, statusCode, null, {
        isRegistered:
          error.isRegistered !== undefined ? error.isRegistered : true,
        kycStatus: error.kycStatus || undefined,
        rejectionReason: error.rejectionReason || undefined,
      });
    }
  }

  async register(req, res) {
    try {
      const payload = {
        ...req.body,
        _id: req.uploadUserId,
        mobile: req.body.mobile || req.body.phone,
        fullName: req.body.fullName || req.body.name,
      };
      const data = await authService.register(payload, req.files);
      return successResponse(
        res,
        data.message || "Registration completed successfully.",
        data.user,
        201,
      );
    } catch (error) {
      const statusCode = error.statusCode || 400;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async login(req, res) {
    try {
      const mobile = req.body.mobile || req.body.phone;
      const { password } = req.body;

      // If password is not provided, trigger OTP send flow
      if (!password) {
        const result = await authService.sendLoginOtp(mobile);
        return successResponse(res, "OTP sent successfully.", result);
      }

      const data = await authService.login(mobile, password);
      await securityService.logLogin(data.user._id, req, "SUCCESS");
      return successResponse(res, "Login successful.", data);
    } catch (error) {
      const statusCode = error.statusCode || 401;
      return errorResponse(res, error.message, statusCode, null, {
        kycStatus: error.kycStatus || undefined,
        rejectionReason: error.rejectionReason || undefined,
      });
    }
  }

  async adminLogin(req, res) {
    try {
      const identifier = req.body.email || req.body.mobile || req.body.username;
      const { password } = req.body;

      if (!identifier || !password) {
        return errorResponse(
          res,
          "Email and password are required for administrator login.",
          400,
        );
      }

      const data = await authService.adminLogin(identifier, password);
      await securityService.logLogin(
        data.admin.rawId || data.admin.id,
        req,
        "SUCCESS",
      );
      return successResponse(
        res,
        "Administrator authentication successful.",
        data,
      );
    } catch (error) {
      const statusCode = error.statusCode || 401;
      return errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new AuthController();

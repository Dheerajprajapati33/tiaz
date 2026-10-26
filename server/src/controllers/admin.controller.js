const adminService = require("../services/admin.service");
const orderService = require("../services/order.service");
const rateSettingService = require("../services/rateSetting.service");
const rateScraperService = require("../services/rateScraper.service");
const withdrawalService = require("../services/withdrawal.service");
const { successResponse, errorResponse } = require("../utils/response");

class AdminController {
  async getDashboard(req, res) {
    try {
      const assetType = req.query.assetType || req.query.metalType || "gold";
      const period = req.query.period || "1M";
      const data = await adminService.getDashboardData({ assetType, period });
      return successResponse(
        res,
        "Admin dashboard metrics retrieved successfully",
        data,
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getUsers(req, res) {
    try {
      const {
        search = "",
        status = "All",
        kycStatus = "All",
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const result = await adminService.getUsersList({
        search,
        status,
        kycStatus,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      return successResponse(res, "Users retrieved successfully", result);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getUserReferrals(req, res) {
    try {
      const { userId } = req.params;
      const result = await adminService.getUserReferrals(userId);
      return successResponse(
        res,
        "User referrals retrieved successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async toggleBlockUser(req, res) {
    try {
      const { userId } = req.params;
      const { isBlocked } = req.body;
      const result = await adminService.toggleBlockUser(userId, isBlocked);
      return successResponse(
        res,
        result.isBlocked
          ? "User blocked successfully"
          : "User unblocked successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async updateUserKyc(req, res) {
    try {
      const { userId } = req.params;
      const { status, rejectionReason } = req.body;
      const result = await adminService.updateUserKyc(
        userId,
        status,
        rejectionReason,
        req.user?._id,
      );
      return successResponse(res, "User KYC updated successfully", result);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getGoldOverview(req, res) {
    try {
      if (req.query.fresh) await rateScraperService.refreshRates(true);
      const data = await adminService.getAssetOverview("gold");
      return successResponse(
        res,
        "Gold bullion overview retrieved successfully",
        data,
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getSilverOverview(req, res) {
    try {
      if (req.query.fresh) await rateScraperService.refreshRates(true);
      const data = await adminService.getAssetOverview("silver");
      return successResponse(
        res,
        "Silver bullion overview retrieved successfully",
        data,
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getAssetOverview(req, res) {
    try {
      const { assetType = "gold" } = req.params;
      if (req.query.fresh) await rateScraperService.refreshRates(true);
      const data = await adminService.getAssetOverview(assetType);
      return successResponse(
        res,
        `${assetType} bullion overview retrieved successfully`,
        data,
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getTransactions(req, res) {
    try {
      const {
        search = "",
        metalType = "ALL",
        type = "ALL",
        buyType = "ALL",
        status = "ALL",
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const result = await adminService.getTransactionsList({
        search,
        metalType,
        type,
        buyType,
        status,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      return successResponse(
        res,
        "Transactions retrieved successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getProfile(req, res) {
    try {
      const data = await adminService.getAdminProfile(req.user._id);
      return successResponse(res, "Admin profile retrieved successfully", data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async updateProfile(req, res) {
    try {
      let profileImage = req.body.profileImage;
      if (req.file) {
        profileImage = `uploads/users/${req.user._id}/${req.file.filename}`;
      }

      const data = await adminService.updateAdminProfile(req.user._id, {
        ...req.body,
        profileImage,
      });

      return successResponse(res, "Admin profile updated successfully", data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async changePassword(req, res) {
    try {
      const data = await adminService.changeAdminPassword(
        req.user._id,
        req.body,
      );
      return successResponse(res, data.message, data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // ==================== PHYSICAL PURCHASE REQUESTS & ORDERS ====================

  async getPurchaseRequests(req, res) {
    try {
      const {
        status = "ALL",
        metalType = "ALL",
        paymentMethod = "ALL",
        search = "",
        page = 1,
        limit = 10,
      } = req.query;

      const result = await orderService.getAdminPurchaseRequests({
        status,
        metalType,
        paymentMethod,
        search,
        page,
        limit,
      });

      return successResponse(
        res,
        "Purchase requests retrieved successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getPurchaseRequestDetails(req, res) {
    try {
      const order = await orderService.getOrderDetails(req.params.id);
      return successResponse(
        res,
        "Order details retrieved successfully",
        order,
      );
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  async acceptPurchaseRequest(req, res) {
    try {
      const result = await orderService.acceptOrder(req.params.id, req.body);
      return successResponse(
        res,
        "Purchase request accepted and verified successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async rejectPurchaseRequest(req, res) {
    try {
      const result = await orderService.rejectOrder(req.params.id, req.body);
      return successResponse(
        res,
        "Purchase request cancelled successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async dispatchPurchaseOrder(req, res) {
    try {
      const result = await orderService.dispatchOrder(req.params.id, req.body);
      return successResponse(
        res,
        "Order marked as dispatched successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async completeDelivery(req, res) {
    try {
      const result = await orderService.completeDelivery(
        req.params.id,
        req.body,
      );
      return successResponse(
        res,
        "Order delivery marked as completed successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const result = await orderService.updateOrderStatus(
        req.params.id,
        req.body,
      );
      return successResponse(res, "Order status updated successfully", result);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getRateSettings(req, res) {
    try {
      const settings = await rateSettingService.getSettings();
      return successResponse(
        res,
        "Rate settings retrieved successfully",
        settings,
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async updateRateSettings(req, res) {
    try {
      const updated = await rateSettingService.updateSettings(
        req.body,
        req.user?._id,
      );
      return successResponse(
        res,
        "Rate settings updated successfully",
        updated,
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  // ==================== CASH WITHDRAWAL REQUESTS ====================

  async getWithdrawals(req, res) {
    try {
      const { search = "", status = "ALL", page = 1, limit = 10 } = req.query;
      const result = await withdrawalService.getAdminWithdrawals({
        search,
        status,
        page,
        limit,
      });
      return successResponse(
        res,
        "Withdrawal requests retrieved successfully",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async approveWithdrawal(req, res) {
    try {
      const result = await withdrawalService.approveWithdrawal(
        req.params.id,
        req.user?._id,
        req.body,
      );
      return successResponse(
        res,
        "Withdrawal approved successfully. Payout marked as settled.",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  async rejectWithdrawal(req, res) {
    try {
      const result = await withdrawalService.rejectWithdrawal(
        req.params.id,
        req.user?._id,
        req.body,
      );
      return successResponse(
        res,
        "Withdrawal rejected. Amount refunded to customer wallet.",
        result,
      );
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }
}

module.exports = new AdminController();

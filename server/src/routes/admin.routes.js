const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authenticate = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const { uploadProfile } = require("../middleware/upload.middleware");

// Protect all admin endpoints with authentication and admin authorization
router.use(authenticate, requireAdmin);

// Dashboard Metrics
router.get("/dashboard", adminController.getDashboard);

// Customer User Management
router.get("/users", adminController.getUsers);
router.get("/users/:userId/referrals", adminController.getUserReferrals);
router.put("/users/:userId/block", adminController.toggleBlockUser);
router.put("/users/:userId/kyc", adminController.updateUserKyc);

// Bullion Asset Overviews (Gold & Silver Inventories)
router.get("/gold", adminController.getGoldOverview);
router.get("/silver", adminController.getSilverOverview);
router.get("/asset/:assetType", adminController.getAssetOverview);

// Dynamic Buy/Sell Margin Rates Setting
router.get("/rate-settings", adminController.getRateSettings);
router.put("/rate-settings", adminController.updateRateSettings);

// Physical Purchase Requests & Orders Lifecycle (with aliases for backwards compatibility)
router.get("/purchase-requests", adminController.getPurchaseRequests);
router.get("/orders", adminController.getPurchaseRequests);
router.get("/purchase-requests/:id", adminController.getPurchaseRequestDetails);
router.put(
  "/purchase-requests/:id/accept",
  adminController.acceptPurchaseRequest,
);
router.put(
  "/purchase-requests/:id/reject",
  adminController.rejectPurchaseRequest,
);
router.put(
  "/purchase-requests/:id/dispatch",
  adminController.dispatchPurchaseOrder,
);
router.put("/purchase-requests/:id/deliver", adminController.completeDelivery);
router.put("/purchase-requests/:id/status", adminController.updateOrderStatus);
router.put("/orders/:id/status", adminController.updateOrderStatus);

// Financial Ledger & Transactions (Customer-only transactions)
router.get("/transactions", adminController.getTransactions);

// Cash Withdrawal Requests (Approve / Reject payouts)
router.get("/withdrawals", adminController.getWithdrawals);
router.put("/withdrawals/:id/approve", adminController.approveWithdrawal);
router.put("/withdrawals/:id/reject", adminController.rejectWithdrawal);

// Admin Profile & Credentials
router.get("/profile", adminController.getProfile);
router.put(
  "/profile",
  uploadProfile.single("profileImage"),
  adminController.updateProfile,
);
router.put("/change-password", adminController.changePassword);

module.exports = router;

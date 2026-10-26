const express = require("express");
const router = express.Router();
const referralController = require("../controllers/referral.controller");
const authenticate = require("../middleware/auth.middleware");

router.use(authenticate);

// GET /api/v1/referrals (Complete Refer & Earn screen data)
router.get("/", referralController.getReferralData);

// GET /api/v1/referrals/summary (Summary data)
router.get("/summary", referralController.getReferralSummary);

// GET /api/v1/referrals/my-referrals (List of users who used this user's referral code)
router.get("/my-referrals", referralController.getMyReferrals);

module.exports = router;

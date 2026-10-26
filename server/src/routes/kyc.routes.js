const express = require("express");
const router = express.Router();
const kycController = require("../controllers/kyc.controller");
const authenticate = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const { uploadRegistration } = require("../middleware/upload.middleware");

router.use(authenticate);

router.get("/status", kycController.getKycStatus);
router.post("/upload", uploadRegistration, kycController.reUploadDocuments);
router.put("/review/:userId", requireAdmin, kycController.reviewKyc);

module.exports = router;

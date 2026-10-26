const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { sendOtpValidator, verifyOtpValidator, registerValidator, loginValidator } = require('../validators/auth.validator');
const validate = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { uploadRegistration } = require('../middleware/upload.middleware');

router.post('/send-otp', authLimiter, sendOtpValidator, validate, authController.sendOtp);
router.post('/verify-otp', authLimiter, verifyOtpValidator, validate, authController.verifyOtp);
router.post('/register', authLimiter, uploadRegistration, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/admin/login', authLimiter, authController.adminLogin);

module.exports = router;

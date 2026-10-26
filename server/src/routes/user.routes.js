const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const validate = require('../middleware/validation.middleware');
const { updateProfileValidator, changePasswordValidator } = require('../validators/user.validator');
const { uploadProfile } = require('../middleware/upload.middleware');

// Admin-only manual verification shortcut
router.put('/verify/:userId', authenticate, requireAdmin, userController.verifyUser);

// Authenticated customer routes
router.use(authenticate);

// Profile view
router.get('/profile', userController.getProfile);

// Unified profile update: accepts text details and/or profileImage
router.put('/profile', uploadProfile.single('profileImage'), updateProfileValidator, validate, userController.updateProfile);

// Change password
router.post('/change-password', changePasswordValidator, validate, userController.changePassword);

module.exports = router;

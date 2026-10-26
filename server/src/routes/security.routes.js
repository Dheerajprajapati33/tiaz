const express = require('express');
const router = express.Router();
const securityController = require('../controllers/security.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/login-history', securityController.getLoginHistory);
router.post('/device', securityController.registerDevice);
router.get('/devices', securityController.getDevices);

module.exports = router;

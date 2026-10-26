const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home.controller');
const authenticate = require('../middleware/auth.middleware');

// GET /api/v1/home (Accepts optional query: ?period=all_time|1y|1m|1w|1d)
router.get('/', authenticate, homeController.getHomeScreen);

module.exports = router;

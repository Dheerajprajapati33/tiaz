const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const authenticate = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');

// GET /api/v1/content?type=terms | privacy (Publicly accessible)
router.get('/', contentController.getContent);
router.get('/:type', contentController.getContent);

// POST or PUT /api/v1/content (Admin only)
router.post('/', authenticate, requireAdmin, contentController.saveContent);
router.put('/', authenticate, requireAdmin, contentController.saveContent);

module.exports = router;

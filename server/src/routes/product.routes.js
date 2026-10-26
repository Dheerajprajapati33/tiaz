const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authenticate = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const { uploadProductImages } = require('../middleware/upload.middleware');

// Public endpoints to browse physical products in app (with search, metalType filter, scroll pagination)
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin-protected endpoints to Add, Update, and Delete products
router.post('/upload-images', authenticate, requireAdmin, uploadProductImages, productController.uploadImages);
router.post('/', authenticate, requireAdmin, productController.createProduct);
router.put('/:id', authenticate, requireAdmin, productController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

module.exports = router;

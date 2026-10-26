const productService = require('../services/product.service');
const { successResponse, errorResponse } = require('../utils/response');

class ProductController {
  constructor() {
    this.getProducts = this.getProducts.bind(this);
    this.getProductById = this.getProductById.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.uploadImages = this.uploadImages.bind(this);
  }

  /**
   * Admin: Upload up to 4 product images (saved to uploads/products, max 600 KB each)
   */
  async uploadImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return errorResponse(res, 'No image files uploaded', 400);
      }

      const imageUrls = req.files.map((file) => `/uploads/products/${file.filename}`);
      return successResponse(res, `${imageUrls.length} product image(s) uploaded successfully`, {
        urls: imageUrls,
        images: imageUrls,
        primaryUrl: imageUrls[0],
        count: imageUrls.length
      }, 201);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
  /**
   * Get products with scroll pagination, search, and metalType filter
   * Query: ?metalType=GOLD|SILVER|ALL&search=coin&page=1&limit=10&inStock=true
   */
  async getProducts(req, res) {
    try {
      const { metalType, category, type, search, inStock, page, limit, includeInactive } = req.query;
      const data = await productService.getProducts({
        metalType: metalType || category || type,
        category,
        type,
        search,
        inStock,
        page,
        limit,
        includeInactive: req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN' ? (includeInactive === 'true') : false
      });
      return successResponse(res, 'Products retrieved successfully', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get single product by ID
   */
  async getProductById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      return successResponse(res, 'Product details retrieved successfully', product);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 404);
    }
  }

  /**
   * Admin: Add a new product
   */
  async createProduct(req, res) {
    try {
      const product = await productService.createProduct(req.body);
      return successResponse(res, 'Product created successfully', product, 201);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  /**
   * Admin: Update an existing product
   */
  async updateProduct(req, res) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return successResponse(res, 'Product updated successfully', product);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }

  /**
   * Admin: Delete a product
   */
  async deleteProduct(req, res) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      return successResponse(res, result.message, result);
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 400);
    }
  }
}

module.exports = new ProductController();

const contentService = require('../services/content.service');
const { successResponse, errorResponse } = require('../utils/response');

class ContentController {
  async getContent(req, res) {
    try {
      const type = req.query.type || req.params.type;
      const data = await contentService.getContent(type);
      return successResponse(res, 'Content retrieved successfully.', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async saveContent(req, res) {
    try {
      const { type, content, title } = req.body;
      const updatedBy = req.user ? req.user._id : null;
      const data = await contentService.saveContent({ type, content, title, updatedBy });
      return successResponse(res, 'Content updated successfully.', data);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new ContentController();

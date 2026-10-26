const notificationService = require('../services/notification.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const { notifications, total, unreadCount } = await notificationService.getUserNotifications(
        req.user._id,
        { page, limit }
      );
      return paginatedResponse(res, 'Notifications retrieved', notifications, {
        page,
        limit,
        total,
        unreadCount
      });
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async markAsRead(req, res) {
    try {
      const updated = await notificationService.markAsRead(req.user._id, req.params.id);
      return successResponse(res, 'Notification marked as read', updated);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async markAllAsRead(req, res) {
    try {
      await notificationService.markAllAsRead(req.user._id);
      return successResponse(res, 'All notifications marked as read');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new NotificationController();

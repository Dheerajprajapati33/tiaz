const Notification = require('../models/Notification');

class NotificationService {
  async sendNotification(userId, { title, message, type = 'SYSTEM', metadata = {} }) {
    return await Notification.create({
      user: userId,
      title,
      message,
      type,
      metadata
    });
  }

  async getUserNotifications(userId, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ user: userId }),
      Notification.countDocuments({ user: userId, isRead: false })
    ]);

    return { notifications, total, unreadCount };
  }

  async markAsRead(userId, notificationId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }
}

module.exports = new NotificationService();

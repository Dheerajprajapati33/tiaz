const LoginHistory = require('../models/LoginHistory');
const Device = require('../models/Device');

class SecurityService {
  async logLogin(userId, req, status = 'SUCCESS', failureReason = null) {
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      return await LoginHistory.create({
        userId,
        ipAddress,
        userAgent,
        status,
        failureReason
      });
    } catch (err) {
      console.error('Failed to log login history:', err.message);
      return null;
    }
  }

  async getLoginHistory(userId, limit = 10) {
    return await LoginHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  async registerDevice(userId, { deviceId, deviceName, deviceType, fcmToken }, req) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || '';

    return await Device.findOneAndUpdate(
      { user: userId, deviceId },
      {
        deviceName,
        deviceType,
        fcmToken,
        ipAddress,
        userAgent,
        lastActiveAt: new Date()
      },
      { upsert: true, new: true }
    );
  }

  async getUserDevices(userId) {
    return await Device.find({ user: userId }).sort({ lastActiveAt: -1 });
  }
}

module.exports = new SecurityService();

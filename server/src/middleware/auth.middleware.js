const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token missing or invalid', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'User account is deactivated', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication error', 401, error.message);
  }
};

module.exports = authenticate;

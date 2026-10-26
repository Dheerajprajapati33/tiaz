const { errorResponse } = require('../utils/response');
const { ROLES } = require('../utils/constants');

const requireAdmin = (req, res, next) => {
  const userRole = (req.user && req.user.role) ? req.user.role.toUpperCase() : '';
  if (!req.user || (req.user.role !== ROLES.ADMIN && userRole !== 'ADMIN')) {
    return errorResponse(res, 'Access denied. Administrator privileges required.', 403);
  }
  next();
};

module.exports = requireAdmin;

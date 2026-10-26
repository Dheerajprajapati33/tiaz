const logger = require('../config/logger');
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled Error on ${req.method} ${req.originalUrl}: ${err.message}`, err.stack);

  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 400);
  }

  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, `Duplicate value entered for ${field}`, 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token. Please authenticate again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired. Please login again.', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode);
};

module.exports = errorHandler;

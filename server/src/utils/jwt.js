const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (payload, secret = env.JWT_SECRET, expiresIn = null) => {
  const options = {};
  if (expiresIn) {
    options.expiresIn = expiresIn;
  }
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token, secret = env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};

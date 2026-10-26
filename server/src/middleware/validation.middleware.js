const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');
const fs = require('fs');
const path = require('path');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If files were already saved by Multer before validation failed, clean up the user directory
    if (req.uploadUserId) {
      const userFolder = path.join(__dirname, '../../uploads/users', req.uploadUserId.toString());
      if (fs.existsSync(userFolder)) {
        try {
          fs.rmSync(userFolder, { recursive: true, force: true });
        } catch (e) {}
      }
    }

    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return errorResponse(res, formattedErrors[0].message || 'Validation failed', 422, formattedErrors);
  }
  next();
};

module.exports = validate;

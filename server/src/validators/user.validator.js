const { body, oneOf } = require('express-validator');

const updateProfileValidator = [
  body('mobile')
    .custom((value) => {
      if (value !== undefined) {
        throw new Error('Mobile number cannot be updated. Please contact support.');
      }
      return true;
    }),
  body('phone')
    .custom((value) => {
      if (value !== undefined) {
        throw new Error('Mobile number cannot be updated. Please contact support.');
      }
      return true;
    }),
  oneOf([
    body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
    body('name').optional().trim().isLength({ min: 2, max: 100 })
  ]),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('dob')
    .optional({ checkFalsy: true })
    .trim(),
  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('panNumber')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format (e.g. ABCDE1234F)'),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('nationality')
    .optional({ checkFalsy: true })
    .trim()
];

const changePasswordValidator = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator
};

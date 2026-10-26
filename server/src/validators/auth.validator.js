const { body, oneOf } = require('express-validator');

const sendOtpValidator = [
  oneOf([
    body('mobile').trim().notEmpty().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number required'),
    body('phone').trim().notEmpty().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number required')
  ])
];

const verifyOtpValidator = [
  oneOf([
    body('mobile').trim().notEmpty().matches(/^[6-9]\d{9}$/),
    body('phone').trim().notEmpty().matches(/^[6-9]\d{9}$/)
  ]),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
];

const registerValidator = [
  oneOf([
    body('mobile').trim().notEmpty().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number required'),
    body('phone').trim().notEmpty().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number required')
  ]),
  oneOf([
    body('fullName').trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage('Full name is required'),
    body('name').trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage('Full name is required')
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
    .trim(),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('nationality')
    .optional({ checkFalsy: true })
    .trim(),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('referralCode')
    .optional({ checkFalsy: true })
    .trim()
];

const loginValidator = [
  oneOf([
    body('mobile').trim().notEmpty().matches(/^[6-9]\d{9}$/),
    body('phone').trim().notEmpty().matches(/^[6-9]\d{9}$/)
  ]),
  body('password')
    .optional()
];

module.exports = {
  sendOtpValidator,
  verifyOtpValidator,
  registerValidator,
  loginValidator
};

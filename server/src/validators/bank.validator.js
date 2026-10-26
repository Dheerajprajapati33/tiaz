const { body } = require('express-validator');

const addBankValidator = [
  body('accountHolderName')
    .if(body('upiId').not().exists())
    .custom((val, { req }) => {
      const name = val || req.body.name;
      if (!name || !name.trim()) {
        throw new Error('Account holder name is required');
      }
      return true;
    }),
  body('accountNumber')
    .if(body('upiId').not().exists())
    .trim()
    .notEmpty().withMessage('Account number is required')
    .isNumeric().withMessage('Account number must be numeric'),
  body('ifscCode')
    .if(body('upiId').not().exists())
    .trim()
    .notEmpty().withMessage('IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC format (e.g. HDFC0001234)'),
  body('bankName')
    .if(body('upiId').not().exists())
    .trim()
    .notEmpty().withMessage('Bank name is required'),
  body('upiId')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/).withMessage('Invalid UPI ID format (e.g. name@okhdfcbank or 9876543210@paytm)')
];

const addUpiValidator = [
  body('upiId')
    .trim()
    .notEmpty().withMessage('UPI ID is required')
    .matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/).withMessage('Invalid UPI ID format (e.g. name@okhdfcbank or 9876543210@paytm)'),
  body('name')
    .optional({ checkFalsy: true })
    .trim(),
  body('accountHolderName')
    .optional({ checkFalsy: true })
    .trim()
];

module.exports = {
  addBankValidator,
  addUpiValidator
};

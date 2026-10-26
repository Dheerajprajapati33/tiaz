const { body } = require('express-validator');

const buyGoldValidator = [
  body('amount')
    .optional()
    .isFloat({ min: 10 }).withMessage('Minimum buy amount is ₹10'),
  body('grams')
    .optional()
    .isFloat({ min: 0.001 }).withMessage('Minimum buy weight is 0.001 grams'),
  body('weightGrams')
    .optional()
    .isFloat({ min: 0.001 }).withMessage('Minimum buy weight is 0.001 grams'),
  body('productId')
    .optional()
    .isString(),
  body('buyType')
    .optional()
    .isIn(['VIRTUAL', 'PHYSICAL', 'virtual', 'physical']).withMessage('buyType must be VIRTUAL or PHYSICAL'),
  body('deliveryAddress')
    .optional()
    .isObject(),
  body('paymentMethod')
    .optional()
    .isString(),
  body().custom((value) => {
    if (!value.amount && !value.grams && !value.weightGrams && !value.productId) {
      throw new Error('Please enter either amount (₹), grams (gm), or select a product');
    }
    return true;
  })
];

const sellGoldValidator = [
  body('grams')
    .optional()
    .isFloat({ min: 0.0001 }).withMessage('Minimum sell weight is 0.0001 grams'),
  body('amount')
    .optional()
    .isFloat({ min: 1 }).withMessage('Minimum sell amount is ₹1'),
  body('payoutDestination')
    .optional()
    .isIn(['WALLET', 'BANK', 'TIAZ_WALLET']).withMessage('Payout destination must be WALLET or BANK'),
  body('bankAccountId')
    .optional(),
  body().custom((value) => {
    if (!value.grams && !value.amount) {
      throw new Error('Please specify either grams or amount to sell');
    }
    if (value.payoutDestination === 'BANK' && !value.bankAccountId) {
      throw new Error('Please select a bank account for bank payout');
    }
    return true;
  })
];

const updateRateValidator = [
  body('buyPricePerGram')
    .isFloat({ min: 100 }).withMessage('Valid buy price required'),
  body('sellPricePerGram')
    .isFloat({ min: 100 }).withMessage('Valid sell price required'),
  body('purity')
    .optional()
    .isIn(['24K', '22K']).withMessage('Purity must be 24K or 22K')
];

module.exports = {
  buyGoldValidator,
  sellGoldValidator,
  updateRateValidator
};

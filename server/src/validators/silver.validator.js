const { body } = require('express-validator');

const buySilverValidator = [
  body('amount')
    .optional()
    .isFloat({ min: 10 }).withMessage('Minimum buy amount is ₹10'),
  body('grams')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Minimum buy weight is 0.01 grams'),
  body('weightGrams')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Minimum buy weight is 0.01 grams'),
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

const sellSilverValidator = [
  body('grams')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Minimum sell weight is 0.01 grams'),
  body('amount')
    .optional()
    .isFloat({ min: 1 }).withMessage('Minimum sell amount is ₹1'),
  body('payoutDestination')
    .optional()
    .isIn(['WALLET', 'BANK', 'TIAZ_WALLET']).withMessage('Payout destination must be WALLET or BANK'),
  body('bankAccountId')
    .optional()
    .isMongoId().withMessage('Invalid Bank Account ID format'),
  body().custom((value) => {
    if (!value.grams && !value.amount) {
      throw new Error('Please specify either grams or amount to sell');
    }
    return true;
  })
];

const updateRateValidator = [
  body('purity')
    .isIn(['999', '925', '900']).withMessage('Purity must be 999, 925, or 900'),
  body('pricePerGram')
    .isFloat({ min: 1 }).withMessage('Price per gram must be a positive number'),
  body('source')
    .optional()
    .isIn(['manual', 'provider', 'market']).withMessage('Invalid rate source')
];

module.exports = {
  buySilverValidator,
  sellSilverValidator,
  updateRateValidator
};

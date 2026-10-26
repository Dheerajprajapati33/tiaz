const { body } = require('express-validator');

const submitKycValidator = [
  body('documentType')
    .isIn(['PAN', 'AADHAAR', 'PASSPORT', 'VOTER_ID']).withMessage('Invalid document type'),
  body('documentNumber')
    .trim()
    .notEmpty().withMessage('Document number is required'),
  body('panNumber')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format (e.g. ABCDE1234F)')
];

module.exports = {
  submitKycValidator
};

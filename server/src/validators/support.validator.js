const { body } = require('express-validator');

const createTicketValidator = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 5, max: 150 }).withMessage('Subject must be 5-150 characters'),
  body('category')
    .optional()
    .isIn(['ACCOUNT', 'PAYMENT', 'KYC', 'GOLD_ORDER', 'WALLET', 'OTHER']).withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message description is required')
];

const sendMessageValidator = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message text is required')
];

module.exports = {
  createTicketValidator,
  sendMessageValidator
};

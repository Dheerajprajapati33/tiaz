const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { createTicketValidator, sendMessageValidator } = require('../validators/support.validator');

router.get('/faqs', supportController.getFAQs);

router.use(authenticate);
router.post('/tickets', createTicketValidator, validate, supportController.createTicket);
router.get('/tickets', supportController.getTickets);
router.get('/tickets/:ticketId', supportController.getTicketDetails);
router.post('/tickets/:ticketId/reply', sendMessageValidator, validate, supportController.replyTicket);

module.exports = router;

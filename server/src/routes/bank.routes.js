const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bank.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { addBankValidator, addUpiValidator } = require('../validators/bank.validator');

router.use(authenticate);

router.get('/', bankController.getAccounts);
router.post('/', addBankValidator, validate, bankController.addAccount);
router.post('/upi', addUpiValidator, validate, bankController.addUpi);
router.put('/:accountId/primary', bankController.setPrimary);
router.delete('/:accountId', bankController.removeAccount);

module.exports = router;

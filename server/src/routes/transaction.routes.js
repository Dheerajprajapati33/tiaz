const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const authenticate = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", transactionController.getTransactions);
router.get("/:transactionId", transactionController.getTransactionDetails);

module.exports = router;

const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const authenticate = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", walletController.getWallet);
router.post("/create-order", walletController.createOrder);
router.post("/add-cash", walletController.addCash);
router.post("/withdraw", walletController.requestWithdrawal);
router.get("/withdrawals", walletController.getMyWithdrawals);

module.exports = router;

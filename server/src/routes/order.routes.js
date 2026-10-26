const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

// Generate Razorpay Order for Physical Product Online Payment
router.post('/create-payment', (req, res) => orderController.createPaymentOrder(req, res));
router.post('/create-order', (req, res) => orderController.createPaymentOrder(req, res));

// Physical Product Buy API (Direct Purchase via COD, WALLET, or ONLINE)
// POST /api/v1/orders/buy
router.post('/buy', (req, res) => orderController.buyPhysicalProduct(req, res));

// 3. User Orders Listing & Details
router.get('/', (req, res) => orderController.getMyOrders(req, res));
router.get('/my-orders', (req, res) => orderController.getMyOrders(req, res));
router.get('/:orderId', (req, res) => orderController.getOrderDetails(req, res));

module.exports = router;

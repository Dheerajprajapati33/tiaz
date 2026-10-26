const express = require('express');
const router = express.Router();

const homeRoutes = require('./home.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const kycRoutes = require('./kyc.routes');
const goldRoutes = require('./gold.routes');
const silverRoutes = require('./silver.routes');
const walletRoutes = require('./wallet.routes');
const transactionRoutes = require('./transaction.routes');
const bankRoutes = require('./bank.routes');
const referralRoutes = require('./referral.routes');
const notificationRoutes = require('./notification.routes');
const securityRoutes = require('./security.routes');
const supportRoutes = require('./support.routes');
const adminRoutes = require('./admin.routes');
const contentRoutes = require('./content.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const tradeRoutes = require('./trade.routes');
const paymentRoutes = require('./payment.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.use('/admin', adminRoutes);
router.use('/home', homeRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/kyc', kycRoutes);
router.use('/trade', tradeRoutes);
router.use('/gold', goldRoutes);
router.use('/silver', silverRoutes);
router.use('/wallet', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/banks', bankRoutes);
router.use('/referrals', referralRoutes);
router.use('/notifications', notificationRoutes);
router.use('/security', securityRoutes);
router.use('/support', supportRoutes);
router.use('/content', contentRoutes);

module.exports = router;

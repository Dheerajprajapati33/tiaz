const mongoose = require('mongoose');
const GoldWallet = require('../models/GoldWallet');
const SilverWallet = require('../models/SilverWallet');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const razorpayService = require('./razorpay.service');

class WalletService {
  async getWallet(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const [goldWallet, silverWallet] = await Promise.all([
      GoldWallet.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true }
      ),
      SilverWallet.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true }
      )
    ]);

    // Attach silver data to goldWallet object for seamless backward compatibility
    const response = goldWallet.toObject ? goldWallet.toObject() : { ...goldWallet };
    response.availableSilver = silverWallet.availableSilver;
    response.virtualSilver = silverWallet.virtualSilver;
    response.physicalSilver = silverWallet.physicalSilver;
    response.totalSilverPurchased = silverWallet.totalSilverPurchased;
    response.totalSilverSold = silverWallet.totalSilverSold;
    response.silverTotalInvested = silverWallet.totalInvested;
    response.silverCurrentValue = silverWallet.currentValue;

    response.silverWallet = {
      availableSilver: silverWallet.availableSilver,
      virtualSilver: silverWallet.virtualSilver,
      physicalSilver: silverWallet.physicalSilver,
      totalSilverPurchased: silverWallet.totalSilverPurchased,
      totalSilverSold: silverWallet.totalSilverSold,
      totalInvested: silverWallet.totalInvested,
      currentValue: silverWallet.currentValue
    };

    return response;
  }

  /**
   * Create Razorpay order to add money to Tia'z Wallet
   */
  async createAddCashOrder(userId, amount) {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      const err = new Error('Please enter a valid amount to add to wallet');
      err.statusCode = 400;
      throw err;
    }

    return await razorpayService.createOrder({
      amount: numAmount,
      currency: 'INR',
      notes: {
        userId: userId.toString(),
        purpose: 'WALLET_ADD_CASH'
      }
    });
  }

  /**
   * Add cash to Tia'z Wallet after Razorpay payment verification
   */
  async addCashBalance(userId, payload) {
    let numAmount = 0;
    let rzpOrderId = null;
    let rzpPaymentId = null;
    let rzpSignature = null;

    if (typeof payload === 'object' && payload !== null) {
      numAmount = parseFloat(payload.amount);
      rzpOrderId = payload.razorpay_order_id;
      rzpPaymentId = payload.razorpay_payment_id || payload.paymentId;
      rzpSignature = payload.razorpay_signature;
    } else {
      numAmount = parseFloat(payload);
    }

    if (!numAmount || numAmount <= 0) {
      const err = new Error('Please enter a valid amount');
      err.statusCode = 400;
      throw err;
    }

    // If Razorpay details provided, verify cryptographic signature
    if (rzpOrderId || rzpPaymentId || rzpSignature) {
      if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
        const err = new Error('Incomplete Razorpay payment details. Order ID, Payment ID, and Signature are required.');
        err.statusCode = 400;
        throw err;
      }
      razorpayService.verifyPaymentSignature({
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: rzpSignature
      });
    }

    const wallet = await this.getWallet(userId);
    const current = parseFloat((wallet.cashBalance || 0).toString());
    const newBalance = Math.round((current + numAmount) * 100) / 100;
    wallet.cashBalance = newBalance;
    await wallet.save();

    let payment = null;
    if (rzpPaymentId) {
      payment = await Payment.create({
        userId: wallet.userId,
        paymentNumber: 'PAY-WLT-' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase(),
        amount: numAmount,
        currency: 'INR',
        method: 'UPI',
        status: 'SUCCESS',
        providerPaymentId: rzpPaymentId,
        paidAt: new Date()
      });
    }

    const transaction = await Transaction.create({
      userId: wallet.userId,
      transactionNumber: 'TXN' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase(),
      type: 'WALLET_CREDIT',
      direction: 'CREDIT',
      amount: numAmount,
      referenceType: 'Wallet',
      status: 'COMPLETED',
      paymentId: payment ? payment._id : null,
      description: rzpPaymentId
        ? `Added ₹${numAmount} to Tia'z Wallet via Razorpay (${rzpPaymentId})`
        : `Added ₹${numAmount} to Tia'z Wallet`
    });

    return {
      wallet,
      transaction,
      payment,
      addedAmount: numAmount,
      cashBalance: newBalance,
      message: `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} added successfully to Tia'z Wallet!`
    };
  }

  async deductCashBalance(userId, amount) {
    const numAmount = parseFloat(amount);
    const wallet = await this.getWallet(userId);
    const current = parseFloat((wallet.cashBalance || 0).toString());

    if (current < numAmount) {
      throw new Error(`Insufficient Tia'z Wallet balance. Available: ₹${current.toFixed(2)}`);
    }

    wallet.cashBalance = Math.round((current - numAmount) * 100) / 100;
    await wallet.save();
    return wallet;
  }
}

module.exports = new WalletService();

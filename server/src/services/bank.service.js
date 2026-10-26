const crypto = require('crypto');
const BankAccount = require('../models/BankAccount');

class BankService {
  encryptAccountNumber(accountNumber) {
    try {
      const secret = process.env.JWT_SECRET || 'tiaz_digital_gold_bank_secret';
      const key = crypto.createHash('sha256').update(String(secret)).digest();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(String(accountNumber), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch {
      return String(accountNumber);
    }
  }

  async addAccount(userId, bankData) {
    // If only upiId is provided without an account number, delegate to addUpiAccount
    if (bankData.upiId && !bankData.accountNumber) {
      return this.addUpiAccount(userId, bankData);
    }

    const rawAccountNumber = String(bankData.accountNumber || '').trim();
    const last4 = rawAccountNumber ? rawAccountNumber.slice(-4) : (bankData.accountNumberLast4 || 'XXXX');
    const encrypted = bankData.accountNumberEncrypted || this.encryptAccountNumber(rawAccountNumber);
    const ifsc = String(bankData.ifscCode || bankData.ifsc || 'UPI0000000').trim().toUpperCase();
    const accountType = String(bankData.accountType || 'savings').toLowerCase();
    const cleanUpi = bankData.upiId ? String(bankData.upiId).trim() : null;

    // Sync upiId to User model if provided
    if (cleanUpi) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, { upiId: cleanUpi });
    }

    const existing = await BankAccount.countDocuments({ userId });
    const isPrimary = existing === 0 || !!bankData.isPrimary;

    if (isPrimary && existing > 0) {
      await BankAccount.updateMany({ userId }, { isPrimary: false });
    }

    const account = await BankAccount.create({
      userId,
      accountHolderName: bankData.name || bankData.accountHolderName || 'Account Holder',
      bankName: bankData.bankName,
      accountNumberEncrypted: encrypted,
      accountNumberLast4: last4,
      ifsc,
      accountType,
      upiId: cleanUpi,
      isPrimary
    });

    return account;
  }

  async addUpiAccount(userId, { upiId, name, accountHolderName, isPrimary }) {
    if (!upiId) throw new Error('UPI ID is required');

    const cleanUpi = String(upiId).trim();
    const handle = cleanUpi.split('@')[1]?.toLowerCase() || 'upi';

    // Auto-detect bank/app provider from UPI handle
    const providerMap = {
      okhdfcbank: 'HDFC Bank (GPay)',
      okaxis: 'Axis Bank (GPay)',
      oksbi: 'State Bank of India (GPay)',
      okicici: 'ICICI Bank (GPay)',
      paytm: 'Paytm Payments Bank',
      ybl: 'Yes Bank (PhonePe)',
      ibl: 'ICICI Bank (PhonePe)',
      axl: 'Axis Bank (PhonePe)',
      upi: 'BHIM UPI'
    };
    const bankName = providerMap[handle] || `UPI (${handle.toUpperCase()})`;

    // Get user full name if name or accountHolderName not passed
    let holder = name || accountHolderName;
    const User = require('../models/User');
    if (!holder) {
      const user = await User.findById(userId).select('fullName');
      holder = user?.fullName || 'UPI Account Holder';
    }

    // Sync upiId to User document
    await User.findByIdAndUpdate(userId, { upiId: cleanUpi });

    const existing = await BankAccount.countDocuments({ userId });
    const makePrimary = existing === 0 || !!isPrimary;

    if (makePrimary && existing > 0) {
      await BankAccount.updateMany({ userId }, { isPrimary: false });
    }

    // Check if this UPI is already registered for this user
    let account = await BankAccount.findOne({ userId, upiId: cleanUpi });
    if (account) {
      account.isPrimary = makePrimary;
      account.bankName = bankName;
      account.accountHolderName = holder;
      await account.save();
      return account;
    }

    account = await BankAccount.create({
      userId,
      accountHolderName: holder,
      bankName,
      accountNumberEncrypted: 'UPI_VPA',
      accountNumberLast4: 'UPI',
      ifsc: 'UPI0000000',
      accountType: 'upi',
      upiId: cleanUpi,
      verificationStatus: 'verified',
      isPrimary: makePrimary
    });

    return account;
  }

  async getAccounts(userId) {
    return await BankAccount.find({ userId })
      .select('-accountNumberEncrypted')
      .sort({ isPrimary: -1, createdAt: -1 });
  }

  async setPrimary(userId, accountId) {
    await BankAccount.updateMany({ userId }, { isPrimary: false });
    const updated = await BankAccount.findOneAndUpdate(
      { _id: accountId, userId },
      { isPrimary: true },
      { new: true }
    ).select('-accountNumberEncrypted');

    if (!updated) throw new Error('Bank account not found');
    return updated;
  }

  async removeAccount(userId, accountId) {
    const deleted = await BankAccount.findOneAndDelete({ _id: accountId, userId });
    if (!deleted) throw new Error('Bank account not found');
    return deleted;
  }
}

module.exports = new BankService();

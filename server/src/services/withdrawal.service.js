const mongoose = require("mongoose");
const GoldWallet = require("../models/GoldWallet");
const BankAccount = require("../models/BankAccount");
const Transaction = require("../models/Transaction");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const { getPagination, getPagingData } = require("../utils/pagination");

const MIN_WITHDRAWAL_AMOUNT = parseFloat(
  process.env.MIN_WITHDRAWAL_AMOUNT || "100",
);

/**
 * Handles the complete cash withdrawal lifecycle:
 *  - Customer requests a withdrawal (funds held/deducted immediately, PENDING)
 *  - Admin approves (settles payout) or rejects (auto-refunds wallet)
 */
class WithdrawalService {
  async getWalletDoc(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    return await GoldWallet.findOneAndUpdate(
      { userId: userObjectId },
      { $setOnInsert: { userId: userObjectId } },
      { new: true, upsert: true },
    );
  }

  genNumber(prefix) {
    return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  /**
   * Resolve the destination payout account.
   * Priority: explicit bankAccountId -> explicit upiId -> user's primary bank -> any bank.
   */
  async resolvePayoutAccount(
    userId,
    { bankAccountId, accountId, bankId, upiId } = {},
  ) {
    const accId = bankAccountId || accountId || bankId;
    if (accId && mongoose.Types.ObjectId.isValid(accId)) {
      const acc = await BankAccount.findOne({ _id: accId, userId });
      if (acc) return acc;
    }

    if (upiId) {
      const cleanUpi = String(upiId).trim();
      const acc = await BankAccount.findOne({ userId, upiId: cleanUpi });
      if (acc) return acc;
      // Ad-hoc UPI not linked as an account
      return {
        _id: null,
        accountType: "upi",
        bankName: "UPI",
        accountHolderName: null,
        accountNumberLast4: "UPI",
        ifsc: "UPI0000000",
        upiId: cleanUpi,
      };
    }

    const primary = await BankAccount.findOne({ userId, isPrimary: true });
    if (primary) return primary;

    const any = await BankAccount.findOne({ userId }).sort({ createdAt: -1 });
    return any;
  }

  async requestWithdrawal(userId, payload = {}) {
    const amount = parseFloat(payload.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      const err = new Error("Please enter a valid withdrawal amount");
      err.statusCode = 400;
      throw err;
    }
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      const err = new Error(
        `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}`,
      );
      err.statusCode = 400;
      throw err;
    }

    const account = await this.resolvePayoutAccount(userId, payload);
    if (!account) {
      const err = new Error(
        "No bank account or UPI ID added. Please add a payout account first.",
      );
      err.statusCode = 400;
      throw err;
    }

    const wallet = await this.getWalletDoc(userId);
    const balanceBefore = parseFloat((wallet.cashBalance || 0).toString());
    if (balanceBefore < amount) {
      const err = new Error(
        `Insufficient wallet balance. Available: ₹${balanceBefore.toFixed(2)}`,
      );
      err.statusCode = 400;
      throw err;
    }

    const payoutMethod =
      (account.accountType || "").toLowerCase() === "upi" ? "UPI" : "BANK";

    // Deduct (hold) funds immediately to prevent double-withdrawal
    const balanceAfter = Math.round((balanceBefore - amount) * 100) / 100;
    wallet.cashBalance = balanceAfter;
    await wallet.save();

    const withdrawal = await Withdrawal.create({
      userId: wallet.userId,
      withdrawalNumber: this.genNumber("WD-"),
      amount,
      status: "PENDING",
      bankAccountId: account._id || null,
      payoutMethod,
      bankName: account.bankName || null,
      accountHolderName: account.accountHolderName || null,
      accountNumberLast4: account.accountNumberLast4 || null,
      ifsc: account.ifsc || null,
      upiId: account.upiId || null,
      balanceBefore,
      balanceAfter,
    });

    const transaction = await Transaction.create({
      userId: wallet.userId,
      transactionNumber: this.genNumber("TXN"),
      metalType: "INR",
      type: "WALLET_DEBIT",
      direction: "DEBIT",
      amount,
      referenceType: "Wallet",
      referenceId: withdrawal._id,
      status: "PENDING",
      description: `Withdrawal request of ₹${amount.toFixed(2)} to ${payoutMethod === "UPI" ? account.upiId : `${account.bankName || "Bank"} ****${account.accountNumberLast4 || ""}`}`,
    });

    withdrawal.transactionId = transaction._id;
    await withdrawal.save();

    return {
      withdrawal,
      cashBalance: balanceAfter,
      message: `Withdrawal request of ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} submitted successfully. It will be credited to your ${payoutMethod === "UPI" ? "UPI" : account.bankName || "bank"} account after verification.`,
    };
  }

  async getUserWithdrawals(
    userId,
    { page = 1, limit = 50, status = "ALL" } = {},
  ) {
    const query = { userId };
    if (status && status.toUpperCase() !== "ALL") {
      query.status = status.toUpperCase();
    }
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

    // Stats are always computed across ALL of the user's withdrawals (ignoring the
    // active status filter) so the summary counts stay complete.
    const [count, docs, statsAgg] = await Promise.all([
      Withdrawal.countDocuments(query),
      Withdrawal.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Withdrawal.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId.toString()) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: { $toDouble: "$amount" } },
          },
        },
      ]),
    ]);

    let pendingCount = 0, pendingAmount = 0, approvedCount = 0, approvedAmount = 0, rejectedCount = 0, rejectedAmount = 0;
    (statsAgg || []).forEach((row) => {
      if (row._id === "PENDING") { pendingCount = row.count; pendingAmount = Math.round(row.totalAmount * 100) / 100; }
      else if (row._id === "APPROVED" || row._id === "PAID") { approvedCount += row.count; approvedAmount += row.totalAmount; }
      else if (row._id === "REJECTED") { rejectedCount = row.count; rejectedAmount = Math.round(row.totalAmount * 100) / 100; }
    });

    const stats = {
      totalWithdrawals: (statsAgg || []).reduce((a, r) => a + r.count, 0),
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount: Math.round(approvedAmount * 100) / 100,
      rejectedCount,
      rejectedAmount,
    };

    const items = docs.map((w) => this.format(w));
    const paged = getPagingData(items, count, pageNum, limitNum);
    return { ...paged, stats };
  }

  format(w) {
    const u = w.userId && w.userId.fullName !== undefined ? w.userId : null;
    const amount = parseFloat((w.amount || 0).toString());
    return {
      id: w._id.toString(),
      withdrawalNumber: w.withdrawalNumber,
      amount: Math.round(amount * 100) / 100,
      status: w.status,
      payoutMethod: w.payoutMethod,
      bankName: w.bankName,
      accountHolderName: w.accountHolderName,
      accountNumberLast4: w.accountNumberLast4,
      ifsc: w.ifsc,
      upiId: w.upiId,
      balanceBefore: parseFloat((w.balanceBefore || 0).toString()),
      balanceAfter: parseFloat((w.balanceAfter || 0).toString()),
      adminNotes: w.adminNotes,
      rejectionReason: w.rejectionReason,
      processedAt: w.processedAt,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      user: u
        ? {
            _id: u._id?.toString?.() || null,
            fullName: u.fullName || "Customer",
            mobile: u.mobile || null,
            email: u.email || null,
          }
        : undefined,
    };
  }

  async getAdminWithdrawals({
    search = "",
    status = "ALL",
    page = 1,
    limit = 10,
  } = {}) {
    const query = {};
    if (status && status.toUpperCase() !== "ALL") {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const s = search.trim();
      const escaped = s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      const matchingUsers = await User.find({
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { mobile: searchRegex },
        ],
      }).select("_id");
      const matchedUserIds = matchingUsers.map((u) => u._id);

      const orConditions = [{ withdrawalNumber: searchRegex }];
      if (matchedUserIds.length > 0)
        orConditions.push({ userId: { $in: matchedUserIds } });
      if (mongoose.Types.ObjectId.isValid(s))
        orConditions.push({ _id: new mongoose.Types.ObjectId(s) });
      query.$and = [...(query.$and || []), { $or: orConditions }];
    }

    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

    const [statsAgg, totalItems, docs] = await Promise.all([
      Withdrawal.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: { $toDouble: "$amount" } },
          },
        },
      ]),
      Withdrawal.countDocuments(query),
      Withdrawal.find(query)
        .populate("userId", "fullName mobile email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const byStatus = {};
    let pendingCount = 0,
      pendingAmount = 0,
      approvedCount = 0,
      approvedAmount = 0,
      rejectedCount = 0,
      rejectedAmount = 0;
    (statsAgg || []).forEach((row) => {
      byStatus[row._id] = {
        count: row.count,
        amount: Math.round(row.totalAmount * 100) / 100,
      };
      if (row._id === "PENDING") {
        pendingCount = row.count;
        pendingAmount = Math.round(row.totalAmount * 100) / 100;
      }
      if (row._id === "APPROVED" || row._id === "PAID") {
        approvedCount += row.count;
        approvedAmount += row.totalAmount;
      }
      if (row._id === "REJECTED") {
        rejectedCount = row.count;
        rejectedAmount = Math.round(row.totalAmount * 100) / 100;
      }
    });

    const stats = {
      totalRequests: (statsAgg || []).reduce((a, r) => a + r.count, 0),
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount: Math.round(approvedAmount * 100) / 100,
      rejectedCount,
      rejectedAmount,
    };

    const items = docs.map((w) => this.format(w));
    const paged = getPagingData(items, totalItems, pageNum, limitNum);
    return { ...paged, stats };
  }

  async approveWithdrawal(withdrawalId, adminId, { adminNotes = "" } = {}) {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      const err = new Error("Withdrawal request not found");
      err.statusCode = 404;
      throw err;
    }
    if (withdrawal.status !== "PENDING") {
      const err = new Error(
        `Withdrawal already ${withdrawal.status.toLowerCase()} and cannot be approved again.`,
      );
      err.statusCode = 400;
      throw err;
    }

    withdrawal.status = "APPROVED";
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();
    withdrawal.adminNotes = adminNotes || null;
    await withdrawal.save();

    if (withdrawal.transactionId) {
      await Transaction.findByIdAndUpdate(withdrawal.transactionId, {
        status: "COMPLETED",
      });
    }

    return this.format(withdrawal);
  }

  async rejectWithdrawal(
    withdrawalId,
    adminId,
    { reason = "", adminNotes = "" } = {},
  ) {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      const err = new Error("Withdrawal request not found");
      err.statusCode = 404;
      throw err;
    }
    if (withdrawal.status === "REJECTED") {
      const err = new Error("Withdrawal is already rejected.");
      err.statusCode = 400;
      throw err;
    }
    if (withdrawal.status === "APPROVED" || withdrawal.status === "PAID") {
      const err = new Error(
        "Approved withdrawals cannot be rejected. Please process a manual reversal.",
      );
      err.statusCode = 400;
      throw err;
    }

    // Refund the held amount back to the wallet
    const wallet = await this.getWalletDoc(withdrawal.userId);
    const amount = parseFloat((withdrawal.amount || 0).toString());
    const current = parseFloat((wallet.cashBalance || 0).toString());
    wallet.cashBalance = Math.round((current + amount) * 100) / 100;
    await wallet.save();

    withdrawal.status = "REJECTED";
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();
    withdrawal.rejectionReason = reason || adminNotes || null;
    withdrawal.adminNotes = adminNotes || null;
    withdrawal.balanceAfter = wallet.cashBalance;
    await withdrawal.save();

    if (withdrawal.transactionId) {
      await Transaction.findByIdAndUpdate(withdrawal.transactionId, {
        status: "REVERSED",
        description: `Withdrawal ${withdrawal.withdrawalNumber} rejected. ₹${amount.toFixed(2)} refunded to wallet.`,
      });
    }

    return this.format(withdrawal);
  }
}

module.exports = new WithdrawalService();

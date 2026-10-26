const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    withdrawalNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
      default: "PENDING",
      index: true,
    },

    // Linked destination bank / UPI account (reference)
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    // Snapshot of payout destination at request time (so history stays accurate even if account is deleted later)
    payoutMethod: {
      type: String,
      enum: ["BANK", "UPI"],
      default: "BANK",
    },
    bankName: { type: String, default: null },
    accountHolderName: { type: String, default: null },
    accountNumberLast4: { type: String, default: null },
    ifsc: { type: String, default: null },
    upiId: { type: String, default: null },

    // Wallet balance snapshot before/after deduction
    balanceBefore: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    balanceAfter: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    // Reference to the WALLET_DEBIT ledger transaction created on request
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    // Admin processing fields
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);

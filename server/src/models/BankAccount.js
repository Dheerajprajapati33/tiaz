const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },

    bankName: {
      type: String,
      default: "UPI Account",
      trim: true,
    },

    accountNumberEncrypted: {
      type: String,
      default: null,
      select: false,
    },

    accountNumberLast4: {
      type: String,
      default: "UPI",
    },

    ifsc: {
      type: String,
      default: "UPI0000000",
      uppercase: true,
      trim: true,
    },

    accountType: {
      type: String,
      enum: ["savings", "current", "upi", "SAVINGS", "CURRENT", "UPI"],
      default: "savings",
      lowercase: true,
      trim: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "verified",
      index: true,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    upiId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BankAccount", bankAccountSchema);

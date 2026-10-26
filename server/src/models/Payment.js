const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldOrder",
      default: null,
    },

    paymentNumber: {
      type: String,
      required: true,
      unique: true,
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    method: {
      type: String,
      enum: ["UPI", "CARD", "NETBANKING", "BANK_TRANSFER", "WALLET", "OTHER"],
      default: "UPI",
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    provider: {
      type: String,
      default: "mock",
    },

    providerPaymentId: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);

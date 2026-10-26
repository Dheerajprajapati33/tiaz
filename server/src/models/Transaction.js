const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Bullion Metal: GOLD or SILVER
    metalType: {
      type: String,
      enum: ["GOLD", "SILVER", "INR"],
      default: "GOLD",
      index: true,
    },

    // Buy / Transaction Category: VIRTUAL (Micro-savings into wallet) or PHYSICAL (Minted bar/coin delivery)
    buyType: {
      type: String,
      enum: ["VIRTUAL", "PHYSICAL"],
      default: "VIRTUAL",
      index: true,
    },

    type: {
      type: String,
      enum: [
        "BUY",
        "SELL",
        "TRANSFER",
        "REDEEM_PHYSICAL",
        "REFERRAL_REWARD",
        "WALLET_CREDIT",
        "WALLET_DEBIT",
      ],
      required: true,
    },

    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    quantity: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    rate: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    goldQuantity: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    goldRate: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    gstAmount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    makingCharges: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0, // ₹0 for VIRTUAL, > 0 for PHYSICAL
    },

    productName: {
      type: String,
      default: null,
    },

    // Delivery info when buyType === 'PHYSICAL'
    deliveryAddress: {
      recipientName: { type: String, default: null },
      recipientPhone: { type: String, default: null },
      addressLine: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      pincode: { type: String, default: null },
    },

    courierPartner: {
      type: String,
      default: null,
    },

    trackingNumber: {
      type: String,
      default: null,
    },

    deliveryStatus: {
      type: String,
      enum: [
        "NOT_APPLICABLE",
        "PROCESSING",
        "MINTING",
        "DISPATCHED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
      default: "NOT_APPLICABLE",
    },

    referenceType: {
      type: String,
      enum: [
        "GoldOrder",
        "SilverOrder",
        "Payment",
        "Referral",
        "Wallet",
        "Other",
      ],
      default: "Other",
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REVERSED"],
      default: "PENDING",
      index: true,
    },

    description: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);

const mongoose = require("mongoose");

const silverOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    // Buy Type: VIRTUAL (Micro-savings / Wallet accumulation) or PHYSICAL (Full payment & Doorstep delivery)
    buyType: {
      type: String,
      enum: ["VIRTUAL", "PHYSICAL"],
      default: "VIRTUAL",
      index: true,
    },

    quantity: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    silverRate: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    grossAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    gstAmount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    makingCharges: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0, // ₹0 for VIRTUAL, minting fee for PHYSICAL coins/bars
    },

    deliveryFee: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    otherCharges: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    finalAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    // Physical Delivery / Minting specifics (Applicable when buyType === 'PHYSICAL')
    productDetails: {
      itemType: { type: String, default: null }, // "COIN", "BAR", "JEWELLERY"
      weightGrams: { type: Number, default: null },
      purity: { type: String, default: "999 Fine (99.9%)" },
      mintPartner: { type: String, default: "MMTC-PAMP" },
      certificateNumber: { type: String, default: null },
    },

    deliveryAddress: {
      recipientName: { type: String, default: null },
      recipientPhone: { type: String, default: null },
      addressLine: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      pincode: { type: String, default: null },
    },

    courierDetails: {
      partner: { type: String, default: null }, // e.g. "Sequel Logistics", "Brinks Secure"
      trackingNumber: { type: String, default: null },
      dispatchedAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "PENDING_CONFIRMATION",
        "PENDING",
        "PLACED",
        "CONFIRMED",
        "ACCEPTED",
        "REJECTED",
        "PAYMENT_PENDING",
        "PROCESSING",
        "MINTING",
        "DISPATCHED",
        "DELIVERED",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "WALLET", "UPI", "RAZORPAY"],
      default: "ONLINE",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "PENDING_ON_DELIVERY", "PAID"],
      default: "PENDING",
      index: true,
    },

    adminNotes: {
      type: String,
      default: null,
    },

    callConfirmed: {
      type: Boolean,
      default: false,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    providerOrderId: {
      type: String,
      default: null,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SilverOrder", silverOrderSchema);

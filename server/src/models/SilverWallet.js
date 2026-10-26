const mongoose = require("mongoose");

const silverWalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    availableSilver: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    virtualSilver: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    physicalSilver: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    lockedSilver: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    rewardPoints: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    cashBalance: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    totalSilverPurchased: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    totalSilverSold: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    totalInvested: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    currentValue: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    averageBuyPrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    profitLoss: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SilverWallet", silverWalletSchema);

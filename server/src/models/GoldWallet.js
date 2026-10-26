const mongoose = require("mongoose");

const goldWalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    availableGold: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    virtualGold: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    physicalGold: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    lockedGold: {
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

    totalGoldPurchased: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    totalGoldSold: {
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
  },
);

module.exports = mongoose.model("GoldWallet", goldWalletSchema);

const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    referralCode: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESSFUL", "REWARDED", "EXPIRED"],
      default: "PENDING",
    },

    rewardAmount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    rewardGold: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },

    rewardedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Referral", referralSchema);

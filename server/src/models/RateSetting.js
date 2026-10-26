const mongoose = require('mongoose');

const rateSettingSchema = new mongoose.Schema(
  {
    goldBuyMarkupPercent: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 50
    },
    goldSellDiscountPercent: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 50
    },
    silverBuyMarkupPercent: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 50
    },
    silverSellDiscountPercent: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 50
    },
    gstPercent: {
      type: Number,
      default: 3.0,
      min: 0,
      max: 28
    },
    // Referral Program Settings
    referralRewardEnabled: {
      type: Boolean,
      default: true
    },
    referralRewardType: {
      type: String,
      enum: ['CASH', 'GOLD', 'SILVER'],
      default: 'CASH'
    },
    referralRewardAmount: {
      type: Number,
      default: 51.0,
      min: 0
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RateSetting', rateSettingSchema);

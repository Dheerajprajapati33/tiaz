const RateSetting = require('../models/RateSetting');

class RateSettingService {
  constructor() {
    this._cachedSettings = null;
    this._cacheTime = 0;
    this._CACHE_TTL = 30 * 1000; // 30 seconds
  }

  async getSettings() {
    const now = Date.now();
    if (this._cachedSettings && (now - this._cacheTime) < this._CACHE_TTL) {
      return this._cachedSettings;
    }

    try {
      let setting = await RateSetting.findOne().lean();
      if (!setting) {
        setting = await RateSetting.create({
          goldBuyMarkupPercent: 5.0,
          goldSellDiscountPercent: 0.0,
          silverBuyMarkupPercent: 5.0,
          silverSellDiscountPercent: 0.0,
          gstPercent: 3.0,
          referralRewardEnabled: true,
          referralRewardType: 'CASH',
          referralRewardAmount: 51.0
        });
        setting = setting.toObject ? setting.toObject() : setting;
      }

      this._cachedSettings = setting;
      this._cacheTime = now;
      return setting;
    } catch (err) {
      // Fallback defaults if DB connection is unavailable
      return {
        goldBuyMarkupPercent: 5.0,
        goldSellDiscountPercent: 0.0,
        silverBuyMarkupPercent: 5.0,
        silverSellDiscountPercent: 0.0,
        gstPercent: 3.0,
        referralRewardEnabled: true,
        referralRewardType: 'CASH',
        referralRewardAmount: 51.0
      };
    }
  }

  async updateSettings(updateData, adminId = null) {
    let setting = await RateSetting.findOne();
    if (!setting) {
      setting = new RateSetting({});
    }

    if (updateData.goldBuyMarkupPercent !== undefined) {
      setting.goldBuyMarkupPercent = Number(updateData.goldBuyMarkupPercent);
    }
    if (updateData.goldSellDiscountPercent !== undefined) {
      setting.goldSellDiscountPercent = Number(updateData.goldSellDiscountPercent);
    }
    if (updateData.silverBuyMarkupPercent !== undefined) {
      setting.silverBuyMarkupPercent = Number(updateData.silverBuyMarkupPercent);
    }
    if (updateData.silverSellDiscountPercent !== undefined) {
      setting.silverSellDiscountPercent = Number(updateData.silverSellDiscountPercent);
    }
    if (updateData.gstPercent !== undefined) {
      setting.gstPercent = Number(updateData.gstPercent);
    }
    if (updateData.referralRewardEnabled !== undefined) {
      setting.referralRewardEnabled = Boolean(updateData.referralRewardEnabled);
    }
    if (updateData.referralRewardType !== undefined) {
      const type = String(updateData.referralRewardType).toUpperCase();
      if (['CASH', 'GOLD', 'SILVER'].includes(type)) {
        setting.referralRewardType = type;
      }
    }
    if (updateData.referralRewardAmount !== undefined) {
      setting.referralRewardAmount = Math.max(0, Number(updateData.referralRewardAmount));
    }
    if (adminId) {
      setting.updatedBy = adminId;
    }

    await setting.save();

    this._cachedSettings = setting.toObject();
    this._cacheTime = Date.now();
    return this._cachedSettings;
  }
}

module.exports = new RateSettingService();

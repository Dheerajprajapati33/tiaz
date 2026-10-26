const rateScraperService = require('./rateScraper.service');
const rateSettingService = require('./rateSetting.service');
const GoldWallet = require('../models/GoldWallet');
const SilverWallet = require('../models/SilverWallet');
const BankAccount = require('../models/BankAccount');

class TradeService {
  /**
   * 1. UNIFIED BUY RATE & CALCULATION API (Gold & Silver)
   * Directly uses rateSettingService for dynamic Admin buy markup %!
   */
  async getBuyRateOrQuote(userId, params = {}) {
    const metalType = (params.metalType || params.metal || 'GOLD').toUpperCase();
    if (!['GOLD', 'SILVER'].includes(metalType)) {
      throw new Error('Invalid metalType. Allowed values: GOLD, SILVER');
    }

    // 1. Fetch Dynamic Admin Rate Settings directly from DB / Cache
    const rateSettings = await rateSettingService.getSettings();
    const buyMarkupPercent = metalType === 'GOLD'
      ? Number(rateSettings.goldBuyMarkupPercent ?? 5.0)
      : Number(rateSettings.silverBuyMarkupPercent ?? 5.0);
    const gstPercent = Number(rateSettings.gstPercent ?? 3.0);

    // 2. Fetch Live Market Benchmark Rate directly from Scraper
    let liveMarketRate = 0;
    let purity = '';
    if (metalType === 'GOLD') {
      const liveGold = rateScraperService.getLiveGoldRates();
      liveMarketRate = liveGold.gold24k;
      purity = '24K Gold (99.9%)';
    } else {
      const liveSilver = rateScraperService.getLiveSilverRates();
      liveMarketRate = liveSilver.silver999;
      purity = '999 Fine Silver (99.9%)';
    }

    // 3. Calculate Dynamic Buy Price with Admin Markup applied
    const buyMultiplier = 1 + (buyMarkupPercent / 100);
    const buyPricePerGram = Math.round((liveMarketRate * buyMultiplier) * 100) / 100;

    const { amount, grams } = params;
    const hasInput = (amount !== undefined && amount !== null && amount !== '') ||
                     (grams !== undefined && grams !== null && grams !== '');

    // Case A: Just querying rates (no grams or amount provided)
    if (!hasInput) {
      const presetAmounts = metalType === 'GOLD' ? [500, 1000, 2000, 5000] : [500, 1000, 2000, 5000, 10000];
      const presets = presetAmounts.map(amt => {
        const g = parseFloat((amt / buyPricePerGram).toFixed(4));
        return {
          amount: amt,
          formattedAmount: `₹${amt}`,
          grams: g,
          formattedGrams: `${g} gm`
        };
      });

      return {
        metalType,
        purity,
        liveRatePerGram: liveMarketRate,
        formattedLiveRate: `₹${liveMarketRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })} /gm`,
        buyPricePerGram,
        formattedBuyPrice: `₹${buyPricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2 })} /gm (+${buyMarkupPercent}%)`,
        markupPercentage: buyMarkupPercent,
        gstPercentage: gstPercent,
        presets,
        message: 'Enter amount (₹) or grams to calculate final payable value'
      };
    }

    // Case B: Calculating full breakdown
    let calculatedGrams = 0;
    let totalPayable = 0;
    let grossAmount = 0;
    let gstAmount = 0;
    const gstRateDecimal = gstPercent / 100;

    if (amount) {
      totalPayable = Math.round(parseFloat(amount) * 100) / 100;
      if (totalPayable < 10) throw new Error('Minimum buy amount is ₹10');
      gstAmount = Math.round(totalPayable * gstRateDecimal * 100) / 100;
      grossAmount = Math.round((totalPayable - gstAmount) * 100) / 100;
      calculatedGrams = parseFloat((totalPayable / buyPricePerGram).toFixed(4));
    } else if (grams) {
      calculatedGrams = parseFloat(parseFloat(grams).toFixed(4));
      if (calculatedGrams <= 0) throw new Error('Weight must be greater than zero');
      grossAmount = Math.round(calculatedGrams * buyPricePerGram * 100) / 100;
      gstAmount = Math.round(grossAmount * gstRateDecimal * 100) / 100;
      totalPayable = Math.round((grossAmount + gstAmount) * 100) / 100;
    }

    // Fetch user wallet cash balance if authenticated
    let cashBalance = 0;
    if (userId) {
      const wallet = await GoldWallet.findOne({ userId });
      if (wallet && wallet.cashBalance) {
        cashBalance = parseFloat(wallet.cashBalance.toString());
      }
    }

    return {
      metalType,
      purity,
      liveRatePerGram: liveMarketRate,
      formattedLiveRate: `₹${liveMarketRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })} /gm`,
      buyPricePerGram,
      formattedBuyPrice: `₹${buyPricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2 })} /gm (+${buyMarkupPercent}%)`,
      markupPercentage: buyMarkupPercent,
      gstPercentage: gstPercent,
      grams: calculatedGrams,
      formattedGrams: `${calculatedGrams.toFixed(4)} gm`,
      grossAmount,
      formattedGross: `₹${grossAmount.toFixed(2)}`,
      gstAmount,
      formattedGst: `₹${gstAmount.toFixed(2)}`,
      totalPayable,
      buyValue: totalPayable,
      buyGoldValue: metalType === 'GOLD' ? totalPayable : undefined,
      buySilverValue: metalType === 'SILVER' ? totalPayable : undefined,
      formattedTotalPayable: `₹${totalPayable.toFixed(2)}`,
      walletBalance: cashBalance,
      isWalletSufficient: cashBalance >= totalPayable
    };
  }

  /**
   * 2. UNIFIED SELL RATE & CALCULATION API (Gold & Silver)
   * Directly uses rateSettingService for dynamic Admin sell discount %!
   */
  async getSellRateOrQuote(userId, params = {}) {
    const metalType = (params.metalType || params.metal || 'GOLD').toUpperCase();
    if (!['GOLD', 'SILVER'].includes(metalType)) {
      throw new Error('Invalid metalType. Allowed values: GOLD, SILVER');
    }

    // 1. Fetch Dynamic Admin Rate Settings directly from DB / Cache
    const rateSettings = await rateSettingService.getSettings();
    const sellDiscountPercent = metalType === 'GOLD'
      ? Number(rateSettings.goldSellDiscountPercent ?? 0.0)
      : Number(rateSettings.silverSellDiscountPercent ?? 0.0);

    // 2. Fetch Live Market Benchmark Rate directly from Scraper
    let liveMarketRate = 0;
    let purity = '';
    if (metalType === 'GOLD') {
      const liveGold = rateScraperService.getLiveGoldRates();
      liveMarketRate = liveGold.gold24k;
      purity = '24K Gold (99.9%)';
    } else {
      const liveSilver = rateScraperService.getLiveSilverRates();
      liveMarketRate = liveSilver.silver999;
      purity = '999 Fine Silver (99.9%)';
    }

    // 3. Calculate Dynamic Sell Price with Admin Discount applied
    const sellMultiplier = 1 - (sellDiscountPercent / 100);
    const sellPricePerGram = Math.round((liveMarketRate * sellMultiplier) * 100) / 100;

    // 4. Fetch User Holdings & Verified Bank Accounts
    let availableHoldings = 0;
    let verifiedBanks = [];
    if (userId) {
      const [wallet, banks] = await Promise.all([
        metalType === 'GOLD' ? GoldWallet.findOne({ userId }) : SilverWallet.findOne({ userId }),
        BankAccount.find({ userId, verificationStatus: 'verified' }).select('-accountNumberEncrypted')
      ]);
      if (wallet) {
        availableHoldings = metalType === 'GOLD'
          ? parseFloat((wallet.availableGold || 0).toString())
          : parseFloat((wallet.availableSilver || 0).toString());
      }
      verifiedBanks = banks || [];
    }

    const estimatedTotalHoldingsValue = Math.round(availableHoldings * sellPricePerGram * 100) / 100;

    const { grams, amount } = params;
    const hasInput = (grams !== undefined && grams !== null && grams !== '') ||
                     (amount !== undefined && amount !== null && amount !== '');

    // Case A: Just querying sell rates and holdings
    if (!hasInput) {
      return {
        metalType,
        purity,
        liveRatePerGram: liveMarketRate,
        formattedLiveRate: `₹${liveMarketRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })} /gm`,
        sellPricePerGram,
        formattedSellPrice: `₹${sellPricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2 })} /gm${sellDiscountPercent > 0 ? ` (-${sellDiscountPercent}%)` : ' (Actual)'}`,
        discountPercentage: sellDiscountPercent,
        availableGrams: availableHoldings,
        formattedAvailableGrams: `${availableHoldings.toFixed(4)} gm`,
        estimatedTotalValue: estimatedTotalHoldingsValue,
        formattedEstimatedTotalValue: `₹${estimatedTotalHoldingsValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        bankAccounts: verifiedBanks,
        message: 'Enter grams or amount to calculate liquidation payout'
      };
    }

    // Case B: Calculating sell liquidation payout
    let sellGrams = 0;
    let netPayout = 0;

    if (grams) {
      sellGrams = parseFloat(parseFloat(grams).toFixed(4));
      if (sellGrams <= 0) throw new Error('Sell quantity must be greater than zero');
      netPayout = Math.round(sellGrams * sellPricePerGram * 100) / 100;
    } else if (amount) {
      netPayout = Math.round(parseFloat(amount) * 100) / 100;
      if (netPayout < 1) throw new Error('Minimum sell amount is ₹1');
      sellGrams = parseFloat((netPayout / sellPricePerGram).toFixed(4));
    }

    return {
      metalType,
      purity,
      liveRatePerGram: liveMarketRate,
      formattedLiveRate: `₹${liveMarketRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })} /gm`,
      sellPricePerGram,
      formattedSellPrice: `₹${sellPricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2 })} /gm${sellDiscountPercent > 0 ? ` (-${sellDiscountPercent}%)` : ' (Actual)'}`,
      discountPercentage: sellDiscountPercent,
      sellGrams,
      formattedGrams: `${sellGrams.toFixed(4)} gm`,
      netPayout,
      sellValue: netPayout,
      sellGoldValue: metalType === 'GOLD' ? netPayout : undefined,
      sellSilverValue: metalType === 'SILVER' ? netPayout : undefined,
      formattedNetPayout: `₹${netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      availableGrams: availableHoldings,
      formattedAvailableGrams: `${availableHoldings.toFixed(4)} gm`,
      hasSufficientBalance: availableHoldings >= sellGrams,
      bankAccounts: verifiedBanks
    };
  }
}

module.exports = new TradeService();

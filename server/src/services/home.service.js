const mongoose = require('mongoose');
const User = require('../models/User');
const GoldWallet = require('../models/GoldWallet');
const GoldOrder = require('../models/GoldOrder');
const SilverWallet = require('../models/SilverWallet');
const SilverOrder = require('../models/SilverOrder');
const Notification = require('../models/Notification');
const rateScraperService = require('./rateScraper.service');

class HomeService {
  async getHomeScreenData(userId, period = 'all_time') {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    // 1. Fetch User Info & Unread Notification count
    const [user, unreadNotificationsCount] = await Promise.all([
      User.findById(userObjectId).select('fullName mobile profileImage isProfileComplete'),
      Notification.countDocuments({ userId: userObjectId, isRead: false })
    ]);

    if (!user) throw new Error('User not found');

    // 2. Fetch Live Gold Rate (24K) directly from in-memory scraper
    const liveGold = rateScraperService.getLiveGoldRates();
    const currentPricePerGram = liveGold.gold24k;
    const buyPrice24k = Math.round(currentPricePerGram * 1.05 * 100) / 100; // 5% markup on purchase
    const sellPrice24k = currentPricePerGram; // Actual value on sell
    const rateDiff = liveGold.change24k;
    const rateDiffPercent = liveGold.changePercentage24k;

    const liveRateCard = {
      purity: '24K',
      badge: '24K GOLD RATE • LIVE',
      actualPricePerGram: currentPricePerGram,
      buyPricePerGram: buyPrice24k,
      sellPricePerGram: sellPrice24k,
      pricePerGram: currentPricePerGram,
      buyMarkupPercentage: 5.0,
      formattedPrice: `₹${currentPricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
      formattedBuyPrice: `₹${buyPrice24k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (+5%)`,
      formattedSellPrice: `₹${sellPrice24k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (Actual)`,
      changeAmount: Math.round(rateDiff * 100) / 100,
      changePercentage: Math.round(rateDiffPercent * 100) / 100,
      isPositive: rateDiff >= 0,
      formattedChange: `${rateDiff >= 0 ? '+' : ''}₹${Math.abs(rateDiff).toFixed(2)} (${Math.abs(rateDiffPercent).toFixed(2)}%) ${rateDiff >= 0 ? '↗' : '↘'}`,
      timestamp: liveGold.updatedAt,
      currency: 'INR'
    };

    // 3. Fetch Live Silver Rate (999 Fine) directly from in-memory scraper
    const liveSilver = rateScraperService.getLiveSilverRates();
    const currentSilverPrice = liveSilver.silver999;
    const buySilverPrice = Math.round(currentSilverPrice * 1.05 * 100) / 100; // 5% markup on purchase
    const sellSilverPrice = currentSilverPrice; // Actual value on sell
    const silverDiff = liveSilver.change999;
    const silverDiffPercent = liveSilver.changePercentage999;

    const liveSilverRateCard = {
      purity: '999 Fine',
      badge: '999 SILVER RATE • LIVE',
      actualPricePerGram: currentSilverPrice,
      buyPricePerGram: buySilverPrice,
      sellPricePerGram: sellSilverPrice,
      pricePerGram: currentSilverPrice,
      pricePerKg: Math.round(currentSilverPrice * 1000 * 100) / 100,
      buyMarkupPercentage: 5.0,
      formattedPrice: `₹${currentSilverPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
      formattedBuyPrice: `₹${buySilverPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (+5%)`,
      formattedSellPrice: `₹${sellSilverPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (Actual)`,
      formattedPriceKg: `₹${Math.round(currentSilverPrice * 1000).toLocaleString('en-IN')} /kg`,
      changeAmount: Math.round(silverDiff * 100) / 100,
      changePercentage: Math.round(silverDiffPercent * 100) / 100,
      isPositive: silverDiff >= 0,
      formattedChange: `${silverDiff >= 0 ? '+' : ''}₹${Math.abs(silverDiff).toFixed(2)} (${Math.abs(silverDiffPercent).toFixed(2)}%) ${silverDiff >= 0 ? '↗' : '↘'}`,
      timestamp: liveSilver.updatedAt,
      currency: 'INR'
    };

    // 4. User Wallets (Gold Wallet & Silver Wallet)
    const [goldWallet, silverWallet] = await Promise.all([
      GoldWallet.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true }
      ),
      SilverWallet.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true }
      )
    ]);

    const availableGold = parseFloat((goldWallet.availableGold || 0).toString());
    const availableSilver = parseFloat((silverWallet.availableSilver || 0).toString());
    const rewardPoints = parseFloat((goldWallet.rewardPoints || 0).toString());
    const cashBalance = parseFloat((goldWallet.cashBalance || 0).toString());

    const goldCurrentValue = Math.round(availableGold * currentPricePerGram * 100) / 100;
    const silverCurrentValue = Math.round(availableSilver * currentSilverPrice * 100) / 100;
    const pointsCashValue = Math.round((rewardPoints / 10) * 100) / 100; // 10 points = ₹1
    const totalHoldingsValue = Math.round((goldCurrentValue + silverCurrentValue) * 100) / 100;

    const myWallet = {
      cashBalance: {
        amount: cashBalance,
        formattedAmount: `₹${cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      goldBalance: {
        grams: availableGold,
        formattedGrams: `${availableGold.toFixed(4)} gm`,
        value: goldCurrentValue,
        formattedValue: `₹${goldCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      silverBalance: {
        grams: availableSilver,
        formattedGrams: `${availableSilver.toFixed(4)} gm`,
        value: silverCurrentValue,
        formattedValue: `₹${silverCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      pointsBalance: {
        points: rewardPoints,
        formattedPoints: rewardPoints.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        value: pointsCashValue,
        formattedValue: `₹${pointsCashValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      totalHoldingsValue,
      formattedTotalHoldingsValue: `₹${totalHoldingsValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };

    // 5. Your Gold Overview (Profit / Loss & Performance Chart)
    const goldTotalInvested = parseFloat((goldWallet.totalInvested || 0).toString());
    const goldProfitLossAmount = goldCurrentValue - goldTotalInvested;
    const goldProfitLossPercentage = goldTotalInvested > 0 ? (goldProfitLossAmount / goldTotalInvested) * 100 : 0;

    const goldHighRate = Math.round((currentPricePerGram + 33.10) * 100) / 100;
    const goldLowRate = Math.round((currentPricePerGram - 1188.10) * 100) / 100;

    let goldTrendPoints = [];
    const p = (period || 'all_time').toLowerCase();
    if (p === '1d') {
      goldTrendPoints = [
        { label: '09:00', value: Math.round((currentPricePerGram - 15) * 100) / 100 },
        { label: '12:00', value: Math.round((currentPricePerGram - 5) * 100) / 100 },
        { label: '15:00', value: Math.round((currentPricePerGram + 10) * 100) / 100 },
        { label: '18:00', value: Math.round((currentPricePerGram + 25) * 100) / 100 },
        { label: 'Live', value: currentPricePerGram }
      ];
    } else if (p === '1w') {
      goldTrendPoints = [
        { label: 'Mon', value: Math.round((currentPricePerGram * 0.985) * 100) / 100 },
        { label: 'Tue', value: Math.round((currentPricePerGram * 0.990) * 100) / 100 },
        { label: 'Wed', value: Math.round((currentPricePerGram * 0.988) * 100) / 100 },
        { label: 'Thu', value: Math.round((currentPricePerGram * 0.995) * 100) / 100 },
        { label: 'Fri', value: Math.round((currentPricePerGram * 0.998) * 100) / 100 },
        { label: 'Sat', value: Math.round((currentPricePerGram * 0.999) * 100) / 100 },
        { label: 'Sun', value: currentPricePerGram }
      ];
    } else if (p === '1m') {
      goldTrendPoints = [
        { label: 'Week 1', value: Math.round((currentPricePerGram * 0.96) * 100) / 100 },
        { label: 'Week 2', value: Math.round((currentPricePerGram * 0.975) * 100) / 100 },
        { label: 'Week 3', value: Math.round((currentPricePerGram * 0.985) * 100) / 100 },
        { label: 'Week 4', value: currentPricePerGram }
      ];
    } else {
      goldTrendPoints = [
        { label: 'Jan', value: Math.round(currentPricePerGram * 0.88) },
        { label: 'Mar', value: Math.round(currentPricePerGram * 0.91) },
        { label: 'May', value: Math.round(currentPricePerGram * 0.94) },
        { label: 'Jul', value: Math.round(currentPricePerGram * 0.97) },
        { label: 'Sep', value: currentPricePerGram }
      ];
    }

    const goldOverview = {
      period: period || 'all_time',
      totalInvested: goldTotalInvested,
      formattedTotalInvested: `₹${goldTotalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      currentValue: goldCurrentValue,
      formattedCurrentValue: `₹${goldCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      profitLoss: {
        amount: Math.round(goldProfitLossAmount * 100) / 100,
        percentage: Math.round(goldProfitLossPercentage * 100) / 100,
        isProfit: goldProfitLossAmount >= 0,
        formatted: `${goldProfitLossAmount >= 0 ? '+' : '-'}₹${Math.abs(goldProfitLossAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${Math.abs(goldProfitLossPercentage).toFixed(2)}%)`
      },
      chart: {
        high: goldHighRate,
        formattedHigh: `₹${goldHighRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        low: goldLowRate,
        formattedLow: `₹${goldLowRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        trendPoints: goldTrendPoints
      }
    };

    // 6. Your Silver Overview (Profit / Loss & Performance Chart)
    const silverTotalInvested = parseFloat((silverWallet.totalInvested || 0).toString());
    const silverProfitLossAmount = silverCurrentValue - silverTotalInvested;
    const silverProfitLossPercentage = silverTotalInvested > 0 ? (silverProfitLossAmount / silverTotalInvested) * 100 : 0;

    const silverHighRate = Math.round((currentSilverPrice + 3.50) * 100) / 100;
    const silverLowRate = Math.round((currentSilverPrice - 4.20) * 100) / 100;

    let silverTrendPoints = [];
    if (p === '1d') {
      silverTrendPoints = [
        { label: '09:00', value: Math.round((currentSilverPrice - 0.40) * 100) / 100 },
        { label: '12:00', value: Math.round((currentSilverPrice - 0.15) * 100) / 100 },
        { label: '15:00', value: Math.round((currentSilverPrice + 0.20) * 100) / 100 },
        { label: '18:00', value: Math.round((currentSilverPrice + 0.50) * 100) / 100 },
        { label: 'Live', value: currentSilverPrice }
      ];
    } else if (p === '1w') {
      silverTrendPoints = [
        { label: 'Mon', value: Math.round((currentSilverPrice * 0.982) * 100) / 100 },
        { label: 'Tue', value: Math.round((currentSilverPrice * 0.988) * 100) / 100 },
        { label: 'Wed', value: Math.round((currentSilverPrice * 0.985) * 100) / 100 },
        { label: 'Thu', value: Math.round((currentSilverPrice * 0.993) * 100) / 100 },
        { label: 'Fri', value: Math.round((currentSilverPrice * 0.997) * 100) / 100 },
        { label: 'Sat', value: Math.round((currentSilverPrice * 0.999) * 100) / 100 },
        { label: 'Sun', value: currentSilverPrice }
      ];
    } else if (p === '1m') {
      silverTrendPoints = [
        { label: 'Week 1', value: Math.round((currentSilverPrice * 0.955) * 100) / 100 },
        { label: 'Week 2', value: Math.round((currentSilverPrice * 0.970) * 100) / 100 },
        { label: 'Week 3', value: Math.round((currentSilverPrice * 0.985) * 100) / 100 },
        { label: 'Week 4', value: currentSilverPrice }
      ];
    } else {
      silverTrendPoints = [
        { label: 'Jan', value: Math.round(currentSilverPrice * 0.85 * 100) / 100 },
        { label: 'Mar', value: Math.round(currentSilverPrice * 0.89 * 100) / 100 },
        { label: 'May', value: Math.round(currentSilverPrice * 0.92 * 100) / 100 },
        { label: 'Jul', value: Math.round(currentSilverPrice * 0.96 * 100) / 100 },
        { label: 'Sep', value: currentSilverPrice }
      ];
    }

    const silverOverview = {
      period: period || 'all_time',
      totalInvested: silverTotalInvested,
      formattedTotalInvested: `₹${silverTotalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      currentValue: silverCurrentValue,
      formattedCurrentValue: `₹${silverCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      profitLoss: {
        amount: Math.round(silverProfitLossAmount * 100) / 100,
        percentage: Math.round(silverProfitLossPercentage * 100) / 100,
        isProfit: silverProfitLossAmount >= 0,
        formatted: `${silverProfitLossAmount >= 0 ? '+' : '-'}₹${Math.abs(silverProfitLossAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${Math.abs(silverProfitLossPercentage).toFixed(2)}%)`
      },
      chart: {
        high: silverHighRate,
        formattedHigh: `₹${silverHighRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        low: silverLowRate,
        formattedLow: `₹${silverLowRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        trendPoints: silverTrendPoints
      }
    };

    // 7. Recent Gold Purchases (Array of up to 5 completed purchases)
    const recentPurchaseOrders = await GoldOrder.find({
      userId: userObjectId,
      type: 'BUY',
      status: 'COMPLETED'
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPurchases = recentPurchaseOrders.map((order) => {
      const orderQty = parseFloat(order.quantity.toString());
      const orderRate = parseFloat(order.goldRate.toString());
      const totalAmount = parseFloat(order.totalAmount ? order.totalAmount.toString() : (orderQty * orderRate).toString());
      const gainAmount = (currentPricePerGram - orderRate) * orderQty;
      const gainPercentage = orderRate > 0 ? ((currentPricePerGram - orderRate) / orderRate) * 100 : 0;

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        metalType: 'GOLD',
        grams: orderQty,
        formattedGrams: `${orderQty.toFixed(4)} gm`,
        purity: '24K Gold',
        ratePerGram: orderRate,
        formattedRate: `₹${orderRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        totalAmount,
        formattedTotalAmount: `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        purchaseDate: order.createdAt,
        gainAmount: Math.round(gainAmount * 100) / 100,
        gainPercentage: Math.round(gainPercentage * 100) / 100,
        formattedGain: `${gainAmount >= 0 ? '+' : '-'}₹${Math.abs(gainAmount).toFixed(2)} (${Math.abs(gainPercentage).toFixed(2)}%)`
      };
    });

    // 8. Recent Silver Purchases (Array of up to 5 completed purchases)
    const recentSilverPurchaseOrders = await SilverOrder.find({
      userId: userObjectId,
      type: 'BUY',
      status: 'COMPLETED'
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentSilverPurchases = recentSilverPurchaseOrders.map((order) => {
      const orderQty = parseFloat(order.quantity.toString());
      const orderRate = parseFloat(order.silverRate.toString());
      const totalAmount = parseFloat(order.finalAmount ? order.finalAmount.toString() : (orderQty * orderRate).toString());
      const gainAmount = (currentSilverPrice - orderRate) * orderQty;
      const gainPercentage = orderRate > 0 ? ((currentSilverPrice - orderRate) / orderRate) * 100 : 0;

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        metalType: 'SILVER',
        grams: orderQty,
        formattedGrams: `${orderQty.toFixed(4)} gm`,
        purity: '999 Fine Silver',
        ratePerGram: orderRate,
        formattedRate: `₹${orderRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        totalAmount,
        formattedTotalAmount: `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        purchaseDate: order.createdAt,
        gainAmount: Math.round(gainAmount * 100) / 100,
        gainPercentage: Math.round(gainPercentage * 100) / 100,
        formattedGain: `${gainAmount >= 0 ? '+' : '-'}₹${Math.abs(gainAmount).toFixed(2)} (${Math.abs(gainPercentage).toFixed(2)}%)`
      };
    });

    return {
      header: {
        appName: "Tia'z",
        unreadNotificationsCount,
        user: {
          _id: user._id,
          fullName: user.fullName,
          profileImage: user.profileImage
        }
      },
      liveGoldRate: liveRateCard,
      liveSilverRate: liveSilverRateCard,
      myWallet,
      goldOverview,
      silverOverview,
      recentPurchases, // preserved for backward compatibility
      recentGoldPurchases: recentPurchases,
      recentSilverPurchases
    };
  }
}

module.exports = new HomeService();

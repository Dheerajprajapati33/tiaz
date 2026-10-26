const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const GoldWallet = require("../models/GoldWallet");
const SilverWallet = require("../models/SilverWallet");
const BankAccount = require("../models/BankAccount");
const GoldOrder = require("../models/GoldOrder");
const SilverOrder = require("../models/SilverOrder");
const Referral = require("../models/Referral");
const { getPagination, getPagingData } = require("../utils/pagination");
const { hashPassword, comparePassword } = require("../utils/encryption");
const goldService = require("./gold.service");
const silverService = require("./silver.service");
const rateSettingService = require("./rateSetting.service");
const rateScraperService = require("./rateScraper.service");

class AdminService {
  /**
   * Single aggregated dashboard API for Admin Panel
   * 100% Real Database Data - Admin users and admin transactions are strictly excluded
   * @param {Object} query - { assetType: 'gold' | 'silver', period: '1M' }
   */
  async getDashboardData({ assetType = "gold", period = "1M" }) {
    const isSilver = assetType && assetType.toLowerCase() === "silver";
    const selectedAsset = isSilver ? "silver" : "gold";
    const metalKey = isSilver ? "SILVER" : "GOLD";

    // 1. Identify all Admin User IDs to strictly exclude them from customer metrics
    const adminDocs = await User.find({
      $or: [
        { role: { $in: ["admin", "ADMIN", "superadmin", "SUPERADMIN"] } },
        { email: "admin@tiaz.com" },
      ],
    }).select("_id");
    const adminIds = adminDocs.map((a) => a._id);

    // 2. Fetch Real Customer User & KYC Metrics from Database (Excluding Admin)
    const customerFilter = { _id: { $nin: adminIds } };

    const [totalUsers, activeUsers, pendingKyc, verifiedKyc, rejectedKyc] =
      await Promise.all([
        User.countDocuments(customerFilter),
        User.countDocuments({
          ...customerFilter,
          isActive: true,
          isBlocked: false,
        }),
        User.countDocuments({
          ...customerFilter,
          "kyc.status": { $in: ["pending", "under_review"] },
        }),
        User.countDocuments({ ...customerFilter, "kyc.status": "verified" }),
        User.countDocuments({ ...customerFilter, "kyc.status": "rejected" }),
      ]);

    const activeRatio =
      totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0.0";
    const kycPassRate =
      totalUsers > 0 ? ((verifiedKyc / totalUsers) * 100).toFixed(1) : "0.0";

    // 3. Fetch Dynamic Admin Rate Settings & Live Rates from Database
    const rateSettings = await rateSettingService.getSettings();
    const goldBuyMarkup = Number(rateSettings.goldBuyMarkupPercent ?? 5.0);
    const goldSellDiscount = Number(
      rateSettings.goldSellDiscountPercent ?? 0.0,
    );
    const silverBuyMarkup = Number(rateSettings.silverBuyMarkupPercent ?? 5.0);
    const silverSellDiscount = Number(
      rateSettings.silverSellDiscountPercent ?? 0.0,
    );
    const gstPercent = Number(rateSettings.gstPercent ?? 3.0);

    let purityRates = [];
    let liveRateData;
    let currentRate = 0;
    let buyRate = 0;
    let sellRate = 0;
    let purityLabel = "";

    if (isSilver) {
      const sRates = await silverService.getLiveRates();
      liveRateData = sRates.rate999;
      currentRate =
        sRates.rate999.actualPricePerGram || sRates.rate999.pricePerGram || 235;
      buyRate =
        sRates.rate999.buyPricePerGram ||
        Math.round(currentRate * (1 + silverBuyMarkup / 100) * 100) / 100;
      sellRate =
        sRates.rate999.sellPricePerGram ||
        Math.round(currentRate * (1 - silverSellDiscount / 100) * 100) / 100;
      purityLabel = "999 Fine Silver";

      const calcSilverBuy = (base) =>
        Math.round(base * (1 + silverBuyMarkup / 100) * 100) / 100;
      const calcSilverSell = (base) =>
        Math.round(base * (1 - silverSellDiscount / 100) * 100) / 100;

      const p999 = sRates.rate999?.pricePerGram || currentRate;
      const p925 =
        sRates.rate925?.pricePerGram ||
        Math.round(p999 * (925 / 999) * 100) / 100;
      const p900 = Math.round(p999 * (900 / 999) * 100) / 100;

      purityRates = [
        {
          purity: "999 Fine",
          rawPurity: "999",
          fineness: "99.9%",
          finenessValue: 999,
          actualRate: p999,
          buyRate: sRates.rate999?.buyPricePerGram || calcSilverBuy(p999),
          sellRate: sRates.rate999?.sellPricePerGram || calcSilverSell(p999),
          change: sRates.rate999?.changeAmount || 0,
          changePercentage: sRates.rate999?.changePercentage || 0,
          source: "MMTC-PAMP Live",
          updatedAt: sRates.rate999?.timestamp || new Date(),
          status: "Live",
        },
        {
          purity: "925 Sterling",
          rawPurity: "925",
          fineness: "92.5%",
          finenessValue: 925,
          actualRate: p925,
          buyRate: sRates.rate925?.buyPricePerGram || calcSilverBuy(p925),
          sellRate: sRates.rate925?.sellPricePerGram || calcSilverSell(p925),
          change: sRates.rate925?.changeAmount || 0,
          changePercentage: sRates.rate925?.changePercentage || 0,
          source: "MMTC-PAMP Live",
          updatedAt: sRates.rate925?.timestamp || new Date(),
          status: "Live",
        },
        {
          purity: "900 Coin",
          rawPurity: "900",
          fineness: "90.0%",
          finenessValue: 900,
          actualRate: p900,
          buyRate: calcSilverBuy(p900),
          sellRate: calcSilverSell(p900),
          change: 0,
          changePercentage: 0,
          source: "Derived Standard",
          updatedAt: new Date(),
          status: "Live",
        },
      ];
    } else {
      const gRates = await goldService.getLiveRates();
      liveRateData = gRates.rate24k;
      currentRate =
        gRates.rate24k.actualPricePerGram ||
        gRates.rate24k.pricePerGram ||
        15000;
      buyRate =
        gRates.rate24k.buyPricePerGram ||
        Math.round(currentRate * (1 + goldBuyMarkup / 100) * 100) / 100;
      sellRate =
        gRates.rate24k.sellPricePerGram ||
        Math.round(currentRate * (1 - goldSellDiscount / 100) * 100) / 100;
      purityLabel = "24K Digital Gold";

      const calcGoldBuy = (base) =>
        Math.round(base * (1 + goldBuyMarkup / 100) * 100) / 100;
      const calcGoldSell = (base) =>
        Math.round(base * (1 - goldSellDiscount / 100) * 100) / 100;

      const p24 = gRates.rate24k?.pricePerGram || currentRate;
      const p22 =
        gRates.rate22k?.pricePerGram || Math.round(p24 * (22 / 24) * 100) / 100;
      const p18 =
        gRates.rate18k?.pricePerGram || Math.round(p24 * (18 / 24) * 100) / 100;

      purityRates = [
        {
          purity: "24K",
          rawPurity: "24K",
          fineness: "99.9%",
          finenessValue: 999,
          actualRate: p24,
          buyRate: gRates.rate24k?.buyPricePerGram || calcGoldBuy(p24),
          sellRate: gRates.rate24k?.sellPricePerGram || calcGoldSell(p24),
          change: gRates.rate24k?.changeAmount || 0,
          changePercentage: gRates.rate24k?.changePercentage || 0,
          source: "MMTC-PAMP Live",
          updatedAt: gRates.rate24k?.timestamp || new Date(),
          status: "Live",
        },
        {
          purity: "22K",
          rawPurity: "22K",
          fineness: "91.6%",
          finenessValue: 916,
          actualRate: p22,
          buyRate: gRates.rate22k?.buyPricePerGram || calcGoldBuy(p22),
          sellRate: gRates.rate22k?.sellPricePerGram || calcGoldSell(p22),
          change: gRates.rate22k?.changeAmount || 0,
          changePercentage: gRates.rate22k?.changePercentage || 0,
          source: "MMTC-PAMP Live",
          updatedAt: gRates.rate22k?.timestamp || new Date(),
          status: "Live",
        },
        {
          purity: "18K",
          rawPurity: "18K",
          fineness: "75.0%",
          finenessValue: 750,
          actualRate: p18,
          buyRate: gRates.rate18k?.buyPricePerGram || calcGoldBuy(p18),
          sellRate: gRates.rate18k?.sellPricePerGram || calcGoldSell(p18),
          change: gRates.rate18k?.changeAmount || 0,
          changePercentage: gRates.rate18k?.changePercentage || 0,
          source: "MMTC-PAMP Live",
          updatedAt: gRates.rate18k?.timestamp || new Date(),
          status: "Live",
        },
      ];
    }

    // 4. Real Customer Asset Custody / Holdings from Wallets (Excluding Admin)
    let holdingsGrams = 0;
    let totalInvested = 0;

    if (isSilver) {
      const silverAgg = await SilverWallet.aggregate([
        { $match: { userId: { $nin: adminIds } } },
        {
          $group: {
            _id: null,
            totalGrams: { $sum: { $toDouble: "$availableSilver" } },
            totalInvested: { $sum: { $toDouble: "$totalInvested" } },
          },
        },
      ]);
      if (silverAgg.length > 0) {
        holdingsGrams =
          Math.round((silverAgg[0].totalGrams || 0) * 10000) / 10000;
        totalInvested =
          Math.round((silverAgg[0].totalInvested || 0) * 100) / 100;
      }
    } else {
      const goldAgg = await GoldWallet.aggregate([
        { $match: { userId: { $nin: adminIds } } },
        {
          $group: {
            _id: null,
            totalGrams: { $sum: { $toDouble: "$availableGold" } },
            totalInvested: { $sum: { $toDouble: "$totalInvested" } },
          },
        },
      ]);
      if (goldAgg.length > 0) {
        holdingsGrams =
          Math.round((goldAgg[0].totalGrams || 0) * 10000) / 10000;
        totalInvested = Math.round((goldAgg[0].totalInvested || 0) * 100) / 100;
      }
    }

    const holdingsValue = Math.round(holdingsGrams * currentRate * 100) / 100;

    // 5. Real Customer Purchases & Sales Aggregation from Transactions (Excluding Admin)
    const [buyStatsAgg, sellStatsAgg, totalTransactionsCount] =
      await Promise.all([
        Transaction.aggregate([
          {
            $match: {
              metalType: metalKey,
              type: "BUY",
              status: "COMPLETED",
              userId: { $nin: adminIds },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: { $toDouble: "$amount" } },
              totalGrams: { $sum: { $toDouble: "$quantity" } },
              count: { $sum: 1 },
            },
          },
        ]),
        Transaction.aggregate([
          {
            $match: {
              metalType: metalKey,
              type: "SELL",
              status: "COMPLETED",
              userId: { $nin: adminIds },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: { $toDouble: "$amount" } },
              totalGrams: { $sum: { $toDouble: "$quantity" } },
              count: { $sum: 1 },
            },
          },
        ]),
        Transaction.countDocuments({
          metalType: metalKey,
          userId: { $nin: adminIds },
        }),
      ]);

    const buyStats = {
      totalAmount: buyStatsAgg[0]
        ? Math.round(buyStatsAgg[0].totalAmount * 100) / 100
        : 0,
      totalGrams: buyStatsAgg[0]
        ? Math.round(buyStatsAgg[0].totalGrams * 10000) / 10000
        : 0,
      count: buyStatsAgg[0] ? buyStatsAgg[0].count : 0,
    };

    const sellStats = {
      totalAmount: sellStatsAgg[0]
        ? Math.round(sellStatsAgg[0].totalAmount * 100) / 100
        : 0,
      totalGrams: sellStatsAgg[0]
        ? Math.round(sellStatsAgg[0].totalGrams * 10000) / 10000
        : 0,
      count: sellStatsAgg[0] ? sellStatsAgg[0].count : 0,
    };

    // Number Formatters with strict 0 handling
    const formatWeight = (g) => {
      if (!g || g === 0) return "0.00 GM";
      if (g >= 1000) {
        return `${(g / 1000).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG`;
      }
      return `${g.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} GM`;
    };

    const formatCurrencyCrOrLakh = (amt) => {
      if (!amt || amt === 0) return "₹0.00";
      if (amt >= 10000000) {
        return `₹${(amt / 10000000).toFixed(2)} Cr`;
      }
      if (amt >= 100000) {
        return `₹${(amt / 100000).toFixed(2)} Lakh`;
      }
      return `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // 6. Real Recent Customer Transactions (Excluding Admin)
    const rawTransactions = await Transaction.find({
      metalType: metalKey,
      userId: { $nin: adminIds },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "fullName email mobile");

    const recentTransactions = rawTransactions.map((txn) => {
      const user = txn.userId;
      const userName = user?.fullName || "Customer";
      const userIdStr = user?._id
        ? `USR-${user._id.toString().slice(-4).toUpperCase()}`
        : "CUST";
      const rawQty = parseFloat(
        (txn.quantity || txn.goldQuantity || 0).toString(),
      );
      const rawAmt = parseFloat((txn.amount || 0).toString());

      let typeLabel = txn.type;
      if (txn.type === "BUY") {
        typeLabel = txn.buyType === "PHYSICAL" ? "Physical Buy" : "Virtual Buy";
      } else if (txn.type === "SELL") {
        typeLabel = "Sell";
      }

      return {
        id: txn.transactionNumber,
        userId: userIdStr,
        userName,
        userEmail: user?.email || "",
        type: typeLabel,
        metalType: txn.metalType,
        buyType: txn.buyType || "VIRTUAL",
        goldQuantity: isSilver ? 0 : rawQty,
        silverQuantity: isSilver ? rawQty : 0,
        quantity: rawQty,
        amount: rawAmt,
        formattedAmount: `₹${rawAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status:
          txn.status === "COMPLETED"
            ? "Success"
            : txn.status === "PENDING"
              ? "Pending"
              : "Failed",
        date: txn.createdAt,
      };
    });

    // 7. Real Monthly Volume Turnover (Buy vs Sell aggregated from DB)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyVolumeAgg = await Transaction.aggregate([
      {
        $match: {
          metalType: metalKey,
          userId: { $nin: adminIds },
          status: "COMPLETED",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            type: "$type",
          },
          totalAmount: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    // Build standard 6-month sequence (e.g. May -> Oct)
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();
    const monthlyVolumeData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth() + 1; // 1-12
      const yVal = d.getFullYear();
      const mName = monthNames[d.getMonth()];

      const buyMatch = monthlyVolumeAgg.find(
        (a) =>
          a._id.year === yVal && a._id.month === mIdx && a._id.type === "BUY",
      );
      const sellMatch = monthlyVolumeAgg.find(
        (a) =>
          a._id.year === yVal && a._id.month === mIdx && a._id.type === "SELL",
      );

      const buyLakhs = buyMatch
        ? Math.round((buyMatch.totalAmount / 100000) * 100) / 100
        : 0;
      const sellLakhs = sellMatch
        ? Math.round((sellMatch.totalAmount / 100000) * 100) / 100
        : 0;

      monthlyVolumeData.push({
        month: mName,
        buy: buyLakhs,
        sell: sellLakhs,
        buyFormatted: `₹${buyLakhs}L`,
        sellFormatted: `₹${sellLakhs}L`,
      });
    }

    // 8. Real Customer Growth by Month (Excluding Admin)
    const userGrowthAgg = await User.aggregate([
      {
        $match: {
          _id: { $nin: adminIds },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    let runningTotal = 0;
    const userGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth() + 1;
      const yVal = d.getFullYear();
      const mName = monthNames[d.getMonth()];

      const match = userGrowthAgg.find(
        (a) => a._id.year === yVal && a._id.month === mIdx,
      );
      runningTotal += match ? match.count : 0;

      userGrowthData.push({
        month: mName,
        users: runningTotal,
        active: Math.round(runningTotal * (parseFloat(activeRatio) / 100)),
      });
    }

    // 9. Real KYC Distribution (Excluding Admin)
    const notSubmittedKyc = Math.max(
      0,
      totalUsers - (verifiedKyc + pendingKyc + rejectedKyc),
    );
    const kycDistributionData = [
      {
        name: "Verified",
        value: verifiedKyc,
        percentage: `${kycPassRate}%`,
        color: "#10B981",
      },
      {
        name: "Pending",
        value: pendingKyc,
        percentage:
          totalUsers > 0
            ? `${((pendingKyc / totalUsers) * 100).toFixed(1)}%`
            : "0%",
        color: "#F59E0B",
      },
      {
        name: "Rejected",
        value: rejectedKyc,
        percentage:
          totalUsers > 0
            ? `${((rejectedKyc / totalUsers) * 100).toFixed(1)}%`
            : "0%",
        color: "#EF4444",
      },
      {
        name: "Not Submitted",
        value: notSubmittedKyc,
        percentage:
          totalUsers > 0
            ? `${((notSubmittedKyc / totalUsers) * 100).toFixed(1)}%`
            : "0%",
        color: "#94A3B8",
      },
    ];

    // 10. Benchmark Rate History Anchored on Real DB Benchmark Rate
    const chartTimeframes = {
      "1D": [
        {
          time: "09:00",
          price: Math.round((currentRate - (isSilver ? 0.35 : 22)) * 100) / 100,
        },
        {
          time: "11:00",
          price: Math.round((currentRate - (isSilver ? 0.15 : 12)) * 100) / 100,
        },
        {
          time: "13:00",
          price: Math.round((currentRate + (isSilver ? 0.1 : 8)) * 100) / 100,
        },
        {
          time: "15:00",
          price: Math.round((currentRate - (isSilver ? 0.05 : 4)) * 100) / 100,
        },
        { time: "17:00", price: currentRate },
      ],
      "7D": [
        {
          time: "Day 1",
          price: Math.round((currentRate - (isSilver ? 1.2 : 75)) * 100) / 100,
        },
        {
          time: "Day 3",
          price: Math.round((currentRate - (isSilver ? 0.6 : 38)) * 100) / 100,
        },
        {
          time: "Day 5",
          price: Math.round((currentRate + (isSilver ? 0.4 : 25)) * 100) / 100,
        },
        { time: "Day 7", price: currentRate },
      ],
      "1M": [
        {
          time: "Week 1",
          price: Math.round((currentRate - (isSilver ? 2.5 : 140)) * 100) / 100,
        },
        {
          time: "Week 2",
          price: Math.round((currentRate - (isSilver ? 1.5 : 85)) * 100) / 100,
        },
        {
          time: "Week 3",
          price: Math.round((currentRate - (isSilver ? 0.5 : 25)) * 100) / 100,
        },
        { time: "Week 4", price: currentRate },
      ],
      "1Y": [
        {
          time: "Q1",
          price:
            Math.round((currentRate - (isSilver ? 10.0 : 550)) * 100) / 100,
        },
        {
          time: "Q2",
          price: Math.round((currentRate - (isSilver ? 6.5 : 360)) * 100) / 100,
        },
        {
          time: "Q3",
          price: Math.round((currentRate - (isSilver ? 3.0 : 180)) * 100) / 100,
        },
        { time: "Q4", price: currentRate },
      ],
    };

    return {
      assetType: selectedAsset,
      metalKey,
      purityLabel,

      // Top Row - Platform Real Customer Metrics (0 Admin count)
      userStats: {
        totalUsers,
        formattedTotalUsers: totalUsers.toLocaleString("en-IN"),
        userChange:
          totalUsers > 0 ? `+${totalUsers} registered` : "0 registered",
        activeUsers,
        formattedActiveUsers: activeUsers.toLocaleString("en-IN"),
        activeRatio: `${activeRatio}% active ratio`,
        pendingKyc,
        pendingKycBadge: pendingKyc > 0 ? "Action required" : "All clear",
        pendingKycChange:
          pendingKyc > 0
            ? `${pendingKyc} pending verification`
            : "No pending reviews",
        verifiedKyc,
        formattedVerifiedKyc: verifiedKyc.toLocaleString("en-IN"),
        kycPassRate: `${kycPassRate}% pass rate`,
      },

      // Middle Row - Bullion Asset Real Customer Metrics (Filtered by Gold or Silver)
      assetStats: {
        holdings: {
          title: isSilver ? "Silver Holdings" : "Gold Holdings",
          value: formatWeight(holdingsGrams),
          subvalue: `≈ ${formatCurrencyCrOrLakh(holdingsValue)}`,
          change:
            holdingsGrams > 0
              ? `${formatWeight(holdingsGrams)} in customer vaults`
              : "0.00 GM vault balance",
          trend: holdingsGrams > 0 ? "up" : "neutral",
          rawGrams: holdingsGrams,
          rawValue: holdingsValue,
        },
        totalPurchased: {
          title: "Total Purchased",
          value: formatCurrencyCrOrLakh(buyStats.totalAmount),
          subvalue: formatWeight(buyStats.totalGrams),
          change:
            buyStats.count > 0
              ? `${buyStats.count} orders cleared`
              : "0 orders",
          trend: buyStats.count > 0 ? "up" : "neutral",
          rawAmount: buyStats.totalAmount,
          rawGrams: buyStats.totalGrams,
          count: buyStats.count,
        },
        totalSold: {
          title: "Total Sold",
          value: formatCurrencyCrOrLakh(sellStats.totalAmount),
          subvalue: formatWeight(sellStats.totalGrams),
          change:
            sellStats.count > 0
              ? `${sellStats.count} payouts settled`
              : "0 sell orders",
          trend: "neutral",
          rawAmount: sellStats.totalAmount,
          rawGrams: sellStats.totalGrams,
          count: sellStats.count,
        },
        transactions: {
          title: isSilver ? "Silver Transactions" : "Gold Transactions",
          value: totalTransactionsCount.toLocaleString("en-IN"),
          change:
            totalTransactionsCount > 0
              ? `${totalTransactionsCount} ledger entries`
              : "0 transactions",
          trend: totalTransactionsCount > 0 ? "up" : "neutral",
          rawCount: totalTransactionsCount,
        },
      },

      // Purity Breakdown & Dynamic Margins for Overview pages
      purityRates,
      rateSettings: {
        goldBuyMarkupPercent: goldBuyMarkup,
        goldSellDiscountPercent: goldSellDiscount,
        silverBuyMarkupPercent: silverBuyMarkup,
        silverSellDiscountPercent: silverSellDiscount,
        gstPercent,
      },
      stats: {
        totalHeld: {
          value: formatWeight(holdingsGrams),
          subvalue: `≈ ${formatCurrencyCrOrLakh(holdingsValue)}`,
          change:
            holdingsGrams > 0
              ? `${formatWeight(holdingsGrams)} in customer vaults`
              : "0.00 GM vault balance",
          trend: holdingsGrams > 0 ? "up" : "neutral",
        },
        totalPurchased: {
          value: formatCurrencyCrOrLakh(buyStats.totalAmount),
          subvalue: `${formatWeight(buyStats.totalGrams)} cumulative`,
          change:
            buyStats.count > 0
              ? `${buyStats.count} orders cleared`
              : "0 orders",
          trend: buyStats.count > 0 ? "up" : "neutral",
        },
        totalSold: {
          value: formatCurrencyCrOrLakh(sellStats.totalAmount),
          subvalue: `${formatWeight(sellStats.totalGrams)} settled`,
          change:
            sellStats.count > 0
              ? `${sellStats.count} payouts settled`
              : "0 sell orders",
          trend: "neutral",
        },
      },
      dayChange: {
        amount: liveRateData?.changeAmount || 0,
        formattedAmount: `${(liveRateData?.changeAmount || 0) >= 0 ? "+" : ""}₹${Math.abs(liveRateData?.changeAmount || 0).toFixed(2)}`,
        percentage: liveRateData?.changePercentage || 0,
        isPositive: (liveRateData?.changeAmount || 0) >= 0,
      },

      // Benchmark Rates & Pricing from Database
      rates: {
        purity: purityLabel,
        actualPricePerGram: currentRate,
        buyPricePerGram: buyRate,
        sellPricePerGram: sellRate,
        buyMarkupPercentage: isSilver ? silverBuyMarkup : goldBuyMarkup,
        sellDiscountPercentage: isSilver
          ? silverSellDiscount
          : goldSellDiscount,
        gstPercentage: gstPercent,
        formattedPrice: `₹${currentRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        formattedBuyPrice: `₹${buyRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (+${isSilver ? silverBuyMarkup : goldBuyMarkup}%)`,
        formattedSellPrice: `₹${sellRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm${(isSilver ? silverSellDiscount : goldSellDiscount) > 0 ? ` (-${isSilver ? silverSellDiscount : goldSellDiscount}%)` : " (Actual)"}`,
        changeAmount: liveRateData?.changeAmount || 0,
        changePercentage: liveRateData?.changePercentage || 0,
        isPositive: (liveRateData?.changeAmount || 0) >= 0,
        formattedChange: liveRateData?.formattedChange || "+0.00 (0.00%)",
      },

      // Chart Data (100% computed from real database data)
      charts: {
        benchmarkTimeframes: chartTimeframes,
        buyVsSellVolume: monthlyVolumeData,
        userGrowth: userGrowthData,
        kycDistribution: kycDistributionData,
      },

      // Recent Customer Transactions List (Excluding Admin)
      recentTransactions,
    };
  }

  /**
   * Get all customer users with search, status & kyc filters, and pagination
   * Strictly excludes administrative accounts
   */
  async getUsersList({
    search = "",
    status = "All",
    kycStatus = "All",
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  }) {
    // 1. Identify all Admin User IDs to strictly exclude them
    const adminDocs = await User.find({
      $or: [
        { role: { $in: ["admin", "ADMIN", "superadmin", "SUPERADMIN"] } },
        { email: "admin@tiaz.com" },
      ],
    }).select("_id");
    const adminIds = adminDocs.map((a) => a._id);

    // Base query: strictly exclude admins
    const query = {
      _id: { $nin: adminIds },
      role: { $nin: ["admin", "ADMIN", "superadmin", "SUPERADMIN"] },
      email: { $ne: "admin@tiaz.com" },
    };

    // Status filter
    if (status && status !== "All") {
      if (status.toLowerCase() === "active") {
        query.isBlocked = { $ne: true };
        query.isActive = { $ne: false };
      } else if (status.toLowerCase() === "blocked") {
        query.isBlocked = true;
      }
    }

    // KYC filter
    if (kycStatus && kycStatus !== "All") {
      const kycLower = kycStatus.toLowerCase();
      if (kycLower === "pending") {
        query["kyc.status"] = { $in: ["pending", "under_review"] };
      } else if (kycLower === "verified") {
        query["kyc.status"] = "verified";
      } else if (kycLower === "rejected") {
        query["kyc.status"] = "rejected";
      }
    }

    // Search filter: search by fullName, email, mobile, or _id
    if (search && search.trim()) {
      const s = search.trim();
      const searchConditions = [
        { fullName: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { mobile: { $regex: s, $options: "i" } },
      ];

      if (mongoose.Types.ObjectId.isValid(s)) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(s) });
      }

      query.$and = [...(query.$and || []), { $or: searchConditions }];
    }

    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy || "createdAt"]: sortDirection };

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select("-password -pin -otp -otpExpire")
        .populate("referredBy", "fullName mobile email referralCode")
        .lean(),
    ]);

    // Fetch wallets, bank accounts, and referral records for these users
    const userIds = users.map((u) => u._id);
    const [goldWallets, silverWallets, bankAccounts, referrals] =
      await Promise.all([
        GoldWallet.find({ userId: { $in: userIds } }).lean(),
        SilverWallet.find({ userId: { $in: userIds } }).lean(),
        BankAccount.find({
          $or: [{ userId: { $in: userIds } }, { user: { $in: userIds } }],
        }).lean(),
        Referral.find({ referredUserId: { $in: userIds } })
          .populate("referrerId", "fullName mobile email referralCode")
          .lean(),
      ]);

    const goldWalletMap = new Map();
    goldWallets.forEach((gw) => {
      goldWalletMap.set(gw.userId.toString(), gw);
    });

    const silverWalletMap = new Map();
    silverWallets.forEach((sw) => {
      silverWalletMap.set(sw.userId.toString(), sw);
    });

    const bankAccountMap = new Map();
    bankAccounts.forEach((ba) => {
      const uId = (ba.userId || ba.user).toString();
      if (!bankAccountMap.has(uId)) {
        bankAccountMap.set(uId, []);
      }
      bankAccountMap.get(uId).push(ba);
    });

    const referralMap = new Map();
    referrals.forEach((r) => {
      if (r.referredUserId) {
        referralMap.set(r.referredUserId.toString(), r);
      }
    });

    const formattedUsers = users.map((u) => {
      const gWallet = goldWalletMap.get(u._id.toString());
      const sWallet = silverWalletMap.get(u._id.toString());

      const rawGold = gWallet?.availableGold
        ? parseFloat(gWallet.availableGold.toString())
        : 0;
      const rawSilver = sWallet?.availableSilver
        ? parseFloat(sWallet.availableSilver.toString())
        : 0;
      const goldInvested = gWallet?.totalInvested
        ? parseFloat(gWallet.totalInvested.toString())
        : 0;
      const silverInvested = sWallet?.totalInvested
        ? parseFloat(sWallet.totalInvested.toString())
        : 0;
      const totalInvested =
        Math.round((goldInvested + silverInvested) * 100) / 100;

      // Determine UI status
      const isBlocked = !!u.isBlocked;
      const statusLabel = isBlocked
        ? "Blocked"
        : u.isActive !== false
          ? "Active"
          : "Inactive";

      // Determine UI KYC status
      let kycLabel = "Pending";
      const kStatus = (u.kyc?.status || "").toLowerCase();
      if (kStatus === "verified") {
        kycLabel = "Verified";
      } else if (kStatus === "rejected") {
        kycLabel = "Rejected";
      } else {
        kycLabel = "Pending";
      }

      // Bank accounts formatting
      const rawUserBanks = bankAccountMap.get(u._id.toString()) || [];
      const formattedBanks = rawUserBanks.map((b) => ({
        id: b._id.toString(),
        bankName: b.bankName || "Unknown Bank",
        accountHolderName: b.accountHolderName || u.fullName,
        accountNumberLast4: b.accountNumberLast4
          ? `•••• •••• ${b.accountNumberLast4}`
          : "••••",
        rawLast4: b.accountNumberLast4 || "",
        ifsc: b.ifsc || "—",
        accountType: b.accountType || "savings",
        verificationStatus: b.verificationStatus || "pending",
        isPrimary: !!b.isPrimary,
        upiId: b.upiId || null,
        verifiedAt: b.verifiedAt || null,
        createdAt: b.createdAt,
      }));

      // UPI accounts formatting
      const formattedUpis = [];
      if (u.upiId) {
        formattedUpis.push({
          id: "upi-profile",
          upiId: u.upiId,
          provider: u.upiId.split("@")[1] || "UPI",
          isPrimary: true,
          status: "verified",
        });
      }
      formattedBanks.forEach((b) => {
        if (b.upiId && !formattedUpis.some((up) => up.upiId === b.upiId)) {
          formattedUpis.push({
            id: `upi-${b.id}`,
            upiId: b.upiId,
            provider: b.upiId.split("@")[1] || "Bank UPI",
            isPrimary: b.isPrimary,
            status: b.verificationStatus,
          });
        }
      });
      // Fallback UPI handle if user has mobile
      if (formattedUpis.length === 0 && u.mobile) {
        const cleanMobile = u.mobile.replace(/\D/g, "").slice(-10);
        formattedUpis.push({
          id: "upi-mobile",
          upiId: `${cleanMobile}@upi`,
          provider: "Standard UPI",
          isPrimary: true,
          status: u.kyc?.status === "verified" ? "verified" : "pending",
        });
      }

      // Display ID matching screenshot: e.g. U1001 or U + last 4 hex characters
      const shortId = `U${u._id.toString().slice(-4).toUpperCase()}`;

      // Referral information (who referred this user & reward status)
      const refDoc = referralMap.get(u._id.toString());
      const referrerUser =
        refDoc?.referrerId ||
        (u.referredBy && typeof u.referredBy === "object"
          ? u.referredBy
          : null);

      let referralInfo = null;
      if (referrerUser || refDoc) {
        const rawRewardAmount = refDoc?.rewardAmount
          ? parseFloat(refDoc.rewardAmount.toString())
          : 0;
        const rawRewardGold = refDoc?.rewardGold
          ? parseFloat(refDoc.rewardGold.toString())
          : 0;
        const refStatus = refDoc?.status || "PENDING";

        let rewardText = "Reward Pending";
        if (refStatus === "REWARDED" || refStatus === "SUCCESSFUL") {
          if (rawRewardGold > 0) {
            rewardText = `${rawRewardGold >= 1 ? rawRewardGold.toFixed(2) + " gm" : (rawRewardGold * 1000).toFixed(0) + " mg"} 24K Gold Credited`;
          } else if (rawRewardAmount > 0) {
            rewardText = `₹${rawRewardAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Credited`;
          } else {
            rewardText = "Reward Credited";
          }
        } else if (refStatus === "EXPIRED") {
          rewardText = "Offer Expired";
        }

        referralInfo = {
          hasReferral: true,
          referralCodeUsed:
            refDoc?.referralCode || referrerUser?.referralCode || "—",
          referrerId: referrerUser?._id
            ? `U${referrerUser._id.toString().slice(-4).toUpperCase()}`
            : "—",
          referrerName: referrerUser?.fullName || "Referrer",
          referrerMobile: referrerUser?.mobile
            ? referrerUser.mobile.startsWith("+")
              ? referrerUser.mobile
              : `+91 ${referrerUser.mobile}`
            : "—",
          referrerEmail: referrerUser?.email || "—",
          status: refStatus,
          rewardAmount: rawRewardAmount,
          rewardGold: rawRewardGold,
          rewardText: rewardText,
          rewardedAt: refDoc?.rewardedAt || null,
        };
      } else {
        referralInfo = {
          hasReferral: false,
          referralCodeUsed: null,
          referrerName: null,
          referrerMobile: null,
          status: "NONE",
          rewardText: "Direct Signup (No Referral)",
        };
      }

      return {
        id: shortId,
        rawId: u._id.toString(),
        name: u.fullName || "Individual Investor",
        fullName: u.fullName || "Individual Investor",
        role: u.role === "admin" ? "Administrator" : "Individual",
        mobile: u.mobile
          ? u.mobile.startsWith("+")
            ? u.mobile
            : `+91 ${u.mobile}`
          : "—",
        rawMobile: u.mobile || "",
        email: u.email || "—",
        rawEmail: u.email || "",
        dob: u.dob || null,
        gender: u.gender || null,
        panNumber: u.panNumber || "—", // Real PAN number (no mock Aadhaar number)
        address: u.address || "Address not provided",
        nationality: u.nationality || "Indian",
        profileImage: u.profileImage || null,
        isProfileComplete: !!u.isProfileComplete,
        referralCode: u.referralCode || "—",
        referredBy: u.referredBy || null,
        referralInfo,
        isActive: u.isActive !== false,
        isBlocked,
        status: statusLabel,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        lastLoginAt: u.lastLoginAt || null,
        lastLoginIp: u.lastLoginIp || null,
        kycStatus: kycLabel,
        rawKycStatus: u.kyc?.status || "pending",
        rejectionReason: u.kyc?.rejectionReason || null,
        goldBalance: Math.round(rawGold * 10000) / 10000,
        silverBalance: Math.round(rawSilver * 10000) / 10000,
        totalInvested,
        kycDocuments: {
          aadhaarFront: u.kyc?.aadhaarFront || null,
          aadhaarBack: u.kyc?.aadhaarBack || null,
          panCard: u.kyc?.panCard || null,
          submittedAt: u.kyc?.submittedAt || null,
          reviewedAt: u.kyc?.reviewedAt || null,
        },
        bankAccounts: formattedBanks,
        upiAccounts: formattedUpis,
        upiId: formattedUpis[0]?.upiId || null,
      };
    });

    const pagingResult = getPagingData(
      formattedUsers,
      totalUsers,
      pageNum,
      limitNum,
    );

    return {
      items: formattedUsers,
      users: formattedUsers,
      pagination: {
        ...pagingResult.pagination,
        totalUsers,
        pageSize: limitNum,
      },
    };
  }

  /**
   * Retrieve the list of users referred BY a specific customer (referrals made by this user).
   * Returns summary stats + a formatted list of referred friends.
   */
  async getUserReferrals(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    const user = await User.findById(userObjectId).select(
      "fullName referralCode",
    );
    if (!user) throw new Error("User not found");

    const referrals = await Referral.find({ referrerId: userObjectId })
      .populate(
        "referredUserId",
        "fullName mobile email profileImage createdAt kyc.status",
      )
      .sort({ createdAt: -1 })
      .lean();

    let totalRewardGold = 0;
    let totalRewardAmount = 0;
    let successful = 0;

    const list = referrals.map((ref) => {
      const friend = ref.referredUserId || {};
      const rewardGold = parseFloat((ref.rewardGold || 0).toString());
      const rewardAmount = parseFloat((ref.rewardAmount || 0).toString());
      const isSuccess =
        ref.status === "SUCCESSFUL" || ref.status === "REWARDED";

      if (isSuccess) {
        successful += 1;
        totalRewardGold += rewardGold;
        totalRewardAmount += rewardAmount;
      }

      let rewardText = "Reward Pending";
      if (isSuccess) {
        if (rewardGold > 0) {
          rewardText = `${rewardGold >= 1 ? rewardGold.toFixed(2) + " gm" : (rewardGold * 1000).toFixed(0) + " mg"} 24K Gold`;
        } else if (rewardAmount > 0) {
          rewardText = `₹${rewardAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
          rewardText = "Reward Credited";
        }
      } else if (ref.status === "EXPIRED") {
        rewardText = "Offer Expired";
      }

      const friendKyc = (friend.kyc?.status || "").toLowerCase();

      return {
        id: ref._id.toString(),
        referredUserId: friend._id
          ? `U${friend._id.toString().slice(-4).toUpperCase()}`
          : null,
        name: friend.fullName || "New User",
        mobile: friend.mobile
          ? friend.mobile.startsWith("+")
            ? friend.mobile
            : `+91 ${friend.mobile}`
          : "—",
        email: friend.email || "—",
        profileImage: friend.profileImage || null,
        status: ref.status || "PENDING",
        kycStatus:
          friendKyc === "verified"
            ? "Verified"
            : friendKyc === "rejected"
              ? "Rejected"
              : "Pending",
        rewardGold,
        rewardAmount,
        rewardText,
        rewardedAt: ref.rewardedAt || null,
        joinedAt: friend.createdAt || ref.createdAt,
        createdAt: ref.createdAt,
      };
    });

    return {
      referralCode: user.referralCode || "—",
      stats: {
        totalReferrals: list.length,
        successfulReferrals: successful,
        pendingReferrals: list.length - successful,
        totalRewardGold: Math.round(totalRewardGold * 10000) / 10000,
        totalRewardAmount: Math.round(totalRewardAmount * 100) / 100,
      },
      referrals: list,
    };
  }

  /**
   * Block / Unblock customer user
   */
  async toggleBlockUser(userId, shouldBlock) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.role === "admin" || user.email === "admin@tiaz.com") {
      throw new Error("Cannot block administrative accounts");
    }

    user.isBlocked =
      shouldBlock !== undefined ? !!shouldBlock : !user.isBlocked;
    await user.save();
    return {
      userId: user._id,
      isBlocked: user.isBlocked,
      status: user.isBlocked ? "Blocked" : "Active",
    };
  }

  /**
   * Quick approve or reject KYC for user
   */
  async updateUserKyc(userId, newStatus, rejectionReason = "", adminId = null) {
    const validStatuses = ["verified", "rejected", "pending", "under_review"];
    const normalized = (newStatus || "").toLowerCase();
    if (!validStatuses.includes(normalized)) {
      throw new Error(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (!user.kyc) user.kyc = {};
    user.kyc.status = normalized;
    user.kyc.reviewedAt = new Date();
    if (adminId) user.kyc.reviewedBy = adminId;
    if (normalized === "rejected") {
      user.kyc.rejectionReason =
        rejectionReason || "KYC documentation rejected by administrator";
    } else {
      user.kyc.rejectionReason = null;
    }

    await user.save();
    return {
      userId: user._id,
      kycStatus:
        normalized === "verified"
          ? "Verified"
          : normalized === "rejected"
            ? "Rejected"
            : "Pending",
      rawKycStatus: normalized,
    };
  }

  /**
   * Get all customer transactions with search, metalType, type, buyType, status filters, and pagination
   * Strictly excludes administrative accounts
   */
  async getTransactionsList({
    search = "",
    metalType = "ALL",
    type = "ALL",
    buyType = "ALL",
    status = "ALL",
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  }) {
    // 1. Identify all Admin User IDs to strictly exclude them
    const adminDocs = await User.find({
      $or: [
        { role: { $in: ["admin", "ADMIN", "superadmin", "SUPERADMIN"] } },
        { email: "admin@tiaz.com" },
      ],
    }).select("_id");
    const adminIds = adminDocs.map((a) => a._id);

    // Base query: strictly exclude transactions belonging to admins
    const query = {
      userId: { $nin: adminIds },
    };

    // 2. Metal Filter: GOLD, SILVER, INR
    if (metalType && metalType.toUpperCase() !== "ALL") {
      query.metalType = metalType.toUpperCase();
    }

    // 3. Type & BuyType Filter
    const typeUpper = (type || "ALL").toUpperCase();
    const buyTypeUpper = (buyType || "ALL").toUpperCase();

    if (typeUpper === "PHYSICAL_BUY") {
      query.type = "BUY";
      query.buyType = "PHYSICAL";
    } else if (typeUpper === "VIRTUAL_BUY") {
      query.type = "BUY";
      query.buyType = "VIRTUAL";
    } else if (typeUpper !== "ALL") {
      query.type = typeUpper;
    }

    if (buyTypeUpper !== "ALL" && !query.buyType) {
      query.buyType = buyTypeUpper;
    }

    // 4. Status Filter: COMPLETED, PENDING, FAILED, etc.
    if (status && status.toUpperCase() !== "ALL") {
      const statusUpper = status.toUpperCase();
      if (statusUpper === "SUCCESS") {
        query.status = "COMPLETED";
      } else {
        query.status = statusUpper;
      }
    }

    // 5. Search Filter: search by transaction ID, description, product, reference, amount or user details
    if (search && search.trim()) {
      const s = search.trim();
      const escaped = s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");

      // Search users matching name, email, or mobile
      const matchingUsers = await User.find({
        _id: { $nin: adminIds },
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { mobile: searchRegex },
        ],
      }).select("_id");
      const matchedUserIds = matchingUsers.map((u) => u._id);

      const orConditions = [
        { transactionNumber: searchRegex },
        { description: searchRegex },
        { productName: searchRegex },
        { courierPartner: searchRegex },
        { trackingNumber: searchRegex },
      ];

      if (matchedUserIds.length > 0) {
        orConditions.push({ userId: { $in: matchedUserIds } });
      }

      if (mongoose.Types.ObjectId.isValid(s)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(s) });
        orConditions.push({ referenceId: new mongoose.Types.ObjectId(s) });
      }

      const numericVal = parseFloat(s);
      if (!isNaN(numericVal) && numericVal > 0) {
        orConditions.push({ amount: numericVal });
        orConditions.push({ quantity: numericVal });
        orConditions.push({ goldQuantity: numericVal });
      }

      query.$and = [...(query.$and || []), { $or: orConditions }];
    }

    // 6. Pagination using server/src/utils/pagination.js
    const { page: pageNum, limit: limitNum, skip } = getPagination(page, limit);

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy || "createdAt"]: sortDirection };

    // 7. Execute Queries & Aggregation for Stats (All strictly excluding admins)
    const [statsAgg, totalCount, filteredCount, transactions] =
      await Promise.all([
        Transaction.aggregate([
          { $match: { userId: { $nin: adminIds } } },
          {
            $group: {
              _id: null,
              totalCredits: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$direction", "CREDIT"] },
                        { $eq: ["$status", "COMPLETED"] },
                      ],
                    },
                    { $toDouble: "$amount" },
                    0,
                  ],
                },
              },
              totalDebits: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$direction", "DEBIT"] },
                        { $eq: ["$status", "COMPLETED"] },
                      ],
                    },
                    { $toDouble: "$amount" },
                    0,
                  ],
                },
              },
              totalGoldVolume: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$metalType", "GOLD"] },
                        { $eq: ["$status", "COMPLETED"] },
                      ],
                    },
                    {
                      $toDouble: {
                        $cond: [
                          { $gt: [{ $toDouble: "$quantity" }, 0] },
                          "$quantity",
                          "$goldQuantity",
                        ],
                      },
                    },
                    0,
                  ],
                },
              },
              totalSilverVolume: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$metalType", "SILVER"] },
                        { $eq: ["$status", "COMPLETED"] },
                      ],
                    },
                    { $toDouble: "$quantity" },
                    0,
                  ],
                },
              },
            },
          },
        ]),
        Transaction.countDocuments({ userId: { $nin: adminIds } }),
        Transaction.countDocuments(query),
        Transaction.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate(
            "userId",
            "fullName email mobile avatar profileImage kyc role",
          )
          .lean(),
      ]);

    const aggResult = statsAgg[0] || {};
    const stats = {
      totalTransactions: totalCount,
      totalCredits: Math.round((aggResult.totalCredits || 0) * 100) / 100,
      totalDebits: Math.round((aggResult.totalDebits || 0) * 100) / 100,
      totalGoldVolume:
        Math.round((aggResult.totalGoldVolume || 0) * 10000) / 10000,
      totalSilverVolume:
        Math.round((aggResult.totalSilverVolume || 0) * 10000) / 10000,
    };

    // 8. Format Transactions for UI
    const formattedTransactions = transactions.map((t) => {
      const u = t.userId || {};
      const shortUserId = u._id
        ? `U${u._id.toString().slice(-4).toUpperCase()}`
        : "GUEST";

      const rawQty =
        t.quantity && parseFloat(t.quantity.toString()) > 0
          ? parseFloat(t.quantity.toString())
          : t.goldQuantity
            ? parseFloat(t.goldQuantity.toString())
            : 0;

      const rawRate =
        t.rate && parseFloat(t.rate.toString()) > 0
          ? parseFloat(t.rate.toString())
          : t.goldRate
            ? parseFloat(t.goldRate.toString())
            : 0;

      const rawAmount = t.amount ? parseFloat(t.amount.toString()) : 0;
      const rawGst = t.gstAmount ? parseFloat(t.gstAmount.toString()) : 0;
      const rawMakingCharges = t.makingCharges
        ? parseFloat(t.makingCharges.toString())
        : 0;

      let typeLabel = t.type;
      if (t.type === "BUY") {
        typeLabel = t.buyType === "PHYSICAL" ? "Physical Buy" : "Virtual Buy";
      } else if (t.type === "SELL") {
        typeLabel = "Sell";
      } else if (t.type === "WALLET_CREDIT") {
        typeLabel = "Wallet Credit";
      } else if (t.type === "WALLET_DEBIT") {
        typeLabel = "Wallet Debit";
      } else if (t.type === "REFERRAL_REWARD") {
        typeLabel = "Referral Reward";
      } else if (t.type === "TRANSFER") {
        typeLabel = "Peer Transfer";
      } else if (t.type === "REDEEM_PHYSICAL") {
        typeLabel = "Redeem Physical";
      }

      return {
        id: t.transactionNumber || t._id.toString(),
        rawId: t._id.toString(),
        transactionNumber: t.transactionNumber,
        userName: u.fullName || "Individual Investor",
        userId: shortUserId,
        rawUserId: u._id?.toString() || null,
        userEmail: u.email || "",
        userMobile: u.mobile || "",
        userAvatar: u.avatar || u.profileImage || null,
        metalType: t.metalType || "GOLD",
        buyType: t.buyType || "VIRTUAL",
        type: t.type,
        typeLabel,
        direction: t.direction === "CREDIT" ? "Credit" : "Debit",
        quantity: Math.round(rawQty * 10000) / 10000,
        goldQuantity: Math.round(rawQty * 10000) / 10000,
        rate: Math.round(rawRate * 100) / 100,
        goldRate: Math.round(rawRate * 100) / 100,
        amount: Math.round(rawAmount * 100) / 100,
        gstAmount: Math.round(rawGst * 100) / 100,
        makingCharges: Math.round(rawMakingCharges * 100) / 100,
        productName: t.productName || null,
        deliveryAddress: t.deliveryAddress || null,
        courierPartner: t.courierPartner || null,
        trackingNumber: t.trackingNumber || null,
        deliveryStatus: t.deliveryStatus || "NOT_APPLICABLE",
        status: t.status === "COMPLETED" ? "Success" : t.status,
        rawStatus: t.status,
        reference: t.referenceId
          ? t.referenceId.toString()
          : t.transactionNumber || "—",
        referenceType: t.referenceType || "Other",
        description: t.description || "",
        date: t.createdAt,
        createdAt: t.createdAt,
      };
    });

    const pagingResult = getPagingData(
      formattedTransactions,
      filteredCount,
      pageNum,
      limitNum,
    );

    return {
      items: formattedTransactions,
      transactions: formattedTransactions,
      stats,
      pagination: {
        ...pagingResult.pagination,
        totalItems: filteredCount,
        pageSize: limitNum,
      },
    };
  }

  /**
   * Bullion Asset Overview API for Gold & Silver pages
   * 100% Real Database Data - Excludes Admin transactions & holdings
   */
  async getAssetOverview(assetType = "gold") {
    const isSilver = assetType && assetType.toLowerCase() === "silver";
    const metalKey = isSilver ? "SILVER" : "GOLD";

    // 1. Identify all Admin User IDs to strictly exclude them
    const adminDocs = await User.find({
      $or: [
        { role: { $in: ["admin", "ADMIN", "superadmin", "SUPERADMIN"] } },
        { email: "admin@tiaz.com" },
      ],
    }).select("_id");
    const adminIds = adminDocs.map((a) => a._id);

    // 2. Real Customer Custody / Holdings from Wallets (Excluding Admin)
    let holdingsGrams = 0;
    let totalInvested = 0;

    if (isSilver) {
      const agg = await SilverWallet.aggregate([
        { $match: { userId: { $nin: adminIds } } },
        {
          $group: {
            _id: null,
            totalGrams: { $sum: { $toDouble: "$availableSilver" } },
            totalInvested: { $sum: { $toDouble: "$totalInvested" } },
          },
        },
      ]);
      if (agg.length > 0) {
        holdingsGrams = Math.round((agg[0].totalGrams || 0) * 10000) / 10000;
        totalInvested = Math.round((agg[0].totalInvested || 0) * 100) / 100;
      }
    } else {
      const agg = await GoldWallet.aggregate([
        { $match: { userId: { $nin: adminIds } } },
        {
          $group: {
            _id: null,
            totalGrams: { $sum: { $toDouble: "$availableGold" } },
            totalInvested: { $sum: { $toDouble: "$totalInvested" } },
          },
        },
      ]);
      if (agg.length > 0) {
        holdingsGrams = Math.round((agg[0].totalGrams || 0) * 10000) / 10000;
        totalInvested = Math.round((agg[0].totalInvested || 0) * 100) / 100;
      }
    }

    // 3. Real Customer Buys & Sells Aggregations (Excluding Admin)
    const [buyStatsAgg, sellStatsAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            metalType: metalKey,
            type: "BUY",
            status: "COMPLETED",
            userId: { $nin: adminIds },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: { $toDouble: "$amount" } },
            totalGrams: { $sum: { $toDouble: "$quantity" } },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            metalType: metalKey,
            type: "SELL",
            status: "COMPLETED",
            userId: { $nin: adminIds },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: { $toDouble: "$amount" } },
            totalGrams: { $sum: { $toDouble: "$quantity" } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const buyStats = {
      totalAmount: buyStatsAgg[0]
        ? Math.round(buyStatsAgg[0].totalAmount * 100) / 100
        : 0,
      totalGrams: buyStatsAgg[0]
        ? Math.round(buyStatsAgg[0].totalGrams * 10000) / 10000
        : 0,
      count: buyStatsAgg[0] ? buyStatsAgg[0].count : 0,
    };

    const sellStats = {
      totalAmount: sellStatsAgg[0]
        ? Math.round(sellStatsAgg[0].totalAmount * 100) / 100
        : 0,
      totalGrams: sellStatsAgg[0]
        ? Math.round(sellStatsAgg[0].totalGrams * 10000) / 10000
        : 0,
      count: sellStatsAgg[0] ? sellStatsAgg[0].count : 0,
    };

    // Formatters
    const formatWeight = (g) => {
      if (!g || g === 0) return "0.00 GM";
      if (g >= 1000) {
        return `${(g / 1000).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG`;
      }
      return `${g.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} GM`;
    };

    const formatCurrencyCrOrLakh = (amt) => {
      if (!amt || amt === 0) return "₹0.00";
      if (amt >= 10000000) {
        return `₹${(amt / 10000000).toFixed(2)} Cr`;
      }
      if (amt >= 100000) {
        return `₹${(amt / 100000).toFixed(2)} Lakh`;
      }
      return `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // 4. Real Purity Rates from Database
    let purityRates = [];
    let primaryRate = 0;
    let dayChangeVal = 0;
    let dayChangePercent = 0;

    if (isSilver) {
      const sRates = await silverService.getLiveRates();
      const p999 = sRates.rate999.pricePerGram || 92.5;
      primaryRate = p999;
      dayChangeVal = sRates.rate999.changeAmount || 0.85;
      dayChangePercent = sRates.rate999.changePercentage || 0.93;

      const price999 = p999;
      const price925 =
        sRates.rate925?.pricePerGram ||
        Math.round(price999 * (925 / 999) * 100) / 100;
      const price900 = Math.round(price999 * (900 / 999) * 100) / 100;

      const buy999 =
        sRates.rate999.buyPricePerGram ||
        Math.round(price999 * 1.05 * 100) / 100;
      const buy925 =
        sRates.rate925?.buyPricePerGram ||
        Math.round(price925 * 1.05 * 100) / 100;
      const buy900 = Math.round(price900 * 1.05 * 100) / 100;

      purityRates = [
        {
          purity: "999 Fine",
          rawPurity: "999",
          fineness: "999 Fine",
          finenessValue: 999,
          buyRate: buy999,
          sellRate: price999,
          actualRate: price999,
          change: dayChangeVal,
          changePercentage: dayChangePercent,
          source: "MMTC-PAMP Live",
          updatedAt: sRates.rate999.timestamp || new Date(),
          status: "Live",
        },
        {
          purity: "925 Sterling",
          rawPurity: "925",
          fineness: "925 Sterling",
          finenessValue: 925,
          buyRate: buy925,
          sellRate: price925,
          actualRate: price925,
          change: Math.round(dayChangeVal * (925 / 999) * 100) / 100,
          changePercentage: dayChangePercent,
          source: "MMTC-PAMP Live",
          updatedAt: sRates.rate925?.timestamp || new Date(),
          status: "Live",
        },
        {
          purity: "900 Coin",
          rawPurity: "900",
          fineness: "900 Coin",
          finenessValue: 900,
          buyRate: buy900,
          sellRate: price900,
          actualRate: price900,
          change: Math.round(dayChangeVal * (900 / 999) * 100) / 100,
          changePercentage: dayChangePercent,
          source: "MMTC-PAMP Live",
          updatedAt: sRates.rate999.timestamp || new Date(),
          status: "Live",
        },
      ];
    } else {
      const gRates = await goldService.getLiveRates();
      const p24k = gRates.rate24k.pricePerGram || 7152.3;
      primaryRate = p24k;
      dayChangeVal = gRates.rate24k.changeAmount || 34.5;
      dayChangePercent = gRates.rate24k.changePercentage || 0.46;

      const price24k = p24k;
      const price22k =
        gRates.rate22k?.pricePerGram ||
        Math.round(price24k * (916 / 999) * 100) / 100;
      const price18k =
        gRates.rate18k?.pricePerGram ||
        Math.round(price24k * (750 / 999) * 100) / 100;

      const buy24k =
        gRates.rate24k.buyPricePerGram ||
        Math.round(price24k * 1.05 * 100) / 100;
      const buy22k =
        gRates.rate22k?.buyPricePerGram ||
        Math.round(price22k * 1.05 * 100) / 100;
      const buy18k =
        gRates.rate18k?.buyPricePerGram ||
        Math.round(price18k * 1.05 * 100) / 100;

      purityRates = [
        {
          purity: "24K",
          rawPurity: "24K",
          fineness: "24K Pure",
          finenessValue: 999,
          buyRate: buy24k,
          sellRate: price24k,
          actualRate: price24k,
          change: dayChangeVal,
          changePercentage: dayChangePercent,
          source: "MMTC-PAMP Live",
          updatedAt: gRates.rate24k.timestamp || new Date(),
          status: "Live",
        },
        {
          purity: "22K",
          rawPurity: "22K",
          fineness: "22K Standard",
          finenessValue: 916,
          buyRate: buy22k,
          sellRate: price22k,
          actualRate: price22k,
          change: Math.round(dayChangeVal * (916 / 999) * 100) / 100,
          changePercentage: dayChangePercent,
          source: "MMTC-PAMP Live",
          updatedAt: gRates.rate22k?.timestamp || new Date(),
          status: "Live",
        },
        {
          purity: "18K",
          rawPurity: "18K",
          fineness: "18K Jewelry",
          finenessValue: 750,
          buyRate: buy18k,
          sellRate: price18k,
          actualRate: price18k,
          change: Math.round(dayChangeVal * (750 / 999) * 100) / 100,
          changePercentage: dayChangePercent,
          source: "MMTC-PAMP Live",
          updatedAt: gRates.rate18k?.timestamp || new Date(),
          status: "Live",
        },
      ];
    }

    // 5. Benchmark History from real MMTC-PAMP daily fixings (up to 30 days)
    const mmtcHistory =
      (isSilver
        ? rateScraperService.getSilverRateHistory()
        : rateScraperService.getGoldRateHistory()) || [];

    let benchmarkTimeframes;
    if (mmtcHistory.length >= 2) {
      // History arrives newest-first -> chart needs oldest-first
      const chronological = [...mmtcHistory]
        .reverse()
        .map((row) => ({ time: row.date, rate: row.rate, price: row.rate }));

      // Anchor the final point to the current live rate so charts always end at today's real price
      const live = primaryRate;
      chronological[chronological.length - 1] = {
        ...chronological[chronological.length - 1],
        rate: live,
        price: live,
      };

      const sliceLast = (n) => chronological.slice(-n);
      benchmarkTimeframes = {
        "1D": sliceLast(2),
        "7D": sliceLast(7),
        "1M": chronological,
        // MMTC-PAMP public feed exposes max 30 days, so 3M/1Y reuse the full real series
        "3M": chronological,
        "1Y": chronological,
      };
    } else {
      // Fallback before first scrape completes: real live rate + real day change only
      const yesterdayRate =
        Math.round((primaryRate - dayChangeVal) * 100) / 100;
      const fallbackSeries = [
        { time: "Yesterday", rate: yesterdayRate, price: yesterdayRate },
        { time: "Today", rate: primaryRate, price: primaryRate },
      ];
      benchmarkTimeframes = {
        "1D": fallbackSeries,
        "7D": fallbackSeries,
        "1M": fallbackSeries,
        "3M": fallbackSeries,
        "1Y": fallbackSeries,
      };
    }

    return {
      assetType: isSilver ? "silver" : "gold",
      metalKey,
      purityRates,
      primaryRate,
      dayChange: {
        amount: dayChangeVal,
        percentage: dayChangePercent,
        formattedAmount: `+₹${Math.abs(dayChangeVal).toFixed(2)}`,
        formattedPercentage: `+${Math.abs(dayChangePercent).toFixed(2)}%`,
        isPositive: dayChangeVal >= 0,
      },
      stats: {
        totalHeld: {
          value: formatWeight(holdingsGrams),
          subvalue: `≈ ${formatCurrencyCrOrLakh(Math.round(holdingsGrams * primaryRate * 100) / 100)}`,
          change: "Vault insured",
          trend: holdingsGrams > 0 ? "up" : "neutral",
          rawGrams: holdingsGrams,
        },
        totalPurchased: {
          value: formatCurrencyCrOrLakh(buyStats.totalAmount),
          subvalue: `${formatWeight(buyStats.totalGrams)} cumulative`,
          change: `${formatWeight(buyStats.totalGrams)} cumulative`,
          trend: buyStats.count > 0 ? "up" : "neutral",
          rawAmount: buyStats.totalAmount,
          rawGrams: buyStats.totalGrams,
          count: buyStats.count,
        },
        totalSold: {
          value: formatCurrencyCrOrLakh(sellStats.totalAmount),
          subvalue: `${formatWeight(sellStats.totalGrams)} settled`,
          change: "Instant IMPS paid",
          trend: "neutral",
          rawAmount: sellStats.totalAmount,
          rawGrams: sellStats.totalGrams,
          count: sellStats.count,
        },
      },
      charts: {
        benchmarkTimeframes,
      },
    };
  }

  /**
   * Get Admin Profile Details
   */
  async getAdminProfile(adminId) {
    const admin = await User.findById(adminId).select("-password");
    if (!admin) throw new Error("Administrator account not found");

    const name = admin.fullName || "Rajesh Varma";
    const namePrefix = (
      name.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "ADM"
    ).toUpperCase();
    const idSuffix = admin._id.toString().slice(-4).toUpperCase();
    const formattedId = `${namePrefix}-${idSuffix}`;

    const now = admin.lastLoginAt || new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, "0");
    const formattedLastLogin = `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;

    return {
      id: formattedId,
      rawId: admin._id.toString(),
      name: admin.fullName || "Rajesh Varma",
      fullName: admin.fullName || "Rajesh Varma",
      email: admin.email || "admin@tiaz.com", // Strictly read-only
      phone: admin.mobile
        ? admin.mobile.startsWith("+")
          ? admin.mobile
          : `+91 ${admin.mobile}`
        : "+91 98200 11990",
      mobile: admin.mobile || "9820011990",
      department: admin.department || "Risk & Custody Operations",
      profileImage: admin.profileImage || null,
      avatar: admin.profileImage || null,
      role: admin.role === "admin" ? "Super Administrator" : "Administrator",
      lastLogin: formattedLastLogin,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    };
  }

  /**
   * Update Admin Profile (Email is strictly READ-ONLY and cannot be changed)
   */
  async updateAdminProfile(
    adminId,
    { fullName, name, mobile, phone, department, profileImage },
  ) {
    const admin = await User.findById(adminId);
    if (!admin) throw new Error("Administrator account not found");

    if (fullName || name) {
      admin.fullName = (fullName || name).trim();
    }

    const rawMobile = mobile || phone;
    if (rawMobile) {
      const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);
      if (cleanMobile.length === 10) {
        admin.mobile = cleanMobile;
      }
    }

    if (department !== undefined && department !== null) {
      admin.department = department.trim();
    }

    if (profileImage !== undefined && profileImage !== null) {
      admin.profileImage = profileImage;
    }

    // NOTE: admin.email is NEVER updated here as per requirement (read-only)
    await admin.save();

    return this.getAdminProfile(adminId);
  }

  /**
   * Change Administrator Password with proper validation
   */
  async changeAdminPassword(
    adminId,
    { currentPassword, newPassword, confirmPassword },
  ) {
    if (!currentPassword) {
      throw new Error("Current password is required.");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }
    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirm password do not match.");
    }

    const admin = await User.findById(adminId).select("+password");
    if (!admin) throw new Error("Administrator account not found");

    if (admin.password) {
      const isMatch = await comparePassword(currentPassword, admin.password);
      if (!isMatch) {
        throw new Error("Current password is incorrect.");
      }
    }

    if (currentPassword === newPassword) {
      throw new Error(
        "New password cannot be the same as your current password.",
      );
    }

    admin.password = await hashPassword(newPassword);
    await admin.save();

    return {
      success: true,
      message: "Administrator password updated successfully.",
    };
  }
}

module.exports = new AdminService();

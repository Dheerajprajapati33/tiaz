const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

class TransactionService {
  async getUserTransactions(userId, filters = {}) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const {
      page = 1,
      limit = 10,
      type = "ALL",
      period = "all_time",
      sortBy = "latest",
      startDate,
      endDate,
      status,
      metalType,
      buyType,
      search,
    } = filters;

    // 1. Build Query for Logged-In User ONLY
    const query = { userId: userObjectId };

    // Filter by metalType: GOLD, SILVER, INR
    if (metalType && metalType.toUpperCase() !== "ALL") {
      query.metalType = metalType.toUpperCase();
    }

    // Filter by type & buyType (VIRTUAL_BUY, PHYSICAL_BUY, BUY, SELL, TRANSFER)
    const upperType = (type || "ALL").toUpperCase();
    const upperBuyType = (buyType || "ALL").toUpperCase();

    if (upperType === "PHYSICAL_BUY") {
      query.type = "BUY";
      query.buyType = "PHYSICAL";
    } else if (upperType === "VIRTUAL_BUY") {
      query.type = "BUY";
      query.buyType = "VIRTUAL";
    } else if (upperType === "TRANSFER") {
      query.type = { $in: ["TRANSFER", "WALLET_CREDIT", "WALLET_DEBIT"] };
    } else if (upperType !== "ALL") {
      query.type = upperType;
    }

    if (upperBuyType !== "ALL" && !query.buyType) {
      query.buyType = upperBuyType;
    }

    // Filter by Search (Transaction ID, description, product, tracking)
    if (search && search.trim()) {
      const s = search.trim();
      const escaped = s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      query.$or = [
        { transactionNumber: searchRegex },
        { description: searchRegex },
        { productName: searchRegex },
        { courierPartner: searchRegex },
        { trackingNumber: searchRegex }
      ];
    }

    // Filter by Status (optional, e.g. COMPLETED, PENDING, FAILED)
    if (status && status.toUpperCase() !== "ALL") {
      query.status = status.toUpperCase();
    }

    // Filter by Period / Date Range
    const now = new Date();
    if (period === "today") {
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      query.createdAt = { $gte: startOfDay };
    } else if (period === "this_week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        diff,
        0,
        0,
        0,
      );
      query.createdAt = { $gte: startOfWeek };
    } else if (period === "this_month") {
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
      );
      query.createdAt = { $gte: startOfMonth };
    } else if (period === "last_month") {
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
        0,
        0,
        0,
      );
      const endOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );
      query.createdAt = { $gte: startOfLastMonth, $lte: endOfLastMonth };
    } else if (period === "custom" && (startDate || endDate)) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 2. Build Sort Options
    let sortOptions = { createdAt: -1 }; // default latest first
    if (sortBy === "oldest") {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === "amount_high") {
      sortOptions = { amount: -1, createdAt: -1 };
    } else if (sortBy === "amount_low") {
      sortOptions = { amount: 1, createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // 3. Run Query + Summary Aggregation in Parallel
    const [rawTransactions, total, summaryAgg] = await Promise.all([
      Transaction.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: { userId: userObjectId, status: "COMPLETED" } },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: { $toDouble: "$amount" } },
            totalGrams: { $sum: { $toDouble: "$goldQuantity" } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // 4. Calculate Summary Card Metrics matching screenshot
    const summaryMap = {};
    for (const item of summaryAgg) {
      summaryMap[item._id] = {
        amount: Math.round(item.totalAmount * 100) / 100,
        grams: Math.round(item.totalGrams * 10000) / 10000,
        count: item.count,
      };
    }

    const buySummary = summaryMap["BUY"] || { amount: 0, grams: 0, count: 0 };
    const sellSummary = summaryMap["SELL"] || { amount: 0, grams: 0, count: 0 };
    const transferSummary = summaryMap["TRANSFER"] || {
      amount: 0,
      grams: 0,
      count: 0,
    };

    const summary = {
      purchases: {
        title: "Total Purchases",
        grams: buySummary.grams,
        formattedGrams: `${buySummary.grams.toFixed(4)} gm`,
        amount: buySummary.amount,
        formattedAmount: `₹${buySummary.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        count: buySummary.count,
      },
      sales: {
        title: "Total Sales",
        grams: sellSummary.grams,
        formattedGrams: `${sellSummary.grams.toFixed(4)} gm`,
        amount: sellSummary.amount,
        formattedAmount: `₹${sellSummary.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        count: sellSummary.count,
      },
      transfers: {
        title: "Total Transfers",
        grams: transferSummary.grams,
        formattedGrams: `${transferSummary.grams.toFixed(4)} gm`,
        amount: transferSummary.amount,
        formattedAmount: `₹${transferSummary.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        count: transferSummary.count,
      },
      totalSpent: {
        title: "Total Spent",
        amount: buySummary.amount,
        formattedAmount: `₹${buySummary.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    };

    // 5. Format each transaction for direct rendering in mobile UI
    const formattedTransactions = rawTransactions.map((txn) => {
      const amt = parseFloat(txn.amount ? txn.amount.toString() : "0");
      const rawQty = txn.quantity || txn.goldQuantity;
      const rawRate = txn.rate || txn.goldRate;
      const qty = parseFloat(rawQty ? rawQty.toString() : "0");
      const rate = parseFloat(rawRate ? rawRate.toString() : "0");
      const makingCharges = parseFloat(txn.makingCharges ? txn.makingCharges.toString() : "0");
      const metalType = txn.metalType || "GOLD";
      const buyType = txn.buyType || "VIRTUAL";
      const dateObj = new Date(txn.createdAt);

      const formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }); // e.g. "15 May 2024"

      const formattedTime = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }); // e.g. "04:15 PM"

      const metalName = metalType === "SILVER" ? "Silver" : "Gold";
      const purityName = metalType === "SILVER" ? "999 Fine Silver" : "24K Gold";
      let title = "Transaction";
      let icon = "transaction";
      let badgeColor = "gray";
      let subtitle = txn.description || "";

      if (txn.type === "BUY") {
        title = buyType === "PHYSICAL" ? `Buy Physical ${metalName}` : `Buy Virtual ${metalName}`;
        icon = "cart";
        badgeColor = "green";
        subtitle = buyType === "PHYSICAL"
          ? `${qty.toFixed(4)} gm • Physical ${metalName} (Full Purchase)`
          : `${qty.toFixed(4)} gm • ${purityName} (Vault)`;
      } else if (txn.type === "SELL") {
        title = `Sell ${metalName}`;
        icon = "tag";
        badgeColor = "red";
        subtitle = `${qty.toFixed(4)} gm • ${purityName}`;
      } else if (txn.type === "TRANSFER") {
        title = txn.direction === "CREDIT" ? "Transfer In" : "Transfer Out";
        icon = "transfer";
        badgeColor = "blue";
        subtitle = txn.description || "Wallet Transfer";
      } else if (txn.type === "WALLET_CREDIT") {
        title = "Wallet Topup";
        icon = "wallet";
        badgeColor = "blue";
        subtitle = "Added to Wallet";
      } else if (txn.type === "WALLET_DEBIT") {
        title = "Wallet Spent";
        icon = "wallet";
        badgeColor = "orange";
        subtitle = "Paid from Wallet";
      }

      return {
        _id: txn._id,
        transactionNumber: txn.transactionNumber,
        type: txn.type,
        metalType,
        buyType,
        title,
        icon,
        badgeColor,
        direction: txn.direction,
        amount: amt,
        formattedAmount: `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        quantity: qty,
        goldQuantity: qty,
        formattedGrams: qty > 0 ? `${qty.toFixed(4)} gm` : null,
        rate: rate > 0 ? rate : null,
        goldRate: rate > 0 ? rate : null,
        formattedRate:
          rate > 0
            ? `₹${rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`
            : null,
        formattedGoldRate:
          rate > 0
            ? `₹${rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`
            : null,
        purity: purityName,
        makingCharges,
        formattedMakingCharges: `₹${makingCharges.toFixed(2)}`,
        productName: txn.productName,
        deliveryStatus: txn.deliveryStatus,
        trackingNumber: txn.trackingNumber,
        courierPartner: txn.courierPartner,
        deliveryAddress: txn.deliveryAddress,
        subtitle,
        status:
          txn.status === "COMPLETED"
            ? "Completed"
            : txn.status === "PENDING"
              ? "Pending"
              : "Failed",
        statusColor:
          txn.status === "COMPLETED"
            ? "green"
            : txn.status === "PENDING"
              ? "orange"
              : "red",
        date: formattedDate,
        time: formattedTime,
        createdAt: txn.createdAt,
        referenceType: txn.referenceType,
        referenceId: txn.referenceId,
      };
    });

    // 6. Grouped by date (for sticky date headers in the mobile UI list)
    const groupedMap = {};
    for (const item of formattedTransactions) {
      if (!groupedMap[item.date]) {
        groupedMap[item.date] = [];
      }
      groupedMap[item.date].push(item);
    }
    const groupedByDate = Object.keys(groupedMap).map((date) => ({
      date,
      items: groupedMap[date],
    }));

    return {
      summary,
      transactions: formattedTransactions,
      groupedByDate,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      appliedFilters: {
        type: type.toUpperCase(),
        period,
        sortBy,
        status: status ? status.toUpperCase() : "ALL",
      },
    };
  }

  async getTransactionById(userId, transactionId) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const query = {
      userId: userObjectId,
      $or: [{ transactionNumber: transactionId }],
    };
    if (mongoose.Types.ObjectId.isValid(transactionId)) {
      query.$or.push({ _id: transactionId });
    }

    const txn = await Transaction.findOne(query);
    if (!txn) throw new Error("Transaction not found");
    return txn;
  }
}

module.exports = new TransactionService();

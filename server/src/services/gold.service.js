const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const rateScraperService = require('./rateScraper.service');
const rateSettingService = require('./rateSetting.service');
const GoldOrder = require('../models/GoldOrder');
const GoldWallet = require('../models/GoldWallet');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const razorpayService = require('./razorpay.service');
const crypto = require('crypto');

class GoldService {
  async getLiveRates() {
    const rateSettings = await rateSettingService.getSettings();
    const buyMarkup = Number(rateSettings.goldBuyMarkupPercent ?? 5.0);
    const sellDiscount = Number(rateSettings.goldSellDiscountPercent ?? 0.0);
    const buyMultiplier = 1 + (buyMarkup / 100);
    const sellMultiplier = 1 - (sellDiscount / 100);

    const liveGold = rateScraperService.getLiveGoldRates();
    const price24k = liveGold.gold24k;
    const buyPrice24k = Math.round((price24k * buyMultiplier) * 100) / 100;
    const sellPrice24k = Math.round((price24k * sellMultiplier) * 100) / 100;
    const diff24k = liveGold.change24k;
    const diffPercent24k = liveGold.changePercentage24k;

    const price22k = liveGold.gold22k;
    const buyPrice22k = Math.round((price22k * buyMultiplier) * 100) / 100;
    const sellPrice22k = Math.round((price22k * sellMultiplier) * 100) / 100;

    const price18k = liveGold.gold18k || Math.round(price24k * (18 / 24) * 100) / 100;
    const buyPrice18k = Math.round((price18k * buyMultiplier) * 100) / 100;
    const sellPrice18k = Math.round((price18k * sellMultiplier) * 100) / 100;

    return {
      rate24k: {
        purity: '24K',
        badge: '24K GOLD RATE • LIVE',
        fineness: 999,
        pricePerGram: price24k,
        pricePer10Gram: Math.round(price24k * 10 * 100) / 100,
        actualPricePerGram: price24k,
        buyPricePerGram: buyPrice24k,
        sellPricePerGram: sellPrice24k,
        buyMarkupPercentage: buyMarkup,
        sellDiscountPercentage: sellDiscount,
        formattedPrice: `₹${price24k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        formattedBuyPrice: `₹${buyPrice24k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (+${buyMarkup}%)`,
        formattedSellPrice: `₹${sellPrice24k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm${sellDiscount > 0 ? ` (-${sellDiscount}%)` : ' (Actual)'}`,
        changeAmount: Math.round(diff24k * 100) / 100,
        changePercentage: Math.round(diffPercent24k * 100) / 100,
        isPositive: diff24k >= 0,
        formattedChange: `${diff24k >= 0 ? '+' : ''}₹${Math.abs(diff24k).toFixed(2)} (${Math.abs(diffPercent24k).toFixed(2)}%) ${diff24k >= 0 ? '↗' : '↘'}`,
        timestamp: liveGold.updatedAt,
        effectiveFrom: liveGold.updatedAt,
        currency: 'INR'
      },
      rate22k: {
        purity: '22K',
        badge: '22K GOLD RATE • LIVE',
        fineness: 916,
        pricePerGram: price22k,
        pricePer10Gram: Math.round(price22k * 10 * 100) / 100,
        actualPricePerGram: price22k,
        buyPricePerGram: buyPrice22k,
        sellPricePerGram: sellPrice22k,
        formattedPrice: `₹${price22k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        formattedBuyPrice: `₹${buyPrice22k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (+${buyMarkup}%)`,
        formattedSellPrice: `₹${sellPrice22k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm${sellDiscount > 0 ? ` (-${sellDiscount}%)` : ' (Actual)'}`,
        changeAmount: Math.round(diff24k * (22 / 24) * 100) / 100,
        changePercentage: Math.round(diffPercent24k * 100) / 100,
        isPositive: diff24k >= 0,
        timestamp: liveGold.updatedAt,
        effectiveFrom: liveGold.updatedAt,
        currency: 'INR'
      },
      rate18k: {
        purity: '18K',
        badge: '18K GOLD RATE • LIVE',
        fineness: 750,
        pricePerGram: price18k,
        pricePer10Gram: Math.round(price18k * 10 * 100) / 100,
        actualPricePerGram: price18k,
        buyPricePerGram: buyPrice18k,
        sellPricePerGram: sellPrice18k,
        formattedPrice: `₹${price18k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        formattedBuyPrice: `₹${buyPrice18k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (+${buyMarkup}%)`,
        formattedSellPrice: `₹${sellPrice18k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm${sellDiscount > 0 ? ` (-${sellDiscount}%)` : ' (Actual)'}`,
        changeAmount: Math.round(diff24k * (18 / 24) * 100) / 100,
        changePercentage: Math.round(diffPercent24k * 100) / 100,
        isPositive: diff24k >= 0,
        timestamp: liveGold.updatedAt,
        effectiveFrom: liveGold.updatedAt,
        currency: 'INR'
      }
    };
  }

  // ==================== BUY GOLD FLOW ====================

  calculateBreakdown({ amount, grams, weightGrams, buyType = 'VIRTUAL', itemType = 'COIN', makingCharges = 0, deliveryFee = 0, directPrice = null, customProductName = null }, buyPricePerGram, actualPricePerGram) {
    const isPhysical = buyType && buyType.toUpperCase() === 'PHYSICAL';
    const effectiveGrams = grams || weightGrams;
    let buyGrams = 0;
    let grossAmount = 0;
    let gstAmount = 0;
    let customMaking = parseFloat(makingCharges) || 0;
    let customDelivery = parseFloat(deliveryFee) || 0;
    let totalPayable = 0;
    const gstRate = 0.03; // 3% GST in India for Bullion

    if (isPhysical) {
      if (directPrice && Number(directPrice) > 0) {
        totalPayable = Math.round(Number(directPrice) * 100) / 100;
        gstAmount = Math.round((totalPayable * gstRate / (1 + gstRate)) * 100) / 100;
        grossAmount = Math.round((totalPayable - gstAmount) * 100) / 100;
        buyGrams = effectiveGrams ? parseFloat(parseFloat(effectiveGrams).toFixed(4)) : 1.0;
      } else {
        if (effectiveGrams) {
          buyGrams = parseFloat(parseFloat(effectiveGrams).toFixed(4));
        } else if (amount) {
          buyGrams = parseFloat((parseFloat(amount) / buyPricePerGram).toFixed(4));
        } else {
          buyGrams = 1.0; // default 1g
        }

        if (buyGrams < 0.001) throw new Error('Minimum physical gold purchase is 0.001 gm');

        const metalAmount = Math.round(buyGrams * buyPricePerGram * 100) / 100;
        grossAmount = Math.round((metalAmount + customMaking) * 100) / 100;
        gstAmount = Math.round(grossAmount * gstRate * 100) / 100;
        totalPayable = Math.round((grossAmount + gstAmount + customDelivery) * 100) / 100;
      }
    } else {
      customMaking = 0;
      customDelivery = 0;
      if (amount) {
        totalPayable = Math.round(parseFloat(amount) * 100) / 100;
        if (totalPayable < 10) throw new Error('Minimum buy amount is ₹10');

        gstAmount = Math.round(totalPayable * gstRate * 100) / 100;
        grossAmount = Math.round((totalPayable - gstAmount) * 100) / 100;
        buyGrams = parseFloat((totalPayable / buyPricePerGram).toFixed(4));
      } else if (effectiveGrams) {
        buyGrams = parseFloat(parseFloat(effectiveGrams).toFixed(4));
        if (buyGrams < 0.001) throw new Error('Minimum buy weight is 0.001 gm');

        grossAmount = Math.round(buyGrams * buyPricePerGram * 100) / 100;
        gstAmount = Math.round(grossAmount * gstRate * 100) / 100;
        totalPayable = Math.round((grossAmount + gstAmount) * 100) / 100;
      } else {
        throw new Error('Please enter either amount (₹) or weight (gm)');
      }
    }

    const conversionText = amount
      ? `≈ ${buyGrams.toFixed(4)} gm`
      : `≈ ₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const productName = isPhysical
      ? `${buyGrams}g 24K Physical Gold (${itemType || 'Coin'})`
      : '24K Digital Gold (Virtual Vault Accumulation)';

      const computedMarkup = actualPricePerGram > 0
        ? Math.round(((buyPricePerGram - actualPricePerGram) / actualPricePerGram) * 1000) / 10
        : 5.0;

      return {
        buyType: isPhysical ? 'PHYSICAL' : 'VIRTUAL',
        productName,
        conversionText,
        grams: buyGrams,
        formattedGrams: `${buyGrams.toFixed(4)} gm`,
        purity: '24K Gold (99.9%)',
        actualRatePerGram: actualPricePerGram,
        formattedActualRate: `₹${actualPricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        ratePerGram: buyPricePerGram,
        formattedRate: `₹${buyPricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+${computedMarkup}%)`,
        markupPercentage: computedMarkup,
      makingCharges: customMaking,
      formattedMakingCharges: customMaking > 0 ? `₹${customMaking.toFixed(2)}` : 'FREE',
      deliveryFee: customDelivery,
      formattedDeliveryFee: customDelivery > 0 ? `₹${customDelivery.toFixed(2)}` : 'FREE',
      gstPercentage: 3.0,
      gstAmount,
      formattedGst: `₹${gstAmount.toFixed(2)}`,
      grossAmount,
      formattedGross: `₹${grossAmount.toFixed(2)}`,
      totalPayable,
      formattedTotalPayable: `₹${totalPayable.toFixed(2)}`
    };
  }

  async calculateBuyQuote(userId, { amount, grams, weightGrams, buyType = 'VIRTUAL', itemType = 'COIN', productId = null }) {
    const { rate24k } = await this.getLiveRates();
    const actualPricePerGram = rate24k.actualPricePerGram || rate24k.pricePerGram;
    const buyPricePerGram = rate24k.buyPricePerGram || Math.round(actualPricePerGram * 1.05 * 100) / 100;

    let targetProduct = null;
    if (productId) {
      targetProduct = await Product.findById(productId);
    }

    const effectiveWeight = targetProduct?.weightGrams || grams || weightGrams;
    const directPrice = targetProduct?.price;

    const quote = this.calculateBreakdown(
      {
        amount: directPrice ? null : amount,
        grams: effectiveWeight,
        weightGrams: effectiveWeight,
        buyType,
        directPrice,
        customProductName: targetProduct?.name
      },
      buyPricePerGram,
      actualPricePerGram
    );

    // Preset amount chips: ₹500, ₹700, ₹1000, ₹2000, ₹5000
    const presetAmounts = [500, 700, 1000, 2000, 5000];
    const presets = presetAmounts.map((amt) => {
      const g = parseFloat((amt / buyPricePerGram).toFixed(4));
      return {
        amount: amt,
        formattedAmount: `₹${amt}`,
        grams: g,
        formattedGrams: `${g.toFixed(4)} gm`
      };
    });

    let cashBalance = 0;
    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId.toString());
      const wallet = await GoldWallet.findOne({ userId: userObjectId });
      if (wallet && wallet.cashBalance) {
        cashBalance = parseFloat(wallet.cashBalance.toString());
      }
    }

    const isPhysical = buyType && buyType.toUpperCase() === 'PHYSICAL';

    const paymentMethods = isPhysical
      ? [
          {
            id: 'COD',
            title: 'Cash on Delivery (COD)',
            subtitle: 'Pay upon delivery (Requires phone verification call)',
            isSelected: true
          },
          {
            id: 'ONLINE',
            title: 'Online Payment (Razorpay / UPI / Card)',
            subtitle: 'Pay securely online for instant verification',
            isSelected: false
          }
        ]
      : [
          {
            id: 'WALLET',
            title: "Tia'z Wallet",
            subtitle: `Balance: ₹${cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            balance: cashBalance,
            isSufficient: cashBalance >= quote.totalPayable,
            isSelected: cashBalance >= quote.totalPayable
          },
          {
            id: 'ONLINE',
            title: 'Online Payment (Razorpay / UPI)',
            subtitle: 'Pay using UPI, Card or Netbanking',
            isSelected: cashBalance < quote.totalPayable
          }
        ];

    return {
      liveRate: rate24k,
      liveRatePerGram: actualPricePerGram,
      buyPricePerGram,
      buyGoldValue: quote.totalPayable,
      buyValue: quote.totalPayable,
      breakdown: quote,
      presets,
      paymentMethods,
      product: targetProduct
    };
  }

  async buyGold(userId, { amount, grams, weightGrams, buyType = 'VIRTUAL', deliveryAddress = null, productDetails = null, paymentMethod = 'UPI', productId = null, paymentDetails = null }) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const user = await User.findById(userObjectId);
    if (!user) throw new Error('User not found');

    const isPhysical = buyType && buyType.toUpperCase() === 'PHYSICAL';
    const { rate24k } = await this.getLiveRates();
    const actualPricePerGram = rate24k.actualPricePerGram || rate24k.pricePerGram;
    const buyPricePerGram = rate24k.buyPricePerGram || Math.round(actualPricePerGram * 1.05 * 100) / 100;

    let targetProduct = null;
    if (productId) {
      targetProduct = await Product.findById(productId);
    }

    const effectiveWeight = targetProduct?.weightGrams || grams || weightGrams;
    const makingCharges = targetProduct?.makingCharges || productDetails?.makingCharges || 0;
    const deliveryFee = targetProduct?.deliveryFee || productDetails?.deliveryFee || 0;

    const breakdown = this.calculateBreakdown(
      {
        amount: targetProduct ? null : amount,
        grams: effectiveWeight,
        weightGrams: effectiveWeight,
        buyType,
        itemType: targetProduct?.category || productDetails?.itemType || 'COIN',
        makingCharges,
        deliveryFee
      },
      buyPricePerGram,
      actualPricePerGram
    );

    const rawMethod = (paymentMethod || (isPhysical ? 'COD' : 'ONLINE')).toUpperCase();
    const isCOD = rawMethod === 'COD' || rawMethod === 'CASH_ON_DELIVERY';
    const isWalletPay = rawMethod === 'WALLET' || rawMethod === 'TIAZ_WALLET';

    const productName = targetProduct?.name || productDetails?.productName || breakdown.productName;

    const finalDeliveryAddress = deliveryAddress || {
      recipientName: user.fullName || 'Customer',
      recipientPhone: user.mobile || '',
      addressLine: user.address?.street || user.address?.addressLine || 'Address pending verification call',
      city: user.address?.city || '',
      state: user.address?.state || '',
      pincode: user.address?.pincode || ''
    };

    // ==================== 1. PHYSICAL BUY FLOW ====================
    if (isPhysical) {
      const orderNumber = 'GO-PHY-' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

      // --- CASE A: CASH ON DELIVERY (COD) ---
      // Requirement: "yadi cod hai to physical buy main transation nhi bnega sirf order create hoga"
      if (isCOD) {
        const order = await GoldOrder.create({
          userId: userObjectId,
          orderNumber,
          type: 'BUY',
          buyType: 'PHYSICAL',
          productId: targetProduct?._id || null,
          quantity: breakdown.grams,
          goldRate: breakdown.ratePerGram,
          grossAmount: breakdown.grossAmount,
          gstAmount: breakdown.gstAmount,
          makingCharges: breakdown.makingCharges,
          deliveryFee: breakdown.deliveryFee,
          otherCharges: 0,
          finalAmount: breakdown.totalPayable,
          productDetails: {
            itemType: targetProduct?.category || productDetails?.itemType || 'COIN',
            weightGrams: breakdown.grams,
            purity: targetProduct?.purity || '24K (99.9%)',
            mintPartner: targetProduct?.mintPartner || 'MMTC-PAMP',
            productName
          },
          deliveryAddress: finalDeliveryAddress,
          courierDetails: null,
          status: 'REQUESTED', // Purchase request awaiting admin verification call
          paymentMethod: 'COD',
          paymentStatus: 'PENDING_ON_DELIVERY'
        });

        return {
          success: true,
          buyType: 'PHYSICAL',
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentMethod: 'COD',
          paymentStatus: 'PENDING_ON_DELIVERY',
          message: 'Physical purchase request received. Our team will call you shortly to confirm your order details before dispatch.',
          productName,
          grams: breakdown.grams,
          totalAmount: breakdown.totalPayable,
          deliveryAddress: finalDeliveryAddress,
          order
        };
      }

      // --- CASE B: ONLINE PAYMENT (Razorpay / UPI / Wallet) ---
      // Requirement: "yado online hai razor pay se to transaction history main ajayega ki iss user ne ye prodcut purchafs ekiya ahi iska amount payemnt comlet faiels mtlb jo bhi ohga vo sab or iska bhi ek ore dcretae hoga kynki ye physicaal hai"
      if (isWalletPay) {
        const wallet = await GoldWallet.findOneAndUpdate(
          { userId: userObjectId },
          { $setOnInsert: { userId: userObjectId } },
          { new: true, upsert: true }
        );
        const currentCashBalance = parseFloat((wallet.cashBalance || 0).toString());
        if (currentCashBalance < breakdown.totalPayable) {
          const error = new Error(`Insufficient wallet balance (Available: ₹${currentCashBalance.toFixed(2)}, Required: ₹${breakdown.totalPayable.toFixed(2)}).`);
          error.statusCode = 400;
          throw error;
        }
        wallet.cashBalance = Math.round((currentCashBalance - breakdown.totalPayable) * 100) / 100;
        await wallet.save();
      }

      const paymentNumber = 'PAY' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
      const transactionNumber = 'TXN-GLD-' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

      const payment = await Payment.create({
        userId: userObjectId,
        paymentNumber,
        amount: breakdown.totalPayable,
        currency: 'INR',
        method: isWalletPay ? 'WALLET' : 'UPI',
        status: 'SUCCESS',
        providerPaymentId: paymentDetails?.razorpay_payment_id || null,
        paidAt: new Date()
      });

      const order = await GoldOrder.create({
        userId: userObjectId,
        orderNumber,
        type: 'BUY',
        buyType: 'PHYSICAL',
        productId: targetProduct?._id || null,
        quantity: breakdown.grams,
        goldRate: breakdown.ratePerGram,
        grossAmount: breakdown.grossAmount,
        gstAmount: breakdown.gstAmount,
        makingCharges: breakdown.makingCharges,
        deliveryFee: breakdown.deliveryFee,
        otherCharges: 0,
        finalAmount: breakdown.totalPayable,
        productDetails: {
          itemType: targetProduct?.category || productDetails?.itemType || 'COIN',
          weightGrams: breakdown.grams,
          purity: targetProduct?.purity || '24K (99.9%)',
          mintPartner: targetProduct?.mintPartner || 'MMTC-PAMP',
          productName
        },
        deliveryAddress: finalDeliveryAddress,
        courierDetails: null,
        status: 'REQUESTED', // Purchase request awaiting admin call to confirm delivery address
        paymentMethod: isWalletPay ? 'WALLET' : 'ONLINE',
        paymentStatus: 'COMPLETED',
        paymentId: payment._id
      });

      payment.orderId = order._id;
      await payment.save();

      // Transaction entry in user's transaction history
      const transaction = await Transaction.create({
        userId: userObjectId,
        transactionNumber,
        metalType: 'GOLD',
        buyType: 'PHYSICAL',
        type: 'BUY',
        direction: 'DEBIT',
        amount: breakdown.totalPayable,
        quantity: breakdown.grams,
        rate: buyPricePerGram,
        goldQuantity: breakdown.grams,
        goldRate: buyPricePerGram,
        gstAmount: breakdown.gstAmount,
        makingCharges: breakdown.makingCharges,
        productName,
        deliveryAddress: finalDeliveryAddress,
        deliveryStatus: 'PROCESSING',
        referenceType: 'GoldOrder',
        referenceId: order._id,
        status: 'COMPLETED',
        description: `Bought ${breakdown.grams}g Physical 24K Gold (${productName}) via Online Payment`
      });

      return {
        success: true,
        buyType: 'PHYSICAL',
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: 'COMPLETED',
        message: 'Payment completed! Order placed successfully. Our team will verify and dispatch your product.',
        order,
        transaction
      };
    }

    // ==================== 2. VIRTUAL BUY FLOW ====================
    // Requirement: "or virutla ka vahi hoga usme acount amin jaygea gold ki usne kitan agold ya silver purchase kiya hai isme vo online hi hoga ya wallet hoga jisme direct puachse crate hoga lekin usme vo type ohag virtual or transtion maain uski detail hogi"
    const wallet = await GoldWallet.findOneAndUpdate(
      { userId: userObjectId },
      { $setOnInsert: { userId: userObjectId } },
      { new: true, upsert: true }
    );
    const currentCashBalance = parseFloat((wallet.cashBalance || 0).toString());

    if (isWalletPay) {
      if (currentCashBalance < breakdown.totalPayable) {
        const error = new Error(`Insufficient Tia'z Wallet balance (Available: ₹${currentCashBalance.toFixed(2)}, Required: ₹${breakdown.totalPayable.toFixed(2)}). Please choose UPI or add money.`);
        error.statusCode = 400;
        throw error;
      }
      wallet.cashBalance = Math.round((currentCashBalance - breakdown.totalPayable) * 100) / 100;
    }

    if (!isWalletPay) {
      const rzpOrderId = paymentDetails?.razorpay_order_id;
      const rzpPaymentId = paymentDetails?.razorpay_payment_id;
      const rzpSignature = paymentDetails?.razorpay_signature;

      if (rzpOrderId && rzpPaymentId && rzpSignature) {
        razorpayService.verifyPaymentSignature({
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          razorpay_signature: rzpSignature
        });
      }
    }

    const orderNumber = 'GO-VIR-' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
    const transactionNumber = 'TXN-GLD-' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
    const paymentNumber = 'PAY' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

    const payment = await Payment.create({
      userId: userObjectId,
      paymentNumber,
      amount: breakdown.totalPayable,
      currency: 'INR',
      method: isWalletPay ? 'WALLET' : 'UPI',
      status: 'SUCCESS',
      providerPaymentId: paymentDetails?.razorpay_payment_id || null,
      paidAt: new Date()
    });

    const order = await GoldOrder.create({
      userId: userObjectId,
      orderNumber,
      type: 'BUY',
      buyType: 'VIRTUAL',
      quantity: breakdown.grams,
      goldRate: breakdown.ratePerGram,
      grossAmount: breakdown.grossAmount,
      gstAmount: breakdown.gstAmount,
      makingCharges: 0,
      deliveryFee: 0,
      otherCharges: 0,
      finalAmount: breakdown.totalPayable,
      productDetails: {
        itemType: 'VIRTUAL',
        weightGrams: breakdown.grams,
        purity: '24K (99.9%)',
        mintPartner: 'MMTC-PAMP',
        productName: breakdown.productName
      },
      deliveryAddress: null,
      courierDetails: null,
      status: 'COMPLETED',
      paymentMethod: isWalletPay ? 'WALLET' : 'ONLINE',
      paymentStatus: 'COMPLETED',
      paymentId: payment._id,
      completedAt: new Date()
    });

    payment.orderId = order._id;
    await payment.save();

    // Credit gold holdings into user's wallet
    const prevAvailable = parseFloat((wallet.availableGold || 0).toString());
    const prevVirtual = parseFloat((wallet.virtualGold || 0).toString());
    const prevPurchased = parseFloat((wallet.totalGoldPurchased || 0).toString());
    const prevInvested = parseFloat((wallet.totalInvested || 0).toString());

    const newVirtual = Math.round((prevVirtual + breakdown.grams) * 10000) / 10000;
    const newAvailable = Math.round((prevAvailable + breakdown.grams) * 10000) / 10000;
    const newPurchased = Math.round((prevPurchased + breakdown.grams) * 10000) / 10000;
    const newInvested = Math.round((prevInvested + breakdown.totalPayable) * 100) / 100;
    const newCurrentValue = Math.round((newAvailable * actualPricePerGram) * 100) / 100;
    const newAveragePrice = newPurchased > 0 ? Math.round((newInvested / newPurchased) * 100) / 100 : buyPricePerGram;
    const newProfitLoss = Math.round((newCurrentValue - newInvested) * 100) / 100;

    wallet.virtualGold = newVirtual;
    wallet.availableGold = newAvailable;
    wallet.totalGoldPurchased = newPurchased;
    wallet.totalInvested = newInvested;
    wallet.currentValue = newCurrentValue;
    wallet.averageBuyPrice = newAveragePrice;
    wallet.profitLoss = newProfitLoss;
    await wallet.save();

    const transaction = await Transaction.create({
      userId: userObjectId,
      transactionNumber,
      metalType: 'GOLD',
      buyType: 'VIRTUAL',
      type: 'BUY',
      direction: 'DEBIT',
      amount: breakdown.totalPayable,
      quantity: breakdown.grams,
      rate: buyPricePerGram,
      goldQuantity: breakdown.grams,
      goldRate: buyPricePerGram,
      gstAmount: breakdown.gstAmount,
      makingCharges: 0,
      productName: breakdown.productName,
      deliveryAddress: null,
      courierPartner: null,
      deliveryStatus: 'NOT_APPLICABLE',
      referenceType: 'GoldOrder',
      referenceId: order._id,
      status: 'COMPLETED',
      description: `Bought ₹${breakdown.totalPayable} (${breakdown.grams}g) 24K Virtual Gold into vault (5% markup)`
    });

    return {
      success: true,
      buyType: 'VIRTUAL',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        purity: '24K Gold',
        grams: breakdown.grams,
        formattedGrams: breakdown.formattedGrams,
        ratePerGram: breakdown.ratePerGram,
        formattedRate: breakdown.formattedRate,
        grossAmount: breakdown.grossAmount,
        makingCharges: 0,
        gstAmount: breakdown.gstAmount,
        totalPayable: breakdown.totalPayable,
        formattedTotalPayable: breakdown.formattedTotalPayable,
        paymentMethod: isWalletPay ? "Tia'z Wallet" : "Online Payment",
        completedAt: order.completedAt
      },
      wallet: {
        availableGold: newAvailable,
        formattedAvailableGold: `${newAvailable.toFixed(4)} gm`,
        virtualGold: newVirtual,
        totalInvested: newInvested,
        currentValue: newCurrentValue,
        averageBuyPrice: newAveragePrice,
        profitLoss: newProfitLoss
      },
      transaction
    };
  }

  // ==================== SELL GOLD FLOW ====================

  async getSellScreenData(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const { rate24k } = await this.getLiveRates();
    const pricePerGram = rate24k.sellPricePerGram || rate24k.pricePerGram;

    const [wallet, bankAccounts] = await Promise.all([
      GoldWallet.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true }
      ),
      BankAccount.find({ userId: userObjectId, verificationStatus: 'verified' })
        .select('-accountNumberEncrypted')
        .sort({ isPrimary: -1, createdAt: -1 })
    ]);

    const availableGold = parseFloat((wallet.availableGold || 0).toString());
    const cashBalance = parseFloat((wallet.cashBalance || 0).toString());
    const sellableValue = Math.round(availableGold * pricePerGram * 100) / 100;

    // Presets matching screenshot 24/25:
    // 0.50 gm, 1.00 gm, 1.50 gm, Max
    const fixedGrams = [0.5, 1.0, 1.5];
    const presets = fixedGrams.map((g, index) => {
      const amt = Math.round(g * pricePerGram * 100) / 100;
      return {
        grams: g,
        formattedGrams: `${g.toFixed(2)} gm`,
        amount: amt,
        formattedAmount: `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isAvailable: availableGold >= g,
        isSelected: index === 0
      };
    });

    presets.push({
      grams: availableGold,
      formattedGrams: 'Max',
      amount: sellableValue,
      formattedAmount: `₹${sellableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isAvailable: availableGold > 0,
      isSelected: false,
      isMax: true
    });

    // Default selection is 0.50 gm or availableGold
    const defaultGrams = availableGold >= 0.5 ? 0.5 : (availableGold > 0 ? availableGold : 0.5);
    const defaultAmount = Math.round(defaultGrams * pricePerGram * 100) / 100;

    const initialQuote = {
      goldQuantity: defaultGrams,
      formattedQuantity: `${defaultGrams.toFixed(2)} gm (approx.)`,
      pricePerGram: pricePerGram,
      formattedPricePerGram: `₹${pricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      estimatedAmount: defaultAmount,
      formattedEstimatedAmount: `₹${defaultAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (after charges)`,
      charges: 0,
      formattedCharges: '₹0.00',
      hasSufficientBalance: availableGold >= defaultGrams
    };

    const payoutOptions = {
      wallet: {
        id: 'WALLET',
        title: "Tia'z Wallet",
        availableBalance: cashBalance,
        formattedBalance: `Available Balance: ₹${cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isDefault: true
      },
      bankAccounts: bankAccounts || []
    };

    return {
      liveGoldPrice: {
        purity: '24K',
        badge: '• LIVE',
        pricePerGram: pricePerGram,
        formattedPrice: `₹${pricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / gm`,
        changeAmount: rate24k.changeAmount,
        changePercentage: rate24k.changePercentage,
        isPositive: rate24k.isPositive,
        formattedChange: rate24k.formattedChange,
        timestamp: rate24k.timestamp,
        currency: 'INR',
        chartTimeframes: ['1D', '1W', '1M', '1Y', 'ALL']
      },
      sellableGold: {
        grams: availableGold,
        formattedGrams: `${availableGold.toFixed(4)} gm`,
        currentValue: sellableValue,
        formattedCurrentValue: `₹${sellableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Current Value)`
      },
      presets,
      initialQuote,
      payoutOptions
    };
  }

  async calculateSellQuote(userId, { grams, amount }) {
    const { rate24k } = await this.getLiveRates();
    const pricePerGram = rate24k.sellPricePerGram || rate24k.pricePerGram;

    let sellGrams = 0;
    if (grams) {
      sellGrams = parseFloat(parseFloat(grams).toFixed(4));
    } else if (amount) {
      sellGrams = parseFloat((parseFloat(amount) / pricePerGram).toFixed(4));
    } else {
      throw new Error('Please enter quantity in grams or amount');
    }

    if (sellGrams <= 0) throw new Error('Sell quantity must be greater than zero');

    const estimatedAmount = Math.round(sellGrams * pricePerGram * 100) / 100;

    let availableGold = 0;
    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId.toString());
      const wallet = await GoldWallet.findOne({ userId: userObjectId });
      if (wallet && wallet.availableGold) {
        availableGold = parseFloat(wallet.availableGold.toString());
      }
    }

    return {
      goldQuantity: sellGrams,
      formattedQuantity: `${sellGrams.toFixed(2)} gm (approx.)`,
      pricePerGram: pricePerGram,
      sellPricePerGram: pricePerGram,
      liveRatePerGram: rate24k.actualPricePerGram || rate24k.pricePerGram,
      formattedPricePerGram: `₹${pricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      charges: 0,
      formattedCharges: '₹0.00',
      estimatedAmount: estimatedAmount,
      sellGoldValue: estimatedAmount,
      sellValue: estimatedAmount,
      formattedEstimatedAmount: `₹${estimatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (after charges)`,
      hasSufficientBalance: availableGold >= sellGrams,
      availableGold,
      formattedAvailableGold: `${availableGold.toFixed(4)} gm`
    };
  }

  async sellGold(userId, { grams, amount, payoutDestination = 'WALLET', bankAccountId }) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const { rate24k } = await this.getLiveRates();
    const pricePerGram = rate24k.sellPricePerGram || rate24k.pricePerGram;

    const wallet = await GoldWallet.findOne({ userId: userObjectId });
    if (!wallet) throw new Error('Wallet not found');

    const availableGold = parseFloat((wallet.availableGold || 0).toString());

    let sellGrams = 0;
    if (grams) {
      sellGrams = parseFloat(parseFloat(grams).toFixed(4));
    } else if (amount) {
      sellGrams = parseFloat((parseFloat(amount) / pricePerGram).toFixed(4));
    } else {
      throw new Error('Please specify grams or amount to sell');
    }

    if (sellGrams <= 0) {
      throw new Error('Sell quantity must be greater than 0');
    }

    if (sellGrams > availableGold) {
      throw new Error(`Insufficient gold balance. You have ${availableGold.toFixed(4)} gm available.`);
    }

    const destination = (payoutDestination || 'WALLET').toUpperCase();
    let bank = null;
    if (destination === 'BANK') {
      if (!bankAccountId) throw new Error('Please select a bank account for bank payout');
      bank = await BankAccount.findOne({ _id: bankAccountId, userId: userObjectId });
      if (!bank) throw new Error('Selected bank account was not found or is invalid');
    }

    const estimatedAmount = Math.round(sellGrams * pricePerGram * 100) / 100;
    const orderNumber = 'SO' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
    const transactionNumber = 'TXN' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

    // 1. Create GoldOrder
    const order = await GoldOrder.create({
      userId: userObjectId,
      orderNumber,
      type: 'SELL',
      quantity: sellGrams,
      goldRate: pricePerGram,
      grossAmount: estimatedAmount,
      gstAmount: 0,
      makingCharges: 0,
      otherCharges: 0,
      finalAmount: estimatedAmount,
      status: 'COMPLETED',
      completedAt: new Date()
    });

    // 2. Update GoldWallet
    const newAvailableGold = Math.round((availableGold - sellGrams) * 10000) / 10000;
    const prevSold = parseFloat((wallet.totalGoldSold || 0).toString());
    const newTotalSold = Math.round((prevSold + sellGrams) * 10000) / 10000;
    const newCurrentValue = Math.round(newAvailableGold * pricePerGram * 100) / 100;

    // Deduct from virtualGold first, then physicalGold
    const curVirtual = parseFloat((wallet.virtualGold || 0).toString());
    if (curVirtual >= sellGrams) {
      wallet.virtualGold = Math.round((curVirtual - sellGrams) * 10000) / 10000;
    } else {
      wallet.virtualGold = 0;
      const curPhysical = parseFloat((wallet.physicalGold || 0).toString());
      wallet.physicalGold = Math.max(0, Math.round((curPhysical - (sellGrams - curVirtual)) * 10000) / 10000);
    }

    wallet.availableGold = newAvailableGold;
    wallet.totalGoldSold = newTotalSold;
    wallet.currentValue = newCurrentValue;

    // If credited to Tia'z Wallet, add funds directly
    if (destination === 'WALLET' || destination === 'TIAZ_WALLET') {
      const prevCash = parseFloat((wallet.cashBalance || 0).toString());
      wallet.cashBalance = Math.round((prevCash + estimatedAmount) * 100) / 100;
    }

    await wallet.save();

    // 3. Create Transaction Record (Sold at 100% actual rate)
    const payoutName = (destination === 'WALLET' || destination === 'TIAZ_WALLET')
      ? "Tia'z Wallet"
      : `${bank.bankName} (A/C: *${bank.accountNumberLast4})`;

    await Transaction.create({
      userId: userObjectId,
      transactionNumber,
      metalType: 'GOLD',
      type: 'SELL',
      direction: 'CREDIT',
      amount: estimatedAmount,
      quantity: sellGrams,
      rate: pricePerGram,
      goldQuantity: sellGrams,
      goldRate: pricePerGram,
      referenceType: 'GoldOrder',
      referenceId: order._id,
      status: 'COMPLETED',
      deliveryStatus: 'NOT_APPLICABLE',
      description: `Sold ${sellGrams}g 24K Gold at actual rate (₹${pricePerGram}/gm) to ${payoutName}`
    });

    return {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        purity: '24K Gold',
        grams: sellGrams,
        formattedGrams: `${sellGrams.toFixed(4)} gm`,
        goldRate: pricePerGram,
        formattedRate: `₹${pricePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        receivedAmount: estimatedAmount,
        formattedReceivedAmount: `₹${estimatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        payoutDestination: payoutName,
        completedAt: order.completedAt
      },
      wallet: {
        availableGold: newAvailableGold,
        formattedAvailableGold: `${newAvailableGold.toFixed(4)} gm`,
        cashBalance: parseFloat((wallet.cashBalance || 0).toString()),
        formattedCashBalance: `₹${parseFloat((wallet.cashBalance || 0).toString()).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        currentValue: newCurrentValue,
        formattedCurrentValue: `₹${newCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalGoldSold: newTotalSold
      }
    };
  }

  async getOrders(userId, { page = 1, limit = 10, type }) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const query = { userId: userObjectId };
    if (type) query.type = type.toUpperCase();

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      GoldOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      GoldOrder.countDocuments(query)
    ]);

    return { orders, total };
  }

  async updateGoldRate(rateData) {
    return rateScraperService.updateManualGoldRate(rateData);
  }

  async createRazorpayOrder(userId, { amount, grams, productId = null }) {
    const quote = await this.calculateBuyQuote(userId, { amount, grams, productId });
    return await razorpayService.createOrder({
      amount: quote.buyGoldValue,
      currency: 'INR',
      notes: {
        userId: userId.toString(),
        metalType: 'GOLD',
        grams: quote.breakdown.grams,
        purpose: 'VIRTUAL_GOLD_BUY'
      }
    });
  }
}

module.exports = new GoldService();

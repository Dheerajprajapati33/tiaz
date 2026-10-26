const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const rateScraperService = require('./rateScraper.service');
const rateSettingService = require('./rateSetting.service');
const SilverOrder = require('../models/SilverOrder');
const SilverWallet = require('../models/SilverWallet');
const GoldWallet = require('../models/GoldWallet');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const razorpayService = require('./razorpay.service');
const crypto = require('crypto');

class SilverService {
  /**
   * Get Live Silver Rates for 999 Fine and 925 Sterling
   */
  async getLiveRates() {
    const rateSettings = await rateSettingService.getSettings();
    const buyMarkup = Number(rateSettings.silverBuyMarkupPercent ?? 5.0);
    const sellDiscount = Number(rateSettings.silverSellDiscountPercent ?? 0.0);
    const buyMultiplier = 1 + (buyMarkup / 100);
    const sellMultiplier = 1 - (sellDiscount / 100);

    const liveSilver = rateScraperService.getLiveSilverRates();
    const price999 = liveSilver.silver999;
    const buyPrice999 = Math.round((price999 * buyMultiplier) * 100) / 100;
    const sellPrice999 = Math.round((price999 * sellMultiplier) * 100) / 100;
    const diff999 = liveSilver.change999;
    const diffPercent999 = liveSilver.changePercentage999;

    const price925 = liveSilver.silver925 || Math.round(price999 * (925 / 999) * 100) / 100;
    const buyPrice925 = Math.round((price925 * buyMultiplier) * 100) / 100;
    const sellPrice925 = Math.round((price925 * sellMultiplier) * 100) / 100;

    return {
      rate999: {
        purity: '999 Fine',
        badge: '999 SILVER RATE • LIVE',
        fineness: 999,
        actualPricePerGram: price999,
        buyPricePerGram: buyPrice999,
        sellPricePerGram: sellPrice999,
        pricePerGram: price999,
        pricePerKg: Math.round(price999 * 1000 * 100) / 100,
        buyMarkupPercentage: buyMarkup,
        sellDiscountPercentage: sellDiscount,
        formattedPrice: `₹${price999.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        formattedBuyPrice: `₹${buyPrice999.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (+${buyMarkup}%)`,
        formattedSellPrice: `₹${sellPrice999.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm${sellDiscount > 0 ? ` (-${sellDiscount}%)` : ' (Actual)'}`,
        formattedPriceKg: `₹${Math.round(price999 * 1000).toLocaleString('en-IN')} /kg`,
        changeAmount: Math.round(diff999 * 100) / 100,
        changePercentage: Math.round(diffPercent999 * 100) / 100,
        isPositive: diff999 >= 0,
        formattedChange: `${diff999 >= 0 ? '+' : ''}₹${Math.abs(diff999).toFixed(2)} (${Math.abs(diffPercent999).toFixed(2)}%) ${diff999 >= 0 ? '↗' : '↘'}`,
        timestamp: liveSilver.updatedAt,
        effectiveFrom: liveSilver.updatedAt,
        currency: 'INR'
      },
      rate925: {
        purity: '925 Sterling',
        badge: '925 SILVER RATE • LIVE',
        fineness: 925,
        pricePerGram: price925,
        actualPricePerGram: price925,
        buyPricePerGram: buyPrice925,
        sellPricePerGram: sellPrice925,
        pricePerKg: Math.round(price925 * 1000 * 100) / 100,
        buyMarkupPercentage: buyMarkup,
        sellDiscountPercentage: sellDiscount,
        formattedPrice: `₹${price925.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
        formattedBuyPrice: `₹${buyPrice925.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm (+${buyMarkup}%)`,
        formattedSellPrice: `₹${sellPrice925.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm${sellDiscount > 0 ? ` (-${sellDiscount}%)` : ' (Actual)'}`,
        formattedPriceKg: `₹${Math.round(price925 * 1000).toLocaleString('en-IN')} /kg`,
        changeAmount: Math.round(diff999 * (925 / 999) * 100) / 100,
        changePercentage: Math.round(diffPercent999 * 100) / 100,
        isPositive: diff999 >= 0,
        timestamp: liveSilver.updatedAt,
        effectiveFrom: liveSilver.updatedAt,
        currency: 'INR'
      }
    };
  }

  // ==================== BUY SILVER FLOW ====================

  calculateBreakdown({ amount, grams, weightGrams, buyType = 'VIRTUAL', itemType = 'BAR', makingCharges = 0, deliveryFee = 0, directPrice = null, customProductName = null }, buyPricePerGram, actualPricePerGram) {
    const effectiveGrams = grams || weightGrams;
    const isPhysical = buyType && buyType.toUpperCase() === 'PHYSICAL';
    let buyGrams = 0;
    let grossAmount = 0;
    let gstAmount = 0;
    let customMaking = parseFloat(makingCharges) || 0;
    let customDelivery = parseFloat(deliveryFee) || 0;
    let totalPayable = 0;
    const gstRate = 0.03; // 3% GST for bullion

    if (isPhysical) {
      if (directPrice && Number(directPrice) > 0) {
        totalPayable = Math.round(Number(directPrice) * 100) / 100;
        gstAmount = Math.round((totalPayable * gstRate / (1 + gstRate)) * 100) / 100;
        grossAmount = Math.round((totalPayable - gstAmount) * 100) / 100;
        buyGrams = effectiveGrams ? parseFloat(parseFloat(effectiveGrams).toFixed(4)) : 10.0;
      } else {
        if (effectiveGrams) {
          buyGrams = parseFloat(parseFloat(effectiveGrams).toFixed(4));
        } else if (amount) {
          buyGrams = parseFloat((parseFloat(amount) / buyPricePerGram).toFixed(4));
        } else {
          buyGrams = 10.0; // default 10g
        }

        if (buyGrams < 0.01) throw new Error('Minimum physical silver purchase is 0.01 gm');

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
        if (buyGrams < 0.01) throw new Error('Minimum buy weight is 0.01 gm');

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
      ? `${buyGrams}g 999 Physical Silver (${itemType || 'Bar'})`
      : '999 Fine Digital Silver (Virtual Vault Accumulation)';

    const computedMarkup = actualPricePerGram > 0
      ? Math.round(((buyPricePerGram - actualPricePerGram) / actualPricePerGram) * 1000) / 10
      : 5.0;

    return {
      buyType: isPhysical ? 'PHYSICAL' : 'VIRTUAL',
      productName,
      conversionText,
      grams: buyGrams,
      formattedGrams: `${buyGrams.toFixed(4)} gm`,
      purity: '999 Fine Silver (99.9%)',
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

  async calculateBuyQuote(userId, { amount, grams, weightGrams, buyType = 'VIRTUAL', itemType = 'BAR', productId = null }) {
    const ratesData = await this.getLiveRates();
    const actualPricePerGram = ratesData.rate999.actualPricePerGram || ratesData.rate999.pricePerGram;
    const buyPricePerGram = ratesData.rate999.buyPricePerGram || Math.round(actualPricePerGram * 1.05 * 100) / 100;

    let targetProduct = null;
    if (productId) {
      targetProduct = await Product.findById(productId);
    }

    const effectiveWeight = targetProduct?.weightGrams || grams || weightGrams;
    const directPrice = targetProduct?.price;

    const breakdown = this.calculateBreakdown(
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

    // Preset amount chips: ₹500, ₹1000, ₹2000, ₹5000, ₹10000
    const presetAmounts = [500, 1000, 2000, 5000, 10000];
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
            isSufficient: cashBalance >= breakdown.totalPayable,
            isSelected: cashBalance >= breakdown.totalPayable
          },
          {
            id: 'ONLINE',
            title: 'Online Payment (Razorpay / UPI)',
            subtitle: 'Pay using UPI, Card or Netbanking',
            isSelected: cashBalance < breakdown.totalPayable
          }
        ];

    return {
      liveRate: ratesData.rate999,
      liveRatePerGram: actualPricePerGram,
      buyPricePerGram,
      buySilverValue: breakdown.totalPayable,
      buyValue: breakdown.totalPayable,
      breakdown,
      presets,
      paymentMethods,
      product: targetProduct,
      lockedPrice: buyPricePerGram,
      lockExpiresInSeconds: 300,
      validUntil: new Date(Date.now() + 300 * 1000)
    };
  }

  async buySilver(userId, { amount, grams, weightGrams, buyType = 'VIRTUAL', deliveryAddress = null, productDetails = null, paymentMethod = 'UPI', productId = null, paymentDetails = null }) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const user = await User.findById(userObjectId);
    if (!user) throw new Error('User not found');

    const isPhysical = buyType && buyType.toUpperCase() === 'PHYSICAL';
    const ratesData = await this.getLiveRates();
    const actualPricePerGram = ratesData.rate999.actualPricePerGram || ratesData.rate999.pricePerGram;
    const buyPricePerGram = ratesData.rate999.buyPricePerGram || Math.round(actualPricePerGram * 1.05 * 100) / 100;

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
        itemType: targetProduct?.category || productDetails?.itemType || 'BAR',
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
      const orderNumber = 'SLV-PHY-' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

      // --- CASE A: CASH ON DELIVERY (COD) ---
      // Requirement: "yadi cod hai to physical buy main transation nhi bnega sirf order create hoga"
      if (isCOD) {
        const order = await SilverOrder.create({
          userId: userObjectId,
          orderNumber,
          type: 'BUY',
          buyType: 'PHYSICAL',
          productId: targetProduct?._id || null,
          quantity: breakdown.grams,
          silverRate: breakdown.ratePerGram,
          grossAmount: breakdown.grossAmount,
          gstAmount: breakdown.gstAmount,
          makingCharges: breakdown.makingCharges,
          deliveryFee: breakdown.deliveryFee,
          otherCharges: 0,
          finalAmount: breakdown.totalPayable,
          productDetails: {
            itemType: targetProduct?.category || productDetails?.itemType || 'BAR',
            weightGrams: breakdown.grams,
            purity: targetProduct?.purity || '999 Fine (99.9%)',
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
        let goldWallet = await GoldWallet.findOne({ userId: userObjectId });
        const currentCash = goldWallet ? parseFloat((goldWallet.cashBalance || 0).toString()) : 0;
        if (currentCash < breakdown.totalPayable) {
          throw new Error(`Insufficient Tia'z Wallet balance (Available: ₹${currentCash.toFixed(2)}, Required: ₹${breakdown.totalPayable.toFixed(2)}). Please choose UPI or add money.`);
        }
        goldWallet.cashBalance = Math.round((currentCash - breakdown.totalPayable) * 100) / 100;
        await goldWallet.save();
      }

      const paymentNumber = 'PAY' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
      const txnNumber = 'TXN-SLV-' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

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

      const order = await SilverOrder.create({
        userId: userObjectId,
        orderNumber,
        type: 'BUY',
        buyType: 'PHYSICAL',
        productId: targetProduct?._id || null,
        quantity: breakdown.grams,
        silverRate: breakdown.ratePerGram,
        grossAmount: breakdown.grossAmount,
        gstAmount: breakdown.gstAmount,
        makingCharges: breakdown.makingCharges,
        deliveryFee: breakdown.deliveryFee,
        otherCharges: 0,
        finalAmount: breakdown.totalPayable,
        productDetails: {
          itemType: targetProduct?.category || productDetails?.itemType || 'BAR',
          weightGrams: breakdown.grams,
          purity: targetProduct?.purity || '999 Fine (99.9%)',
          mintPartner: targetProduct?.mintPartner || 'MMTC-PAMP',
          productName
        },
        deliveryAddress: finalDeliveryAddress,
        courierDetails: null,
        status: 'REQUESTED',
        paymentMethod: isWalletPay ? 'WALLET' : 'ONLINE',
        paymentStatus: 'COMPLETED',
        paymentId: payment._id
      });

      payment.orderId = order._id;
      await payment.save();

      const transaction = await Transaction.create({
        userId: userObjectId,
        transactionNumber: txnNumber,
        metalType: 'SILVER',
        buyType: 'PHYSICAL',
        type: 'BUY',
        direction: 'DEBIT',
        amount: breakdown.totalPayable,
        gstAmount: breakdown.gstAmount,
        makingCharges: breakdown.makingCharges,
        quantity: breakdown.grams,
        rate: buyPricePerGram,
        goldQuantity: breakdown.grams,
        goldRate: buyPricePerGram,
        productName,
        deliveryAddress: finalDeliveryAddress,
        deliveryStatus: 'PROCESSING',
        referenceType: 'SilverOrder',
        referenceId: order._id,
        status: 'COMPLETED',
        description: `Bought ${breakdown.grams}g Physical 999 Silver (${productName}) via Online Payment`
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
    if (isWalletPay) {
      let goldWallet = await GoldWallet.findOne({ userId: userObjectId });
      const currentCash = goldWallet ? parseFloat((goldWallet.cashBalance || 0).toString()) : 0;
      if (currentCash < breakdown.totalPayable) {
        throw new Error(`Insufficient Tia'z Wallet balance (Available: ₹${currentCash.toFixed(2)}, Required: ₹${breakdown.totalPayable.toFixed(2)}). Please choose UPI or add money.`);
      }
      goldWallet.cashBalance = Math.round((currentCash - breakdown.totalPayable) * 100) / 100;
      await goldWallet.save();
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

    const orderNumber = 'SLV-VIR-' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
    const txnNumber = 'TXN-SLV-' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
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

    const order = await SilverOrder.create({
      userId: userObjectId,
      orderNumber,
      type: 'BUY',
      buyType: 'VIRTUAL',
      quantity: breakdown.grams,
      silverRate: breakdown.ratePerGram,
      grossAmount: breakdown.grossAmount,
      gstAmount: breakdown.gstAmount,
      makingCharges: 0,
      deliveryFee: 0,
      finalAmount: breakdown.totalPayable,
      productDetails: {
        itemType: 'VIRTUAL',
        weightGrams: breakdown.grams,
        purity: '999 Fine (99.9%)',
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

    const transaction = await Transaction.create({
      userId: userObjectId,
      transactionNumber: txnNumber,
      metalType: 'SILVER',
      buyType: 'VIRTUAL',
      type: 'BUY',
      direction: 'DEBIT',
      amount: breakdown.totalPayable,
      gstAmount: breakdown.gstAmount,
      makingCharges: 0,
      quantity: breakdown.grams,
      rate: buyPricePerGram,
      goldQuantity: breakdown.grams,
      goldRate: buyPricePerGram,
      productName: breakdown.productName,
      purity: '999 Fine (99.9%)',
      deliveryAddress: null,
      courierPartner: null,
      deliveryStatus: 'NOT_APPLICABLE',
      status: 'COMPLETED',
      referenceType: 'SilverOrder',
      referenceId: order._id,
      description: `Bought ₹${breakdown.totalPayable} (${breakdown.grams}g) 999 Fine Virtual Silver into vault (5% markup)`
    });

    // Credit silver holdings in SilverWallet
    let wallet = await SilverWallet.findOne({ userId: userObjectId });
    if (!wallet) {
      wallet = await SilverWallet.create({
        userId: userObjectId,
        availableSilver: breakdown.grams,
        virtualSilver: breakdown.grams,
        physicalSilver: 0,
        totalSilverPurchased: breakdown.grams,
        totalInvested: breakdown.totalPayable,
        averageBuyPrice: buyPricePerGram,
        currentValue: Math.round(breakdown.grams * actualPricePerGram * 100) / 100
      });
    } else {
      const currentAvailable = parseFloat((wallet.availableSilver || 0).toString());
      const currentVirtual = parseFloat((wallet.virtualSilver || 0).toString());
      const currentPurchased = parseFloat((wallet.totalSilverPurchased || 0).toString());
      const currentInvested = parseFloat((wallet.totalInvested || 0).toString());

      const newVirtual = currentVirtual + breakdown.grams;
      const newAvailable = currentAvailable + breakdown.grams;
      const newPurchased = currentPurchased + breakdown.grams;
      const newInvested = currentInvested + breakdown.totalPayable;
      const newAvgPrice = newPurchased > 0 ? newInvested / newPurchased : buyPricePerGram;

      wallet.virtualSilver = newVirtual;
      wallet.availableSilver = newAvailable;
      wallet.totalSilverPurchased = newPurchased;
      wallet.totalInvested = newInvested;
      wallet.averageBuyPrice = newAvgPrice;
      wallet.currentValue = Math.round(newAvailable * actualPricePerGram * 100) / 100;
      await wallet.save();
    }

    return {
      success: true,
      buyType: 'VIRTUAL',
      orderId: order._id,
      orderNumber: order.orderNumber,
      transactionNumber: transaction.transactionNumber,
      metalType: 'SILVER',
      purity: '999 Fine Silver',
      quantity: breakdown.grams,
      formattedGrams: `${breakdown.grams.toFixed(4)} gm`,
      actualRatePerGram: actualPricePerGram,
      ratePerGram: buyPricePerGram,
      grossAmount: breakdown.grossAmount,
      makingCharges: 0,
      gstAmount: breakdown.gstAmount,
      amountPaid: breakdown.totalPayable,
      formattedAmountPaid: `₹${breakdown.totalPayable.toFixed(2)}`,
      walletBalanceSilver: parseFloat(wallet.availableSilver.toString()),
      status: order.status,
      timestamp: order.completedAt || order.createdAt,
      order,
      transaction
    };
  }

  // ==================== SELL SILVER FLOW ====================

  async getSellScreenData(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const ratesData = await this.getLiveRates();
    const liveSellRate = ratesData.rate999.sellPricePerGram || ratesData.rate999.actualPricePerGram || ratesData.rate999.pricePerGram;

    const [silverWallet, goldWallet, bankAccounts] = await Promise.all([
      SilverWallet.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true }
      ),
      GoldWallet.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true }
      ),
      BankAccount.find({ userId: userObjectId, verificationStatus: 'verified' })
        .select('-accountNumberEncrypted')
        .sort({ isPrimary: -1, createdAt: -1 })
    ]);

    const availableSilver = parseFloat((silverWallet.availableSilver || 0).toString());
    const cashBalance = parseFloat((goldWallet.cashBalance || 0).toString());
    const estimatedValue = Math.round(availableSilver * liveSellRate * 100) / 100;

    // Presets for silver: 10 gm, 25 gm, 50 gm, 100 gm, Max
    const fixedGrams = [10, 25, 50, 100];
    const presets = fixedGrams.map((g, index) => {
      const amt = Math.round(g * liveSellRate * 100) / 100;
      return {
        grams: g,
        formattedGrams: `${g.toFixed(2)} gm`,
        amount: amt,
        formattedAmount: `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isAvailable: availableSilver >= g,
        isSelected: index === 0
      };
    });

    presets.push({
      grams: availableSilver,
      formattedGrams: 'Max',
      amount: estimatedValue,
      formattedAmount: `₹${estimatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isAvailable: availableSilver > 0,
      isSelected: false,
      isMax: true
    });

    const defaultGrams = availableSilver >= 10 ? 10 : (availableSilver > 0 ? availableSilver : 10);
    const defaultAmount = Math.round(defaultGrams * liveSellRate * 100) / 100;

    const initialQuote = {
      silverQuantity: defaultGrams,
      formattedQuantity: `${defaultGrams.toFixed(2)} gm (approx.)`,
      pricePerGram: liveSellRate,
      formattedPricePerGram: `₹${liveSellRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      estimatedAmount: defaultAmount,
      formattedEstimatedAmount: `₹${defaultAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (after charges)`,
      charges: 0,
      formattedCharges: '₹0.00',
      hasSufficientBalance: availableSilver >= defaultGrams
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
      liveSilverPrice: {
        purity: '999 Fine',
        badge: '• LIVE',
        pricePerGram: liveSellRate,
        formattedPrice: `₹${liveSellRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / gm`,
        changeAmount: ratesData.rate999.changeAmount,
        changePercentage: ratesData.rate999.changePercentage,
        isPositive: ratesData.rate999.isPositive,
        formattedChange: ratesData.rate999.formattedChange,
        timestamp: ratesData.rate999.timestamp,
        currency: 'INR'
      },
      availableSilver,
      formattedAvailableSilver: `${availableSilver.toFixed(4)} gm`,
      liveSellRate,
      formattedLiveSellRate: `₹${liveSellRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
      estimatedTotalValue: estimatedValue,
      formattedEstimatedTotalValue: `₹${estimatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      presets,
      initialQuote,
      payoutOptions,
      priceLockSeconds: 300,
      purity: '999 Fine Silver'
    };
  }

  async calculateSellQuote(userId, { grams, amount }) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const sellScreen = await this.getSellScreenData(userObjectId);
    const sellRate = sellScreen.liveSellRate;

    let sellGrams = 0;
    let netPayout = 0;

    if (grams) {
      sellGrams = parseFloat(parseFloat(grams).toFixed(4));
      if (sellGrams < 0.01) throw new Error('Minimum sell weight is 0.01 gm');
      if (sellGrams > sellScreen.availableSilver) {
        throw new Error(`Insufficient silver balance. Available: ${sellScreen.availableSilver.toFixed(4)} gm`);
      }
      netPayout = Math.round(sellGrams * sellRate * 100) / 100;
    } else if (amount) {
      netPayout = Math.round(parseFloat(amount) * 100) / 100;
      if (netPayout < 1) throw new Error('Minimum sell amount is ₹1');
      sellGrams = parseFloat((netPayout / sellRate).toFixed(4));
      if (sellGrams > sellScreen.availableSilver) {
        throw new Error(`Insufficient silver balance for ₹${netPayout}. Required: ${sellGrams.toFixed(4)} gm`);
      }
    } else {
      throw new Error('Please enter either grams or amount to sell');
    }

    return {
      grams: sellGrams,
      formattedGrams: `${sellGrams.toFixed(4)} gm`,
      sellRate,
      sellPricePerGram: sellRate,
      liveRatePerGram: sellScreen.liveSilverPrice.pricePerGram,
      formattedSellRate: `₹${sellRate.toFixed(2)} /gm`,
      netPayout,
      sellSilverValue: netPayout,
      sellValue: netPayout,
      formattedNetPayout: `₹${netPayout.toFixed(2)}`,
      deductions: 0,
      purity: '999 Fine Silver',
      lockExpiresInSeconds: 300
    };
  }

  async sellSilver(userId, { grams, amount, payoutDestination = 'WALLET', bankAccountId = null }) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const quote = await this.calculateSellQuote(userObjectId, { grams, amount });

    const wallet = await SilverWallet.findOne({ userId: userObjectId });
    if (!wallet) throw new Error('Silver wallet not found');

    const currentAvailable = parseFloat(wallet.availableSilver.toString());
    if (currentAvailable < quote.grams) {
      throw new Error(`Insufficient silver balance. Available: ${currentAvailable.toFixed(4)} gm`);
    }

    const destination = (payoutDestination || 'WALLET').toUpperCase();
    let bank = null;
    if (destination === 'BANK') {
      if (!bankAccountId) throw new Error('Please select a bank account for bank payout');
      bank = await BankAccount.findOne({ _id: bankAccountId, userId: userObjectId });
      if (!bank) throw new Error('Selected bank account was not found or is invalid');
    }

    const orderNumber = `SLV-SO-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const txnNumber = `TXN-SLV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 1. Create Silver Sell Order
    const order = await SilverOrder.create({
      userId: userObjectId,
      orderNumber,
      type: 'SELL',
      quantity: quote.grams,
      silverRate: quote.sellRate,
      grossAmount: quote.netPayout,
      gstAmount: 0,
      makingCharges: 0,
      finalAmount: quote.netPayout,
      status: 'COMPLETED',
      completedAt: new Date()
    });

    // 2. Create Transaction Ledger Entry
    const transaction = await Transaction.create({
      userId: userObjectId,
      transactionNumber: txnNumber,
      metalType: 'SILVER',
      buyType: 'VIRTUAL',
      type: 'SELL',
      direction: 'CREDIT',
      amount: quote.netPayout,
      quantity: quote.grams,
      rate: quote.sellRate,
      goldQuantity: quote.grams, // backward compatibility
      goldRate: quote.sellRate,
      productName: '999 Fine Silver (Sold at Actual Rate)',
      purity: '999 Fine (99.9%)',
      deliveryStatus: 'NOT_APPLICABLE',
      status: 'COMPLETED',
      referenceType: 'SilverOrder',
      referenceId: order._id,
      description: `Sold ${quote.grams}g 999 Fine Silver at actual rate (₹${quote.sellRate}/gm)`
    });

    // 3. Deduct from Silver Wallet
    const newAvailable = Math.max(0, currentAvailable - quote.grams);
    const currentSold = parseFloat(wallet.totalSilverSold ? wallet.totalSilverSold.toString() : '0');

    // Deduct from virtualSilver first, then physicalSilver
    const curVirtual = parseFloat((wallet.virtualSilver || 0).toString());
    if (curVirtual >= quote.grams) {
      wallet.virtualSilver = Math.round((curVirtual - quote.grams) * 10000) / 10000;
    } else {
      wallet.virtualSilver = 0;
      const curPhysical = parseFloat((wallet.physicalSilver || 0).toString());
      wallet.physicalSilver = Math.max(0, Math.round((curPhysical - (quote.grams - curVirtual)) * 10000) / 10000);
    }

    wallet.availableSilver = newAvailable;
    wallet.totalSilverSold = currentSold + quote.grams;
    wallet.currentValue = Math.round(newAvailable * quote.sellRate * 100) / 100;
    await wallet.save();

    // 4. If credited to Tia'z Wallet, add funds directly
    if (destination === 'WALLET' || destination === 'TIAZ_WALLET') {
      const goldWallet = await GoldWallet.findOne({ userId: userObjectId });
      if (goldWallet) {
        const prevCash = parseFloat((goldWallet.cashBalance || 0).toString());
        goldWallet.cashBalance = Math.round((prevCash + quote.netPayout) * 100) / 100;
        await goldWallet.save();
      }
    }

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      transactionNumber: transaction.transactionNumber,
      metalType: 'SILVER',
      quantitySold: quote.grams,
      formattedGrams: `${quote.grams.toFixed(4)} gm`,
      sellRate: quote.sellRate,
      netPayout: quote.netPayout,
      formattedNetPayout: `₹${quote.netPayout.toFixed(2)}`,
      remainingSilverBalance: newAvailable,
      status: 'COMPLETED',
      payoutDestination: destination,
      bankAccount: bank ? { id: bank._id, bankName: bank.bankName, maskedAccountNumber: bank.maskedAccountNumber } : null,
      timestamp: order.completedAt
    };
  }

  // ==================== ORDERS & ADMIN ====================

  async getOrders(userId, { page = 1, limit = 10, type = null }) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const query = { userId: userObjectId };
    if (type && type.toUpperCase() !== 'ALL') {
      query.type = type.toUpperCase();
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      SilverOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SilverOrder.countDocuments(query)
    ]);

    return { orders, total };
  }

  async updateSilverRate({ purity = '999', pricePerGram, source = 'manual' }) {
    const numericRate = parseFloat(pricePerGram);
    if (!numericRate || numericRate <= 0) throw new Error('Invalid price per gram');
    return rateScraperService.updateManualSilverRate({ pricePerGram: numericRate });
  }

  async createRazorpayOrder(userId, { amount, grams, productId = null }) {
    const quote = await this.calculateBuyQuote(userId, { amount, grams, productId });
    return await razorpayService.createOrder({
      amount: quote.buySilverValue,
      currency: 'INR',
      notes: {
        userId: userId.toString(),
        metalType: 'SILVER',
        grams: quote.breakdown.grams,
        purpose: 'VIRTUAL_SILVER_BUY'
      }
    });
  }
}

module.exports = new SilverService();

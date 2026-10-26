const mongoose = require('mongoose');
const GoldOrder = require('../models/GoldOrder');
const SilverOrder = require('../models/SilverOrder');
const User = require('../models/User');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const GoldWallet = require('../models/GoldWallet');
const SilverWallet = require('../models/SilverWallet');
const walletService = require('./wallet.service');
const razorpayService = require('./razorpay.service');
const crypto = require('crypto');

class OrderService {
  /**
   * Helper: Format order object uniformly
   */
  formatOrder(order, metalType) {
    const rawRate = metalType === 'GOLD' ? order.goldRate : order.silverRate;
    const rate = rawRate ? parseFloat(rawRate.toString()) : 0;
    const grossAmount = order.grossAmount ? parseFloat(order.grossAmount.toString()) : 0;
    const gstAmount = order.gstAmount ? parseFloat(order.gstAmount.toString()) : 0;
    const makingCharges = order.makingCharges ? parseFloat(order.makingCharges.toString()) : 0;
    const deliveryFee = order.deliveryFee ? parseFloat(order.deliveryFee.toString()) : 0;
    const finalAmount = order.finalAmount ? parseFloat(order.finalAmount.toString()) : 0;
    const quantity = order.quantity ? parseFloat(order.quantity.toString()) : 0;

    const user = order.userId && typeof order.userId === 'object' ? order.userId : null;

    const prodDetails = order.productDetails || {};
    const deliveryAddr = order.deliveryAddress || {};

    // Normalize status into the 4 standard core statuses: PENDING, PLACED, CONFIRMED, DELIVERED, CANCELLED
    let normalizedStatus = order.status || 'PLACED';
    if (normalizedStatus === 'REQUESTED') normalizedStatus = 'PLACED';
    if (['ACCEPTED', 'PROCESSING', 'MINTING'].includes(normalizedStatus)) normalizedStatus = 'CONFIRMED';
    if (normalizedStatus === 'COMPLETED') normalizedStatus = 'DELIVERED';
    if (['REJECTED', 'FAILED'].includes(normalizedStatus)) normalizedStatus = 'CANCELLED';

    return {
      _id: order._id,
      orderId: order._id,
      orderNumber: order.orderNumber,
      metalType,
      buyType: order.buyType || 'PHYSICAL',
      type: order.type || 'BUY',
      quantity,
      formattedGrams: `${quantity.toFixed(4)} gm`,
      weightGrams: quantity,
      rate,
      formattedRate: `₹${rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /gm`,
      grossAmount,
      gstAmount,
      makingCharges,
      deliveryFee,
      finalAmount,
      formattedTotalAmount: `₹${finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      productName: prodDetails.productName || `${quantity}g ${metalType === 'GOLD' ? '24K Gold' : '999 Fine Silver'} ${prodDetails.itemType || 'Product'}`,
      productDetails: {
        itemType: prodDetails.itemType || 'COIN',
        weightGrams: prodDetails.weightGrams || quantity,
        purity: prodDetails.purity || (metalType === 'GOLD' ? '24K (99.9%)' : '999 Fine (99.9%)'),
        mintPartner: prodDetails.mintPartner || 'MMTC-PAMP',
        certificateNumber: prodDetails.certificateNumber || null,
        productName: prodDetails.productName || null
      },
      customer: {
        _id: user?._id || order.userId,
        fullName: user?.fullName || deliveryAddr.recipientName || 'Customer',
        mobile: user?.mobile || deliveryAddr.recipientPhone || '',
        email: user?.email || '',
        profileImage: user?.profileImage || null
      },
      deliveryAddress: {
        recipientName: deliveryAddr.recipientName || user?.fullName || 'Customer',
        recipientPhone: deliveryAddr.recipientPhone || user?.mobile || '',
        addressLine: deliveryAddr.addressLine || 'Address pending verification call',
        city: deliveryAddr.city || '',
        state: deliveryAddr.state || '',
        pincode: deliveryAddr.pincode || ''
      },
      courierDetails: order.courierDetails || null,
      status: normalizedStatus,
      rawStatus: order.status || 'PLACED',
      paymentMethod: order.paymentMethod || 'COD',
      paymentStatus: order.paymentStatus || (order.paymentMethod === 'COD' ? 'PENDING_ON_DELIVERY' : 'COMPLETED'),
      adminNotes: order.adminNotes || null,
      callConfirmed: !!order.callConfirmed,
      confirmedAt: order.confirmedAt || null,
      deliveredAt: order.deliveredAt || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  /**
   * Get all physical purchase requests & orders for Admin Panel
   */
  async getAdminPurchaseRequests({
    status = 'ALL',
    metalType = 'ALL',
    paymentMethod = 'ALL',
    search = '',
    page = 1,
    limit = 10
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    // Build query filters for physical orders
    const query = { buyType: 'PHYSICAL' };

    if (status && status.toUpperCase() !== 'ALL') {
      const s = status.toUpperCase();
      if (s === 'PENDING') {
        query.status = { $in: ['PENDING', 'PENDING_CONFIRMATION'] };
      } else if (s === 'PLACED' || s === 'REQUESTED') {
        query.status = { $in: ['PLACED', 'REQUESTED'] };
      } else if (s === 'CONFIRMED' || s === 'ACCEPTED' || s === 'IN_PROGRESS' || s === 'PROCESSING') {
        query.status = { $in: ['CONFIRMED', 'ACCEPTED', 'PROCESSING', 'MINTING', 'DISPATCHED'] };
      } else if (s === 'DELIVERED' || s === 'COMPLETED') {
        query.status = { $in: ['DELIVERED', 'COMPLETED'] };
      } else if (s === 'CANCELLED' || s === 'REJECTED') {
        query.status = { $in: ['CANCELLED', 'REJECTED', 'FAILED'] };
      } else {
        query.status = s;
      }
    }

    if (paymentMethod && paymentMethod.toUpperCase() !== 'ALL') {
      query.paymentMethod = paymentMethod.toUpperCase();
    }

    // Determine collections to query
    const queryGold = metalType.toUpperCase() === 'ALL' || metalType.toUpperCase() === 'GOLD';
    const querySilver = metalType.toUpperCase() === 'ALL' || metalType.toUpperCase() === 'SILVER';

    const [goldOrdersRaw, silverOrdersRaw] = await Promise.all([
      queryGold
        ? GoldOrder.find(query).populate('userId', 'fullName mobile email profileImage').lean()
        : [],
      querySilver
        ? SilverOrder.find(query).populate('userId', 'fullName mobile email profileImage').lean()
        : []
    ]);

    const formattedGold = goldOrdersRaw.map((o) => this.formatOrder(o, 'GOLD'));
    const formattedSilver = silverOrdersRaw.map((o) => this.formatOrder(o, 'SILVER'));

    let combined = [...formattedGold, ...formattedSilver];

    // Search filter across customer name, phone, order number, product name, or city
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      combined = combined.filter((item) => {
        const orderNum = (item.orderNumber || '').toLowerCase();
        const custName = (item.customer.fullName || '').toLowerCase();
        const custPhone = (item.customer.mobile || '').toLowerCase();
        const recipPhone = (item.deliveryAddress.recipientPhone || '').toLowerCase();
        const city = (item.deliveryAddress.city || '').toLowerCase();
        const prod = (item.productName || '').toLowerCase();
        return (
          orderNum.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          recipPhone.includes(q) ||
          city.includes(q) ||
          prod.includes(q)
        );
      });
    }

    // Sort descending by creation date
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Compute high-level statistics across all physical orders
    const [allGoldStats, allSilverStats] = await Promise.all([
      GoldOrder.find({ buyType: 'PHYSICAL' }).select('status finalAmount paymentMethod').lean(),
      SilverOrder.find({ buyType: 'PHYSICAL' }).select('status finalAmount paymentMethod').lean()
    ]);
    const allPhysical = [...allGoldStats, ...allSilverStats];

    const stats = {
      totalOrders: allPhysical.length,
      pending: allPhysical.filter((o) =>
        ['PENDING', 'PENDING_CONFIRMATION'].includes(o.status)
      ).length,
      placed: allPhysical.filter((o) =>
        ['PLACED', 'REQUESTED'].includes(o.status)
      ).length,
      confirmed: allPhysical.filter((o) =>
        ['CONFIRMED', 'ACCEPTED', 'PROCESSING', 'MINTING', 'DISPATCHED'].includes(o.status)
      ).length,
      delivered: allPhysical.filter((o) =>
        ['DELIVERED', 'COMPLETED'].includes(o.status)
      ).length,
      cancelled: allPhysical.filter((o) =>
        ['REJECTED', 'CANCELLED', 'FAILED'].includes(o.status)
      ).length,
      // Backward compatibility keys
      pendingVerification: allPhysical.filter((o) =>
        ['PENDING', 'PENDING_CONFIRMATION'].includes(o.status)
      ).length,
      inProgress: allPhysical.filter((o) =>
        ['CONFIRMED', 'ACCEPTED', 'PROCESSING', 'MINTING'].includes(o.status)
      ).length,
      dispatched: allPhysical.filter((o) => o.status === 'DISPATCHED').length,
      codCount: allPhysical.filter((o) => o.paymentMethod === 'COD').length,
      onlineCount: allPhysical.filter((o) => ['ONLINE', 'WALLET', 'UPI'].includes(o.paymentMethod)).length
    };

    const total = combined.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = combined.slice(startIndex, startIndex + limitNum);

    return {
      items: paginatedItems,
      orders: paginatedItems, // alias
      stats,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum
      }
    };
  }

  /**
   * Helper: Find order in Gold or Silver collection
   */
  async findOrderById(orderId) {
    const objectId = new mongoose.Types.ObjectId(orderId.toString());
    let order = await GoldOrder.findById(objectId).populate('userId', 'fullName mobile email profileImage');
    let metalType = 'GOLD';

    if (!order) {
      order = await SilverOrder.findById(objectId).populate('userId', 'fullName mobile email profileImage');
      metalType = 'SILVER';
    }

    if (!order) {
      throw new Error('Purchase order not found');
    }

    return { order, metalType };
  }

  /**
   * Get single order details with customer verification context
   */
  async getOrderDetails(orderId) {
    const { order, metalType } = await this.findOrderById(orderId);
    return this.formatOrder(order, metalType);
  }

  /**
   * Accept Physical Purchase Request after calling the user
   * Admin confirms interest and delivery address over phone call
   */
  async acceptOrder(orderId, { adminNotes = '', estimatedDelivery = null }) {
    const { order, metalType } = await this.findOrderById(orderId);

    order.status = 'ACCEPTED';
    order.callConfirmed = true;
    order.confirmedAt = new Date();
    if (adminNotes && adminNotes.trim()) {
      order.adminNotes = (order.adminNotes ? order.adminNotes + ' | ' : '') + `Call Confirmed: ${adminNotes.trim()}`;
    }
    await order.save();

    // Send in-app notification to the customer
    try {
      await Notification.create({
        userId: order.userId._id || order.userId,
        title: 'Order Confirmed! 🚚',
        message: `Your physical order #${order.orderNumber} for ${order.productDetails?.productName || `${metalType} Product`} has been verified and confirmed! It is now being prepared for dispatch.`,
        type: metalType === 'GOLD' ? 'GOLD' : 'GENERAL',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: 'ACCEPTED'
        }
      });
    } catch (e) {}

    return this.formatOrder(order, metalType);
  }

  /**
   * Reject Physical Purchase Request if customer denies or cancels
   */
  async rejectOrder(orderId, { reason = 'Customer cancelled during phone verification', adminNotes = '' }) {
    const { order, metalType } = await this.findOrderById(orderId);

    order.status = 'REJECTED';
    const note = `Rejected: ${reason}${adminNotes ? ` (${adminNotes})` : ''}`;
    order.adminNotes = (order.adminNotes ? order.adminNotes + ' | ' : '') + note;
    await order.save();

    // Send in-app notification
    try {
      await Notification.create({
        userId: order.userId._id || order.userId,
        title: 'Order Cancelled',
        message: `Your order #${order.orderNumber} has been cancelled (${reason}).`,
        type: 'GENERAL',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: 'REJECTED'
        }
      });
    } catch (e) {}

    return this.formatOrder(order, metalType);
  }

  /**
   * Dispatch Order: Admin records courier partner & tracking number
   */
  async dispatchOrder(orderId, { partner = 'Sequel Logistics', trackingNumber = '' }) {
    const { order, metalType } = await this.findOrderById(orderId);

    order.status = 'DISPATCHED';
    order.courierDetails = {
      partner: partner || 'Sequel Secure Logistics',
      trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-8)}`,
      dispatchedAt: new Date()
    };
    await order.save();

    // If transaction exists (Online payment), update deliveryStatus
    try {
      await Transaction.findOneAndUpdate(
        { referenceId: order._id },
        {
          deliveryStatus: 'DISPATCHED',
          courierPartner: order.courierDetails.partner,
          trackingNumber: order.courierDetails.trackingNumber
        }
      );
    } catch (e) {}

    // Send dispatch notification
    try {
      await Notification.create({
        userId: order.userId._id || order.userId,
        title: 'Order Dispatched! 📦',
        message: `Your order #${order.orderNumber} is on its way via ${order.courierDetails.partner}. Tracking ID: ${order.courierDetails.trackingNumber}`,
        type: 'GENERAL',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          courierDetails: order.courierDetails,
          status: 'DISPATCHED'
        }
      });
    } catch (e) {}

    return this.formatOrder(order, metalType);
  }

  /**
   * Mark Delivery Completed: Admin marks product successfully delivered
   */
  async completeDelivery(orderId, { adminNotes = '' }) {
    const { order, metalType } = await this.findOrderById(orderId);

    order.status = 'DELIVERED';
    order.deliveredAt = new Date();
    order.completedAt = new Date();

    if (!order.courierDetails) {
      order.courierDetails = {};
    }
    order.courierDetails.deliveredAt = new Date();

    // If COD, mark payment as PAID upon physical delivery completion
    if (order.paymentMethod === 'COD') {
      order.paymentStatus = 'PAID';
    }

    if (adminNotes && adminNotes.trim()) {
      order.adminNotes = (order.adminNotes ? order.adminNotes + ' | ' : '') + `Delivered: ${adminNotes.trim()}`;
    }

    await order.save();

    // Update Transaction if online or create settlement record
    try {
      await Transaction.findOneAndUpdate(
        { referenceId: order._id },
        { deliveryStatus: 'DELIVERED' }
      );
    } catch (e) {}

    // Send delivery completed notification
    try {
      await Notification.create({
        userId: order.userId._id || order.userId,
        title: 'Delivery Completed! ✨',
        message: `Your order #${order.orderNumber} has been delivered successfully. Thank you for choosing Tia'z!`,
        type: metalType === 'GOLD' ? 'GOLD' : 'GENERAL',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: 'DELIVERED'
        }
      });
    } catch (e) {}

    return this.formatOrder(order, metalType);
  }

  /**
   * Universal Order Status Update: PENDING, PLACED, CONFIRMED, DELIVERED, CANCELLED
   */
  async updateOrderStatus(orderId, { status, adminNotes = '', courierPartner = '', trackingNumber = '' } = {}) {
    if (!status) {
      throw new Error('Status is required');
    }

    const s = status.trim().toUpperCase();
    const validStatuses = ['PENDING', 'PLACED', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'ACCEPTED', 'REQUESTED', 'DISPATCHED', 'REJECTED'];
    if (!validStatuses.includes(s)) {
      throw new Error('Invalid status. Allowed values: PENDING, PLACED, CONFIRMED, DELIVERED, CANCELLED');
    }

    const { order, metalType } = await this.findOrderById(orderId);
    
    // Normalize status into the 4 core statuses:
    let finalStatus = s;
    if (s === 'REQUESTED') finalStatus = 'PLACED';
    if (s === 'ACCEPTED') finalStatus = 'CONFIRMED';
    if (s === 'REJECTED') finalStatus = 'CANCELLED';

    order.status = finalStatus;

    if (finalStatus === 'CONFIRMED') {
      order.callConfirmed = true;
      order.confirmedAt = order.confirmedAt || new Date();
    }

    if (finalStatus === 'DELIVERED') {
      order.deliveredAt = order.deliveredAt || new Date();
      order.completedAt = order.completedAt || new Date();
      if (order.paymentMethod === 'COD') {
        order.paymentStatus = 'PAID';
      }
    }

    if (courierPartner || trackingNumber) {
      order.courierDetails = {
        partner: courierPartner || order.courierDetails?.partner || 'Sequel Logistics',
        trackingNumber: trackingNumber || order.courierDetails?.trackingNumber || `TRK-${Date.now().toString().slice(-8)}`,
        dispatchedAt: order.courierDetails?.dispatchedAt || new Date(),
        deliveredAt: (finalStatus === 'DELIVERED') ? (order.courierDetails?.deliveredAt || new Date()) : order.courierDetails?.deliveredAt
      };
    }

    if (adminNotes && adminNotes.trim()) {
      order.adminNotes = (order.adminNotes ? order.adminNotes + ' | ' : '') + adminNotes.trim();
    }

    await order.save();

    // Sync matching transaction deliveryStatus
    try {
      const updateTxn = {};
      if (finalStatus === 'DELIVERED') updateTxn.deliveryStatus = 'DELIVERED';
      if (finalStatus === 'CONFIRMED') updateTxn.deliveryStatus = 'CONFIRMED';
      if (courierPartner) updateTxn.courierPartner = courierPartner;
      if (trackingNumber) updateTxn.trackingNumber = trackingNumber;
      if (Object.keys(updateTxn).length > 0) {
        await Transaction.findOneAndUpdate({ referenceId: order._id }, updateTxn);
      }
    } catch (e) {}

    // Send user notification on status update
    try {
      const statusTitleMap = {
        PENDING: 'Order Pending Verification ⏳',
        PLACED: 'Order Placed 🛍️',
        CONFIRMED: 'Order Confirmed! 🚚',
        DELIVERED: 'Order Delivered! ✨',
        CANCELLED: 'Order Cancelled'
      };
      const title = statusTitleMap[finalStatus] || `Order Status: ${finalStatus}`;
      await Notification.create({
        userId: order.userId._id || order.userId,
        title,
        message: `Your physical ${metalType} order #${order.orderNumber} is now marked as ${finalStatus}.`,
        type: metalType === 'GOLD' ? 'GOLD' : 'GENERAL',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: finalStatus
        }
      });
    } catch (e) {}

    return this.formatOrder(order, metalType);
  }

  /**
   * Helper: Enrich order with product images, tracking timeline, and user-facing badges
   */
  enrichOrderForApp(order, metalType) {
    const base = this.formatOrder(order, metalType);

    // Build user-friendly timeline
    const isConfirmed = ['CONFIRMED', 'ACCEPTED', 'PROCESSING', 'MINTING', 'DISPATCHED', 'DELIVERED'].includes(order.status);
    const isDispatched = ['DISPATCHED', 'DELIVERED'].includes(order.status);
    const isDelivered = ['DELIVERED', 'COMPLETED'].includes(order.status);
    const isCancelled = ['REJECTED', 'CANCELLED', 'FAILED'].includes(order.status);

    const timeline = [
      {
        step: 1,
        key: 'ORDER_PLACED',
        title: 'Order Placed',
        description: order.paymentMethod === 'COD' ? 'Order request received (Cash on Delivery)' : 'Payment verified and order submitted',
        timestamp: order.createdAt,
        isCompleted: true,
        isActive: order.status === 'PLACED' || order.status === 'REQUESTED' || order.status === 'PENDING'
      },
      {
        step: 2,
        key: 'ORDER_CONFIRMED',
        title: 'Confirmed by Tia\'z',
        description: order.callConfirmed ? 'Customer phone verification completed' : 'Order details confirmed and queued for packing',
        timestamp: order.confirmedAt || null,
        isCompleted: isConfirmed,
        isActive: ['CONFIRMED', 'ACCEPTED', 'PROCESSING', 'MINTING'].includes(order.status)
      },
      {
        step: 3,
        key: 'DISPATCHED',
        title: 'Dispatched for Delivery',
        description: order.courierDetails?.partner
          ? `Dispatched via ${order.courierDetails.partner} (Tracking: ${order.courierDetails.trackingNumber || 'Available shortly'})`
          : 'Shipment handed over to logistics partner in tamper-evident secure package',
        timestamp: order.courierDetails?.dispatchedAt || null,
        isCompleted: isDispatched,
        isActive: order.status === 'DISPATCHED',
        courierPartner: order.courierDetails?.partner || null,
        trackingNumber: order.courierDetails?.trackingNumber || null
      },
      {
        step: 4,
        key: 'DELIVERED',
        title: 'Delivered',
        description: isDelivered ? 'Bullion package delivered successfully to customer doorstep' : 'Expected delivery within 3-5 business days',
        timestamp: order.deliveredAt || order.courierDetails?.deliveredAt || null,
        isCompleted: isDelivered,
        isActive: isDelivered
      }
    ];

    let statusLabel = 'Placed';
    let statusColor = 'blue';

    switch (order.status) {
      case 'PENDING':
      case 'PENDING_CONFIRMATION':
        statusLabel = 'Pending';
        statusColor = 'amber';
        break;
      case 'PLACED':
      case 'REQUESTED':
        statusLabel = 'Placed';
        statusColor = 'blue';
        break;
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'PROCESSING':
      case 'MINTING':
      case 'DISPATCHED':
        statusLabel = 'Confirmed';
        statusColor = 'indigo';
        break;
      case 'DELIVERED':
      case 'COMPLETED':
        statusLabel = 'Delivered';
        statusColor = 'emerald';
        break;
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
        statusLabel = 'Cancelled';
        statusColor = 'rose';
        break;
      default:
        statusLabel = order.status;
    }

    return {
      ...base,
      statusLabel,
      statusColor,
      isCancelled,
      timeline,
      trackingInfo: order.courierDetails?.trackingNumber ? {
        carrier: order.courierDetails.partner || 'Logistics Partner',
        trackingNumber: order.courierDetails.trackingNumber,
        dispatchedAt: order.courierDetails.dispatchedAt,
        deliveredAt: order.courierDetails.deliveredAt,
        status: order.status
      } : null
    };
  }

  /**
   * Get all orders for logged-in user (My Orders)
   * Supports filtering by status, metalType, buyType, and pagination
   */
  async getUserOrders(userId, {
    status = 'ALL',
    metalType = 'ALL',
    buyType = 'ALL',
    search = '',
    page = 1,
    limit = 10
  } = {}) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    const query = { userId: userObjectId };

    if (buyType && buyType.toUpperCase() !== 'ALL') {
      query.buyType = buyType.toUpperCase();
    }

    if (status && status.toUpperCase() !== 'ALL') {
      const s = status.toUpperCase();
      if (s === 'PENDING') {
        query.status = { $in: ['PENDING', 'PENDING_CONFIRMATION'] };
      } else if (s === 'PLACED' || s === 'REQUESTED') {
        query.status = { $in: ['PLACED', 'REQUESTED'] };
      } else if (s === 'CONFIRMED' || s === 'ACCEPTED' || s === 'IN_PROGRESS' || s === 'PROCESSING') {
        query.status = { $in: ['CONFIRMED', 'ACCEPTED', 'PROCESSING', 'MINTING', 'DISPATCHED'] };
      } else if (s === 'DELIVERED' || s === 'COMPLETED') {
        query.status = { $in: ['DELIVERED', 'COMPLETED'] };
      } else if (s === 'CANCELLED' || s === 'REJECTED') {
        query.status = { $in: ['REJECTED', 'CANCELLED', 'FAILED'] };
      } else {
        query.status = s;
      }
    }

    const queryGold = metalType.toUpperCase() === 'ALL' || metalType.toUpperCase() === 'GOLD';
    const querySilver = metalType.toUpperCase() === 'ALL' || metalType.toUpperCase() === 'SILVER';

    const [goldOrders, silverOrders] = await Promise.all([
      queryGold ? GoldOrder.find(query).lean() : [],
      querySilver ? SilverOrder.find(query).lean() : []
    ]);

    const formattedGold = goldOrders.map((o) => this.enrichOrderForApp(o, 'GOLD'));
    const formattedSilver = silverOrders.map((o) => this.enrichOrderForApp(o, 'SILVER'));

    let combined = [...formattedGold, ...formattedSilver];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      combined = combined.filter((item) =>
        (item.orderNumber || '').toLowerCase().includes(q) ||
        (item.productName || '').toLowerCase().includes(q) ||
        (item.deliveryAddress?.city || '').toLowerCase().includes(q)
      );
    }

    // Sort newest first
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = combined.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = combined.slice(startIndex, startIndex + limitNum);

    // Summary stats for user
    const stats = {
      totalOrders: total,
      inTransit: combined.filter((o) => o.status === 'DISPATCHED').length,
      delivered: combined.filter((o) => o.status === 'DELIVERED').length,
      pending: combined.filter((o) => ['REQUESTED', 'PENDING', 'ACCEPTED', 'PROCESSING'].includes(o.status)).length
    };

    return {
      orders: paginated,
      stats,
      pagination: {
        totalOrders: total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum,
        hasMore: pageNum * limitNum < total
      }
    };
  }

  /**
   * Get single order details by ID or orderNumber for logged-in user
   */
  async getUserOrderDetails(userId, orderIdOrNumber) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrNumber);

    const query = {
      userId: userObjectId,
      ...(isObjectId
        ? { $or: [{ _id: new mongoose.Types.ObjectId(orderIdOrNumber) }, { orderNumber: orderIdOrNumber }] }
        : { orderNumber: orderIdOrNumber })
    };

    let order = await GoldOrder.findOne(query).lean();
    let metalType = 'GOLD';

    if (!order) {
      order = await SilverOrder.findOne(query).lean();
      metalType = 'SILVER';
    }

    if (!order) {
      const error = new Error('Order not found or does not belong to you');
      error.statusCode = 404;
      throw error;
    }

    // Fetch linked product image if available
    let productExtra = null;
    if (order.productId) {
      productExtra = await Product.findById(order.productId).select('imageUrl images description purity weightGrams').lean();
    }

    const enriched = this.enrichOrderForApp(order, metalType);
    if (productExtra) {
      enriched.productDetails.imageUrl = productExtra.imageUrl || (productExtra.images && productExtra.images[0]) || null;
      enriched.productDetails.description = productExtra.description || null;
    }

    return enriched;
  }


  /**
   * Dedicated Physical Product Purchase API
   * Implements the exact Checkout flow:
   * - Delivery Address: Recipient Full Name, Mobile Number, Address (House/Flat/Street), City, State, Pincode
   * - Payment Mode: COD (Cash on Delivery), WALLET (Tia'z Wallet), ONLINE (UPI / NetBanking / Cards)
   * - Pricing: Product Price, Free Insured Delivery, Transit Cover 100% Insured, Total Payable
   *
   * @param {String|ObjectId} userId
   * @param {Object} data
   */
  async buyPhysicalProduct(userId, data = {}) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    // Resolve Product ID
    const productId = data.productId || data.id;
    if (!productId) {
      const err = new Error('Product ID (productId) is required');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const err = new Error('Invalid Product ID format');
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Physical product not found');
      err.statusCode = 404;
      throw err;
    }

    if (product.isActive === false) {
      const err = new Error('This physical product is currently unavailable');
      err.statusCode = 400;
      throw err;
    }

    if (product.inStock === false) {
      const err = new Error('This physical product is currently out of stock');
      err.statusCode = 400;
      throw err;
    }

    const orderQty = Math.max(1, parseInt(data.quantity, 10) || 1);
    const metalType = (product.metalType || 'GOLD').toUpperCase();
    const isGold = metalType === 'GOLD';
    const weightPerUnit = parseFloat(product.weightGrams || 1);
    const totalWeightGrams = parseFloat((weightPerUnit * orderQty).toFixed(4));

    // Pricing calculation
    const productPrice = parseFloat(product.price);
    const itemTotal = Math.round(productPrice * orderQty * 100) / 100;
    const deliveryFee = 0; // FREE Insured Delivery
    const totalPayable = itemTotal;

    // Resolve and Validate Delivery Address (Supports nested deliveryAddress object or top-level fields)
    const addrInput = data.deliveryAddress || {};
    const recipientName = (
      addrInput.recipientName ||
      addrInput.fullName ||
      addrInput.name ||
      data.recipientName ||
      data.fullName ||
      data.name ||
      user.fullName ||
      ''
    ).trim();

    const mobileNumber = (
      addrInput.mobileNumber ||
      addrInput.recipientPhone ||
      addrInput.phone ||
      addrInput.mobile ||
      data.mobileNumber ||
      data.recipientPhone ||
      data.phone ||
      data.mobile ||
      user.mobile ||
      ''
    ).trim();

    const address = (
      addrInput.address ||
      addrInput.streetAddress ||
      addrInput.addressLine ||
      addrInput.houseFlatStreet ||
      data.address ||
      data.streetAddress ||
      data.addressLine ||
      data.houseFlatStreet ||
      user.address ||
      ''
    ).trim();

    const city = (addrInput.city || data.city || '').trim();
    const state = (addrInput.state || data.state || '').trim();
    const pincode = (
      addrInput.pincode ||
      addrInput.pinCode ||
      addrInput.postalCode ||
      data.pincode ||
      data.pinCode ||
      data.postalCode ||
      ''
    ).trim();

    // Validation for Delivery Address fields
    if (!recipientName) {
      const err = new Error('Recipient Full Name is required');
      err.statusCode = 400;
      throw err;
    }

    if (!mobileNumber) {
      const err = new Error('Mobile Number is required');
      err.statusCode = 400;
      throw err;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      const err = new Error('Please enter a valid 10-digit Mobile Number');
      err.statusCode = 400;
      throw err;
    }

    if (!address) {
      const err = new Error('Delivery Address (House / Flat / Street) is required');
      err.statusCode = 400;
      throw err;
    }

    if (!city) {
      const err = new Error('City is required');
      err.statusCode = 400;
      throw err;
    }

    if (!state) {
      const err = new Error('State is required');
      err.statusCode = 400;
      throw err;
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      const err = new Error('Please enter a valid 6-digit Pincode');
      err.statusCode = 400;
      throw err;
    }

    const deliveryAddress = {
      recipientName,
      recipientPhone: cleanMobile.slice(-10),
      addressLine: address,
      city,
      state,
      pincode
    };

    // Normalize Payment Mode: COD | WALLET | ONLINE
    const rawMode = (data.paymentMode || data.paymentMethod || 'COD').toString().toUpperCase().trim();
    let paymentMode = 'COD';

    if (['COD', 'CASH_ON_DELIVERY', 'CASH'].includes(rawMode)) {
      paymentMode = 'COD';
    } else if (['WALLET', 'TIAZ_WALLET', 'CASH_BALANCE'].includes(rawMode)) {
      paymentMode = 'WALLET';
    } else if (['ONLINE', 'UPI', 'RAZORPAY', 'NETBANKING', 'CARD'].includes(rawMode)) {
      paymentMode = 'ONLINE';
    } else {
      const err = new Error("Invalid paymentMode. Supported options are 'COD', 'WALLET', or 'ONLINE'");
      err.statusCode = 400;
      throw err;
    }

    // Generate Unique Order Number
    const orderPrefix = isGold ? 'GO-PHY-' : 'SO-PHY-';
    const orderNumber = orderPrefix + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

    let payment = null;
    let transaction = null;
    let remainingWalletBalance = null;

    // =========================================================================
    // 1. CASH ON DELIVERY (COD)
    // =========================================================================
    if (paymentMode === 'COD') {
      const orderPayload = {
        userId: user._id,
        orderNumber,
        type: 'BUY',
        buyType: 'PHYSICAL',
        productId: product._id,
        quantity: totalWeightGrams,
        [isGold ? 'goldRate' : 'silverRate']: Math.round((productPrice / weightPerUnit) * 100) / 100,
        grossAmount: totalPayable,
        gstAmount: 0,
        makingCharges: 0,
        deliveryFee: 0,
        otherCharges: 0,
        finalAmount: totalPayable,
        productDetails: {
          itemType: isGold ? 'GOLD_COIN' : 'SILVER_COIN',
          weightGrams: totalWeightGrams,
          purity: product.purity || (isGold ? '24K (99.9%)' : '999 Fine (99.9%)'),
          mintPartner: 'MMTC-PAMP',
          certificateNumber: null,
          productName: product.name,
          imageUrl: product.imageUrl || (product.images && product.images[0]) || null
        },
        deliveryAddress,
        courierDetails: null,
        status: 'PLACED',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING_ON_DELIVERY'
      };

      const OrderModel = isGold ? GoldOrder : SilverOrder;
      const order = await OrderModel.create(orderPayload);

      // Notification
      Notification.create({
        userId: user._id,
        title: 'Order Placed (Cash on Delivery) 🚚',
        message: `Your physical order #${orderNumber} for ${product.name} (Qty: ${orderQty}) has been placed successfully via Cash on Delivery. Total payable at doorstep: ₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
        type: isGold ? 'GOLD' : 'GENERAL',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: 'COD',
          status: 'PLACED'
        }
      }).catch(() => {});

      return {
        success: true,
        message: 'Physical product order placed successfully via Cash on Delivery!',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusLabel: 'Placed',
          product: {
            id: product._id,
            name: product.name,
            subtitle: `${product.purity || (isGold ? '24K Gold' : '999 Silver')} ${product.weightGrams} gm`,
            metalType,
            weightGrams: product.weightGrams,
            quantity: orderQty,
            totalWeightGrams,
            purity: product.purity || (isGold ? '24K (99.9%)' : '999 Fine (99.9%)'),
            imageUrl: product.imageUrl || (product.images && product.images[0]) || null
          },
          pricing: {
            productPrice,
            quantity: orderQty,
            itemTotal,
            deliveryFee: 0,
            deliveryFeeText: 'FREE',
            transitCover: '100% Insured',
            transitCoverText: '100% Insured',
            totalPayable,
            formattedTotalPayable: `₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          },
          deliveryAddress,
          payment: {
            mode: 'COD',
            method: 'COD',
            status: 'PENDING_ON_DELIVERY',
            statusLabel: 'Cash on Delivery (Pending on Delivery)',
            walletDeducted: false
          },
          placedAt: order.createdAt
        }
      };
    }

    // =========================================================================
    // 2. TIA'Z WALLET PAYMENT
    // =========================================================================
    if (paymentMode === 'WALLET') {
      const wallet = await walletService.getWallet(user._id);
      const currentCash = parseFloat((wallet.cashBalance || 0).toString());

      if (currentCash < totalPayable) {
        const err = new Error(
          `Insufficient Tia'z Wallet balance. Available: ₹${currentCash.toFixed(2)}, Required: ₹${totalPayable.toFixed(2)}`
        );
        err.statusCode = 400;
        throw err;
      }

      // Deduct balance from wallet
      await walletService.deductCashBalance(user._id, totalPayable);
      remainingWalletBalance = Math.round((currentCash - totalPayable) * 100) / 100;

      // Create Payment record
      const paymentNumber = 'PAY-WLT-' + Date.now() + crypto.randomBytes(2).toString('hex').toUpperCase();
      payment = await Payment.create({
        userId: user._id,
        paymentNumber,
        amount: totalPayable,
        currency: 'INR',
        method: 'WALLET',
        status: 'SUCCESS',
        paidAt: new Date()
      });

      // Create Transaction record in user passbook/ledger
      const txnPrefix = isGold ? 'TXN-GLD-' : 'TXN-SLV-';
      const transactionNumber = txnPrefix + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
      transaction = await Transaction.create({
        userId: user._id,
        transactionNumber,
        metalType,
        buyType: 'PHYSICAL',
        type: 'BUY',
        direction: 'DEBIT',
        amount: totalPayable,
        quantity: totalWeightGrams,
        rate: Math.round((productPrice / weightPerUnit) * 100) / 100,
        gstAmount: 0,
        status: 'COMPLETED',
        paymentId: payment._id,
        paymentMethod: 'WALLET',
        description: `Purchased ${orderQty}x ${product.name} using Tia'z Wallet`,
        metadata: {
          productId: product._id,
          orderNumber,
          productName: product.name
        }
      });
    }

    // =========================================================================
    // 3. ONLINE / UPI PAYMENT (RAZORPAY)
    // =========================================================================
    if (paymentMode === 'ONLINE') {
      const rzpOrderId = data.paymentDetails?.razorpay_order_id || data.razorpay_order_id;
      const rzpPaymentId = data.paymentDetails?.razorpay_payment_id || data.razorpay_payment_id || data.paymentId;
      const rzpSignature = data.paymentDetails?.razorpay_signature || data.razorpay_signature;

      if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
        const err = new Error(
          'Online payment verification requires razorpay_order_id, razorpay_payment_id, and razorpay_signature'
        );
        err.statusCode = 400;
        throw err;
      }

      // Verify Razorpay payment signature cryptographically before placing order
      razorpayService.verifyPaymentSignature({
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: rzpSignature
      });

      const paymentNumber = 'PAY-ONL-' + Date.now() + crypto.randomBytes(2).toString('hex').toUpperCase();
      payment = await Payment.create({
        userId: user._id,
        paymentNumber,
        amount: totalPayable,
        currency: 'INR',
        method: 'UPI',
        status: 'SUCCESS',
        providerPaymentId: rzpPaymentId,
        paidAt: new Date()
      });

      const txnPrefix = isGold ? 'TXN-GLD-' : 'TXN-SLV-';
      const transactionNumber = txnPrefix + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
      transaction = await Transaction.create({
        userId: user._id,
        transactionNumber,
        metalType,
        buyType: 'PHYSICAL',
        type: 'BUY',
        direction: 'DEBIT',
        amount: totalPayable,
        quantity: totalWeightGrams,
        rate: Math.round((productPrice / weightPerUnit) * 100) / 100,
        gstAmount: 0,
        status: 'COMPLETED',
        paymentId: payment._id,
        paymentMethod: 'ONLINE',
        description: `Purchased ${orderQty}x ${product.name} via Online Payment`,
        metadata: {
          productId: product._id,
          orderNumber,
          productName: product.name,
          paymentDetails: data.paymentDetails
        }
      });
    }

    // Create Order in GoldOrder or SilverOrder
    const orderPayload = {
      userId: user._id,
      orderNumber,
      type: 'BUY',
      buyType: 'PHYSICAL',
      productId: product._id,
      quantity: totalWeightGrams,
      [isGold ? 'goldRate' : 'silverRate']: Math.round((productPrice / weightPerUnit) * 100) / 100,
      grossAmount: totalPayable,
      gstAmount: 0,
      makingCharges: 0,
      deliveryFee: 0,
      otherCharges: 0,
      finalAmount: totalPayable,
      productDetails: {
        itemType: isGold ? 'GOLD_COIN' : 'SILVER_COIN',
        weightGrams: totalWeightGrams,
        purity: product.purity || (isGold ? '24K (99.9%)' : '999 Fine (99.9%)'),
        mintPartner: 'MMTC-PAMP',
        certificateNumber: null,
        productName: product.name,
        imageUrl: product.imageUrl || (product.images && product.images[0]) || null
      },
      deliveryAddress,
      courierDetails: null,
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      paymentMethod: paymentMode,
      paymentStatus: 'COMPLETED',
      paymentId: payment ? payment._id : null
    };

    const OrderModel = isGold ? GoldOrder : SilverOrder;
    const order = await OrderModel.create(orderPayload);

    if (payment) {
      payment.orderId = order._id;
      await payment.save();
    }

    // Notification
    Notification.create({
      userId: user._id,
      title: 'Payment Successful & Order Confirmed! ✨',
      message: `Your physical order #${orderNumber} for ${product.name} has been placed and confirmed (${paymentMode === 'WALLET' ? "Tia'z Wallet" : 'Online Payment'}). It will be dispatched soon in a secure tamper-evident package.`,
      type: isGold ? 'GOLD' : 'GENERAL',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: paymentMode,
        status: 'CONFIRMED'
      }
    }).catch(() => {});

    return {
      success: true,
      message:
        paymentMode === 'WALLET'
          ? "Payment successful from Tia'z Wallet! Physical product order confirmed."
          : 'Online payment successful! Physical product order confirmed.',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: 'Confirmed',
        product: {
          id: product._id,
          name: product.name,
          subtitle: `${product.purity || (isGold ? '24K Gold' : '999 Silver')} ${product.weightGrams} gm`,
          metalType,
          weightGrams: product.weightGrams,
          quantity: orderQty,
          totalWeightGrams,
          purity: product.purity || (isGold ? '24K (99.9%)' : '999 Fine (99.9%)'),
          imageUrl: product.imageUrl || (product.images && product.images[0]) || null
        },
        pricing: {
          productPrice,
          quantity: orderQty,
          itemTotal,
          deliveryFee: 0,
          deliveryFeeText: 'FREE',
          transitCover: '100% Insured',
          transitCoverText: '100% Insured',
          totalPayable,
          formattedTotalPayable: `₹${totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        },
        deliveryAddress,
        payment: {
          mode: paymentMode,
          method: paymentMode,
          status: 'COMPLETED',
          statusLabel: paymentMode === 'WALLET' ? "Paid via Tia'z Wallet" : 'Paid Online',
          walletDeducted: paymentMode === 'WALLET',
          remainingWalletBalance: remainingWalletBalance,
          paymentId: payment ? payment._id : null,
          transactionId: transaction ? transaction._id : null,
          transactionNumber: transaction ? transaction.transactionNumber : null
        },
        placedAt: order.createdAt
      }
    };
  }

  /**
   * Generate Razorpay Order for purchasing a physical product
   * Mobile / Web app calls this to open Razorpay checkout modal
   */
  async createRazorpayOrder(userId, { productId, quantity = 1 } = {}) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      const err = new Error('Valid Product ID is required');
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    if (product.isActive === false || product.inStock === false) {
      const err = new Error('Product is currently out of stock or unavailable');
      err.statusCode = 400;
      throw err;
    }

    const orderQty = Math.max(1, parseInt(quantity, 10) || 1);
    const productPrice = parseFloat(product.price);
    const totalPayable = Math.round(productPrice * orderQty * 100) / 100;

    const razorpayOrder = await razorpayService.createOrder({
      amount: totalPayable,
      currency: 'INR',
      notes: {
        userId: user._id.toString(),
        productId: product._id.toString(),
        productName: product.name,
        quantity: orderQty,
        purpose: 'PHYSICAL_PRODUCT_PURCHASE'
      }
    });

    return {
      ...razorpayOrder,
      product: {
        id: product._id,
        name: product.name,
        metalType: product.metalType,
        weightGrams: product.weightGrams,
        quantity: orderQty,
        totalPayable
      }
    };
  }

  /**
   * Backward-compatibility alias
   */
  async createPhysicalOrder(userId, data = {}) {
    return this.buyPhysicalProduct(userId, data);
  }
}

module.exports = new OrderService();

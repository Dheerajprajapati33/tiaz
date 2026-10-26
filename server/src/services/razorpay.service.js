const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/env');

class RazorpayService {
  constructor() {
    this.keyId = config.RAZORPAY_KEY_ID || 'rzp_test_Tb5IgNzWYoM8XZ';
    this.keySecret = config.RAZORPAY_KEY_SECRET || 'dJeBGBGGWizT3gYDWuKxTTlh';

    this.client = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret
    });
  }

  /**
   * Return Razorpay Public Key ID for client-side SDK checkout modal
   */
  getKeyId() {
    return this.keyId;
  }

  /**
   * Create Razorpay Gateway Order
   * Converts amount in INR (Rupees) to paise (1 INR = 100 paise)
   *
   * @param {Object} params
   * @param {Number} params.amount - Amount in INR (e.g. 2250)
   * @param {String} [params.currency='INR']
   * @param {String} [params.receipt] - Unique receipt ID
   * @param {Object} [params.notes] - Custom metadata key-values
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const err = new Error('Invalid amount for creating Razorpay order');
      err.statusCode = 400;
      throw err;
    }

    // Convert to paise
    const amountInPaise = Math.round(numAmount * 100);
    const receiptId = receipt || `rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    try {
      const razorpayOrder = await this.client.orders.create({
        amount: amountInPaise,
        currency,
        receipt: receiptId,
        notes: {
          platform: "Tia'z Digital Gold & Silver",
          ...notes
        }
      });

      return {
        orderId: razorpayOrder.id,
        id: razorpayOrder.id, // alias
        amount: razorpayOrder.amount, // in paise
        amountInRupees: numAmount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        keyId: this.keyId
      };
    } catch (error) {
      const err = new Error(`Razorpay Order Creation Failed: ${error.error?.description || error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Cryptographically verify Razorpay Payment Signature
   * Formula: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret) == razorpay_signature
   *
   * @param {Object} params
   * @param {String} params.razorpay_order_id
   * @param {String} params.razorpay_payment_id
   * @param {String} params.razorpay_signature
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const err = new Error('Payment verification requires razorpay_order_id, razorpay_payment_id, and razorpay_signature');
      err.statusCode = 400;
      throw err;
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(razorpay_signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      const err = new Error('Invalid Razorpay payment signature. Payment verification failed.');
      err.statusCode = 400;
      throw err;
    }

    return true;
  }

  /**
   * Fetch payment details directly from Razorpay
   * @param {String} paymentId - e.g. "pay_29QQoUBi66xm2f"
   */
  async fetchPayment(paymentId) {
    if (!paymentId) throw new Error('paymentId is required to fetch Razorpay payment');
    try {
      return await this.client.payments.fetch(paymentId);
    } catch (error) {
      const err = new Error(`Failed to fetch Razorpay payment: ${error.error?.description || error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }
}

module.exports = new RazorpayService();

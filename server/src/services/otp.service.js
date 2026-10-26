const User = require('../models/User');
const { generateOTP, sendSMS } = require('../utils/otp');

class OtpService {
  async sendOtp(mobile, purpose = 'login') {
    const user = await User.findOne({ mobile });

    // 1. Check if user is registered
    if (!user) {
      const error = new Error('User not found. Please register first.');
      error.statusCode = 404;
      error.isRegistered = false;
      throw error;
    }

    // 2. Check if account is blocked
    if (user.isBlocked) {
      const error = new Error('Your account has been blocked. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Check KYC status (Only 'verified' users can login)
    const kycStatus = (user.kyc && user.kyc.status) || 'pending';
    if (user.role === 'user' && kycStatus !== 'verified') {
      let msg = 'Your KYC verification is pending. You can only login once your KYC is verified.';
      let rejectionReason = null;

      if (kycStatus === 'rejected') {
        rejectionReason = user.kyc?.rejectionReason || 'Invalid documents';
        msg = `Your KYC has been rejected. Reason: ${rejectionReason}. Please re-submit your documents.`;
      } else if (kycStatus === 'under_review') {
        msg = 'Your KYC is under review. Please wait for admin approval before logging in.';
      } else if (kycStatus === 'pending') {
        msg = 'Your KYC verification is currently pending. Please wait for verification to login.';
      }

      const error = new Error(msg);
      error.statusCode = 403;
      error.kycStatus = kycStatus;
      error.rejectionReason = rejectionReason;
      throw error;
    }

    // 4. Generate & Save OTP
    const otp = generateOTP();

    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    // 5. Send SMS via Gateway
    await sendSMS(mobile, otp);

    console.log(`OTP for ${mobile} :`, otp);

    return {
      mobile,
      isRegistered: true,
      kycStatus: 'verified'
    };
  }

  async verifyOtp(mobile, otp) {
    const user = await User.findOne({ mobile }).select('+otp +otpExpire');

    if (!user) {
      const error = new Error('User not found. Please register first.');
      error.statusCode = 404;
      error.isRegistered = false;
      throw error;
    }

    if (user.isBlocked) {
      const error = new Error('Your account has been blocked. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    const kycStatus = (user.kyc && user.kyc.status) || 'pending';
    if (user.role === 'user' && kycStatus !== 'verified') {
      const error = new Error('Your KYC is not verified yet. Login is only allowed for verified accounts.');
      error.statusCode = 403;
      error.kycStatus = kycStatus;
      throw error;
    }

    if (!user.otp) {
      const error = new Error('OTP not found. Please request a new OTP.');
      error.statusCode = 400;
      throw error;
    }

    if (user.otpExpire < new Date()) {
      const error = new Error('OTP has expired. Please request a new OTP.');
      error.statusCode = 400;
      throw error;
    }

    if (user.otp !== otp) {
      const error = new Error('Invalid OTP. Please enter the correct OTP.');
      error.statusCode = 400;
      throw error;
    }

    user.otp = null;
    user.otpExpire = null;
    user.lastLoginAt = new Date();
    await user.save();

    const userData = user.toObject();
    delete userData.otp;
    delete userData.otpExpire;

    return userData;
  }
}

module.exports = new OtpService();

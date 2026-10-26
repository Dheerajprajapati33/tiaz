const User = require("../models/User");
const Notification = require("../models/Notification");

class KycService {
  async getKycStatus(userId) {
    const user = await User.findById(userId).select("kyc fullName mobile");
    if (!user) throw new Error("User not found");
    return user.kyc || { status: "pending" };
  }

  async reviewKyc(adminId, targetUserId, status, rejectionReason = null) {
    const user = await User.findById(targetUserId);
    if (!user) throw new Error("User not found");

    if (!user.kyc) {
      user.kyc = {};
    }

    user.kyc.status = status; // 'verified', 'rejected', 'under_review'
    user.kyc.reviewedAt = new Date();
    user.kyc.reviewedBy = adminId;
    if (status === "rejected") {
      user.kyc.rejectionReason = rejectionReason;
    } else {
      user.kyc.rejectionReason = null;
    }

    await user.save();
    return user.kyc;
  }

  async reUploadKycDocuments(userId, files = {}, data = {}) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const getFileUrl = (fieldName) => {
      if (files && files[fieldName] && files[fieldName][0]) {
        return `/uploads/users/${userId}/${files[fieldName][0].filename}`;
      }
      return null;
    };

    if (!user.kyc) {
      user.kyc = {};
    }

    if (files.aadhaarFront) user.kyc.aadhaarFront = getFileUrl("aadhaarFront");
    if (files.aadhaarBack) user.kyc.aadhaarBack = getFileUrl("aadhaarBack");
    if (files.panCard) user.kyc.panCard = getFileUrl("panCard");

    if (data.panNumber) user.panNumber = data.panNumber.trim().toUpperCase();
    if (data.dob) user.dob = new Date(data.dob);
    if (data.gender) user.gender = data.gender;
    if (data.address) user.address = data.address.trim();
    if (data.fullName) user.fullName = data.fullName.trim();

    user.kyc.status = "under_review";
    user.kyc.rejectionReason = null;
    user.kyc.submittedAt = new Date();

    await user.save();

    try {
      await Notification.create({
        userId: user._id,
        title: "KYC Documents Submitted",
        message: "Your KYC documents have been submitted and are currently under review by our admin team.",
        type: "KYC",
      });
    } catch (_) {}

    return user.kyc;
  }

  async verifyUser(userId) {
    if (!userId) {
      const err = new Error("Please provide a valid userId.");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found with the provided userId.");
      err.statusCode = 404;
      throw err;
    }

    if (!user.kyc) {
      user.kyc = {};
    }

    user.kyc.status = "verified";
    user.kyc.rejectionReason = null;
    user.kyc.reviewedAt = new Date();

    await user.save();

    try {
      await Notification.create({
        userId: user._id,
        title: "Account Verified",
        message:
          "Your account has been verified successfully! You can now log in and trade gold.",
        type: "KYC",
      });
    } catch (_) {}

    return {
      _id: user._id,
      fullName: user.fullName,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      kyc: user.kyc,
      isProfileComplete: user.isProfileComplete,
    };
  }
}

module.exports = new KycService();

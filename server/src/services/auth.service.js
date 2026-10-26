const mongoose = require("mongoose");
const User = require("../models/User");
const GoldWallet = require("../models/GoldWallet");
const SilverWallet = require("../models/SilverWallet");
const Referral = require("../models/Referral");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const rateSettingService = require("./rateSetting.service");
const walletService = require("./wallet.service");
const otpService = require("./otp.service");
const { hashPassword, comparePassword } = require("../utils/encryption");
const { generateToken } = require("../utils/jwt");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const cleanUpFolder = (userId) => {
  if (userId) {
    const userFolder = path.join(
      __dirname,
      "../../uploads/users",
      userId.toString(),
    );
    if (fs.existsSync(userFolder)) {
      try {
        fs.rmSync(userFolder, { recursive: true, force: true });
      } catch (e) {}
    }
  }
};

class AuthService {
  async sendLoginOtp(mobile) {
    return await otpService.sendOtp(mobile);
  }

  async verifyOtpAndLogin(mobile, otp) {
    const user = await otpService.verifyOtp(mobile, otp);
    const token = generateToken({ userId: user._id, role: user.role });

    return {
      token,
      user: {
        _id: user._id,
        id: user._id.toString(),
        fullName: user.fullName,
        name: user.fullName,
        mobile: user.mobile,
        email: user.email,
        referralCode: user.referralCode,
        kycStatus: (user.kyc && user.kyc.status) || "pending",
      },
    };
  }

  async register(userData, files = {}) {
    let {
      fullName,
      mobile,
      email,
      dob,
      gender,
      panNumber,
      address,
      nationality,
      referralCode,
      password,
    } = userData;

     referralCode = referralCode || userData.referredBy || userData.inviteCode;

    const userId = userData._id || new mongoose.Types.ObjectId();

    try {
      // 1. Mobile number validation & sanitization
      if (!mobile) {
        throw new Error("Mobile number is required.");
      }

      // Clean mobile format (keep 10 digits)
      mobile = mobile.toString().replace(/\D/g, "").slice(-10);
      if (mobile.length !== 10) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }

      // Check Mobile Uniqueness
      const existingMobileUser = await User.findOne({ mobile });
      if (existingMobileUser) {
        const error = new Error(
          "An account is already registered with this mobile number. Please login.",
        );
        error.statusCode = 409;
        throw error;
      }

      // 2. Email validation & Uniqueness (if provided)
      if (email) {
        email = email.trim().toLowerCase();
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
          const error = new Error(
            "An account is already registered with this email address.",
          );
          error.statusCode = 409;
          throw error;
        }
      }

      // 3. Referral code validation (if applicant provided one)
      let referredByUser = null;
      if (referralCode) {
        referralCode = referralCode.trim().toUpperCase();
        referredByUser = await User.findOne({ referralCode });
        if (!referredByUser) {
          const error = new Error("The referral code you entered is invalid.");
          error.statusCode = 400;
          throw error;
        }
        if (referredByUser.isBlocked) {
          const error = new Error(
            "The referral code you entered belongs to a suspended account.",
          );
          error.statusCode = 400;
          throw error;
        }
        if (referredByUser.mobile === mobile) {
          const error = new Error("You cannot use your own referral code.");
          error.statusCode = 400;
          throw error;
        }
      }

      // 4. File uploads extraction (Aadhaar & PAN are completely optional during registration)
      const getFileUrl = (fieldName) => {
        if (files && files[fieldName] && files[fieldName][0]) {
          const file = files[fieldName][0];
          return `/uploads/users/${userId}/${file.filename}`;
        }
        return null;
      };

      const profileImageUrl =
        getFileUrl("profileImage") || userData.profileImage || null;
      const aadhaarFrontUrl =
        getFileUrl("aadhaarFront") || userData.aadhaarFront || null;
      const aadhaarBackUrl =
        getFileUrl("aadhaarBack") || userData.aadhaarBack || null;
      const panCardUrl = getFileUrl("panCard") || userData.panCard || null;

      const hasKycDocs = !!(aadhaarFrontUrl || panCardUrl);

      // 5. Generate Guaranteed Unique Referral Code for the new user
      let myReferralCode;
      let isUnique = false;
      while (!isUnique) {
        myReferralCode =
          "GOLD" + crypto.randomBytes(3).toString("hex").toUpperCase();
        const existing = await User.findOne({ referralCode: myReferralCode });
        if (!existing) isUnique = true;
      }

      // 6. Hash password if provided
      const hashedPassword = password
        ? await hashPassword(password)
        : undefined;

      // 7. Create User Document
      const user = await User.create({
        _id: userId,
        fullName: fullName ? fullName.trim() : "",
        mobile,
        email: email || undefined,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        panNumber: panNumber ? panNumber.trim().toUpperCase() : null,
        address: address ? address.trim() : null,
        nationality: nationality ? nationality.trim() : "Indian",
        password: hashedPassword,
        profileImage: profileImageUrl,
        kyc: {
          aadhaarFront: aadhaarFrontUrl,
          aadhaarBack: aadhaarBackUrl,
          panCard: panCardUrl,
          status: hasKycDocs ? "under_review" : "pending",
          submittedAt: hasKycDocs ? new Date() : null,
        },
        referralCode: myReferralCode,
        referredBy: referredByUser ? referredByUser._id : null,
      });

      // 8. Create Bullion Wallets (Gold & Silver) for User
      await Promise.all([
        GoldWallet.create({ userId: user._id }),
        SilverWallet.create({ userId: user._id }),
      ]);

      // 9. Track Referral & Credit Reward to Referrer's Wallet based on Admin Settings
      if (referredByUser) {
        try {
          const settings = await rateSettingService.getSettings();
          const isRewardEnabled = settings.referralRewardEnabled !== false;
          const rewardType = (
            settings.referralRewardType || "CASH"
          ).toUpperCase();
          const rewardAmount = Math.max(
            0,
            Number(settings.referralRewardAmount ?? 51),
          );

          let rewardAmountINR = 0;
          let rewardGoldGrams = 0;

          if (isRewardEnabled && rewardAmount > 0) {
            const friendName = user.fullName || user.mobile;
            const txnNumber =
              "TXN-REF-" +
              Date.now() +
              crypto.randomBytes(3).toString("hex").toUpperCase();

            if (rewardType === "CASH") {
              rewardAmountINR = rewardAmount;
              // Credit INR cash directly to referrer's Tia'z Wallet (cashBalance)
              // ✅ Is tarah badal dein:
              const refWallet = await GoldWallet.findOneAndUpdate(
                { userId: referredByUser._id },
                { $setOnInsert: { userId: referredByUser._id } },
                { new: true, upsert: true },
              );
              const currentCash = parseFloat(
                (refWallet.cashBalance || 0).toString(),
              );
              refWallet.cashBalance =
                Math.round((currentCash + rewardAmount) * 100) / 100;
              await refWallet.save();

              // Ledger record in Transaction collection
              await Transaction.create({
                userId: referredByUser._id,
                transactionNumber: txnNumber,
                metalType: "INR",
                buyType: "VIRTUAL",
                type: "REFERRAL_REWARD",
                direction: "CREDIT",
                amount: rewardAmount,
                quantity: 0,
                status: "COMPLETED",
                description: `Referral cash reward of ₹${rewardAmount} for inviting ${friendName}`,
              });

              // Notification to referrer
              Notification.create({
                userId: referredByUser._id,
                title: "Referral Reward Credited! 🎁",
                message: `Congratulations! Your friend ${friendName} registered using your referral code. ₹${rewardAmount} has been credited to your Tia'z Wallet.`,
                type: "REFERRAL",
                data: {
                  referredUserId: user._id,
                  rewardAmount,
                  rewardType: "CASH",
                },
              }).catch(() => {});
            } else if (rewardType === "GOLD") {
              rewardGoldGrams = rewardAmount;
              // Credit 24K digital gold into referrer's GoldWallet
              const refGoldWallet = await GoldWallet.findOneAndUpdate(
                { userId: referredByUser._id },
                { $setOnInsert: { userId: referredByUser._id } },
                { new: true, upsert: true },
              );
              const currAvail = parseFloat(
                (refGoldWallet.availableGold || 0).toString(),
              );
              const currVirt = parseFloat(
                (refGoldWallet.virtualGold || 0).toString(),
              );
              refGoldWallet.availableGold =
                Math.round((currAvail + rewardAmount) * 10000) / 10000;
              refGoldWallet.virtualGold =
                Math.round((currVirt + rewardAmount) * 10000) / 10000;
              await refGoldWallet.save();

              await Transaction.create({
                userId: referredByUser._id,
                transactionNumber: txnNumber,
                metalType: "GOLD",
                buyType: "VIRTUAL",
                type: "REFERRAL_REWARD",
                direction: "CREDIT",
                amount: 0,
                quantity: rewardAmount,
                goldQuantity: rewardAmount,
                status: "COMPLETED",
                description: `Referral gold reward of ${rewardAmount}g 24K Gold for inviting ${friendName}`,
              });

              Notification.create({
                userId: referredByUser._id,
                title: "Referral Gold Reward Credited! 🪙",
                message: `Congratulations! Your friend ${friendName} registered using your referral code. ${rewardAmount}g 24K Gold has been added to your vault.`,
                type: "REFERRAL",
                data: {
                  referredUserId: user._id,
                  rewardGold: rewardAmount,
                  rewardType: "GOLD",
                },
              }).catch(() => {});
            } else if (rewardType === "SILVER") {
              // Credit 999 digital silver into referrer's SilverWallet
              const refSilverWallet = await SilverWallet.findOneAndUpdate(
                { userId: referredByUser._id },
                { $setOnInsert: { userId: referredByUser._id } },
                { new: true, upsert: true },
              );
              const currAvail = parseFloat(
                (refSilverWallet.availableSilver || 0).toString(),
              );
              const currVirt = parseFloat(
                (refSilverWallet.virtualSilver || 0).toString(),
              );
              refSilverWallet.availableSilver =
                Math.round((currAvail + rewardAmount) * 10000) / 10000;
              refSilverWallet.virtualSilver =
                Math.round((currVirt + rewardAmount) * 10000) / 10000;
              await refSilverWallet.save();

              await Transaction.create({
                userId: referredByUser._id,
                transactionNumber: txnNumber,
                metalType: "SILVER",
                buyType: "VIRTUAL",
                type: "REFERRAL_REWARD",
                direction: "CREDIT",
                amount: 0,
                quantity: rewardAmount,
                status: "COMPLETED",
                description: `Referral silver reward of ${rewardAmount}g Silver for inviting ${friendName}`,
              });

              Notification.create({
                userId: referredByUser._id,
                title: "Referral Silver Reward Credited! 🪙",
                message: `Congratulations! Your friend ${friendName} registered using your referral code. ${rewardAmount}g 999 Silver has been added to your vault.`,
                type: "REFERRAL",
                data: {
                  referredUserId: user._id,
                  rewardSilver: rewardAmount,
                  rewardType: "SILVER",
                },
              }).catch(() => {});
            }
          }

          await Referral.create({
            referrerId: referredByUser._id,
            referredUserId: user._id,
            referralCode,
            status:
              isRewardEnabled && rewardAmount > 0 ? "REWARDED" : "PENDING",
            rewardAmount: rewardAmountINR,
            rewardGold: rewardGoldGrams,
            rewardedAt: isRewardEnabled && rewardAmount > 0 ? new Date() : null,
          });
        } catch (refErr) {
          console.error(
            "Error awarding referral reward during registration:",
            refErr,
          );
        }
      }

      const token = generateToken({ userId: user._id, role: user.role });

      return {
        token,
        user: {
          _id: user._id,
          id: user._id.toString(),
          fullName: user.fullName,
          name: user.fullName,
          mobile: user.mobile,
          email: user.email,
          referralCode: user.referralCode,
          kycStatus: (user.kyc && user.kyc.status) || "pending",
        },
        message: hasKycDocs
          ? "Account created successfully! Your KYC documents are submitted for review."
          : "Account created successfully!",
      };
    } catch (error) {
      // In case of any validation or duplicate key failure, wipe the uploaded files from disk
      cleanUpFolder(userId);

      // Handle MongoDB 11000 duplicate key error gracefully
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || "field";
        const duplicateError = new Error(
          `An account already exists with this ${field}.`,
        );
        duplicateError.statusCode = 409;
        throw duplicateError;
      }

      throw error;
    }
  }

  async login(mobile, password) {
    // Sanitize mobile
    mobile = mobile.toString().replace(/\D/g, "").slice(-10);

    const user = await User.findOne({ mobile }).select("+password");
    if (!user) {
      const error = new Error(
        "No account found with this mobile number. Please register first.",
      );
      error.statusCode = 404;
      throw error;
    }

    if (user.isBlocked) {
      const error = new Error(
        "Your account has been blocked. Please contact support.",
      );
      error.statusCode = 403;
      throw error;
    }

    const kycStatus = (user.kyc && user.kyc.status) || "pending";

    if (!user.password) {
      throw new Error("Account was set up with OTP. Please login via OTP.");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid mobile number or password.");
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({ userId: user._id, role: user.role });

    return {
      token,
      user: {
        _id: user._id,
        id: user._id.toString(),
        fullName: user.fullName,
        name: user.fullName,
        mobile: user.mobile,
        email: user.email,
        referralCode: user.referralCode,
        kycStatus,
      },
    };
  }

  async adminLogin(emailOrMobile, password) {
    if (!emailOrMobile || !password) {
      const error = new Error("Email/Mobile and password are required.");
      error.statusCode = 400;
      throw error;
    }

    const cleanInput = emailOrMobile.toString().trim();
    const cleanEmail = cleanInput.toLowerCase();
    const cleanMobile = cleanInput.replace(/\D/g, "").slice(-10);

    // Find user by email or mobile
    const admin = await User.findOne({
      $or: [
        { email: cleanEmail },
        { mobile: cleanMobile.length === 10 ? cleanMobile : "NON_EXISTENT" },
      ],
    }).select("+password");

    if (!admin) {
      const error = new Error("Invalid administrator credentials.");
      error.statusCode = 401;
      throw error;
    }

    if (admin.role !== "admin") {
      const error = new Error(
        "Access denied. Administrator privileges required.",
      );
      error.statusCode = 403;
      throw error;
    }

    if (admin.isBlocked || !admin.isActive) {
      const error = new Error(
        "Administrator account is deactivated or blocked.",
      );
      error.statusCode = 403;
      throw error;
    }

    if (!admin.password) {
      const error = new Error("Password is not set for this account.");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken({ userId: admin._id, role: admin.role });

    const name = admin.fullName || "Rajesh Varma";
    const namePrefix = (
      name.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "ADM"
    ).toUpperCase();
    const idSuffix = admin._id.toString().slice(-4).toUpperCase();
    const formattedId = `${namePrefix}-${idSuffix}`;

    // Format last login: "DD MMM YYYY, hh:mm A"
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
      token,
      admin: {
        id: formattedId,
        rawId: admin._id,
        name: name,
        email: admin.email || "admin@tiaz.com",
        mobile: admin.mobile,
        role: "Super Administrator",
        department: admin.department || "Risk & Custody Operations",
        profileImage: admin.profileImage || null,
        avatar: admin.profileImage || null,
        lastLogin: formattedLastLogin,
        lastLoginAt: admin.lastLoginAt,
      },
    };
  }
}

module.exports = new AuthService();

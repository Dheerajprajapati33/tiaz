const mongoose = require('mongoose');
const User = require('../models/User');
const GoldWallet = require('../models/GoldWallet');
const Referral = require('../models/Referral');
const { hashPassword, comparePassword } = require('../utils/encryption');

class UserService {
  async getUserFullData(userId) {
    const user = await User.findById(userId)
      .select('-password -otp -otpExpire')
      .populate('referredBy', 'fullName mobile');

    if (!user) throw new Error('User not found');

    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    // Run parallel queries for Wallet and Referral stats
    const [
      wallet,
      totalReferrals,
      successfulReferrals,
      referralRewardAgg
    ] = await Promise.all([
      // 1. Gold Wallet (ensure exists)
      GoldWallet.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId } },
        { new: true, upsert: true }
      ),

      // 2. Referrals stats
      Referral.countDocuments({ referrerId: userObjectId }),
      Referral.countDocuments({ referrerId: userObjectId, status: { $in: ['SUCCESSFUL', 'REWARDED'] } }),
      Referral.aggregate([
        { $match: { referrerId: userObjectId, status: 'REWARDED' } },
        {
          $group: {
            _id: null,
            totalRewardAmount: { $sum: { $toDouble: '$rewardAmount' } },
            totalRewardGold: { $sum: { $toDouble: '$rewardGold' } }
          }
        }
      ])
    ]);

    const rewardStats = (referralRewardAgg && referralRewardAgg[0]) || { totalRewardAmount: 0, totalRewardGold: 0 };

    return {
      user,
      wallet,
      referrals: {
        referralCode: user.referralCode,
        totalReferrals: totalReferrals || 0,
        successfulReferrals: successfulReferrals || 0,
        totalRewardAmount: rewardStats.totalRewardAmount || 0,
        totalRewardGold: rewardStats.totalRewardGold || 0
      }
    };
  }

  async getProfile(userId) {
    return await this.getUserFullData(userId);
  }

  async updateProfile(userId, updateData, file = null) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Reject mobile number modification attempt
    if (updateData.mobile !== undefined || updateData.phone !== undefined) {
      const error = new Error('Mobile number cannot be updated. Please contact customer support for mobile number changes.');
      error.statusCode = 400;
      throw error;
    }

    const allowed = [
      'fullName',
      'email',
      'dob',
      'gender',
      'panNumber',
      'address',
      'nationality'
    ];

    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        user[key] = updateData[key];
      }
    }

    if (updateData.panNumber) {
      user.panNumber = updateData.panNumber.trim().toUpperCase();
    }

    if (updateData.address) {
      user.address = updateData.address.trim();
    }

    if (updateData.nationality) {
      user.nationality = updateData.nationality.trim();
    }

    // If new profileImage file was uploaded in the same request
    if (file) {
      user.profileImage = `/uploads/users/${userId}/${file.filename}`;
    }

    await user.save();
    return await this.getUserFullData(userId);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error('User not found');

    if (user.password) {
      const isMatch = await comparePassword(oldPassword, user.password);
      if (!isMatch) throw new Error('Incorrect current password');
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    return true;
  }
}

module.exports = new UserService();

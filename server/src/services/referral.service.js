const mongoose = require("mongoose");
const Referral = require("../models/Referral");
const User = require("../models/User");

class ReferralService {
  async getReferralScreenData(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    // 1. Fetch User details for referral code
    const user = await User.findById(userObjectId).select(
      "fullName referralCode",
    );
    if (!user) throw new Error("User not found");

    const referralCode = user.referralCode || "";
    const shareLink = `https://tiaz.app/refer/${referralCode}`;
    const shareMessage = `Join Tia'z using my referral code ${referralCode} and get free 24K digital gold on your first investment: ${shareLink}`;

    // 2. How It Works steps matching screenshot 20/25

    // 3. Parallel Queries for stats & referred friends
    const [referralsList, statsAgg] = await Promise.all([
      Referral.find({ referrerId: userObjectId })
        .populate("referredUserId", "fullName mobile profileImage createdAt")
        .sort({ createdAt: -1 }),
      Referral.aggregate([
        { $match: { referrerId: userObjectId } },
        {
          $group: {
            _id: null,
            totalReferrals: { $sum: 1 },
            successfulReferrals: {
              $sum: {
                $cond: [{ $in: ["$status", ["SUCCESSFUL", "REWARDED"]] }, 1, 0],
              },
            },
            totalRewardGold: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["SUCCESSFUL", "REWARDED"]] },
                  { $toDouble: "$rewardGold" },
                  0,
                ],
              },
            },
            totalRewardAmount: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["SUCCESSFUL", "REWARDED"]] },
                  { $toDouble: "$rewardAmount" },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const stats = (statsAgg && statsAgg[0]) || {
      totalReferrals: 0,
      successfulReferrals: 0,
      totalRewardGold: 0,
      totalRewardAmount: 0,
    };

    // 4. Your Earnings (4 Stat Cards matching screenshot)
    const yourEarnings = {
      totalGoldEarned: {
        grams: Math.round(stats.totalRewardGold * 10000) / 10000,
        formattedGrams: `${(Math.round(stats.totalRewardGold * 10000) / 10000).toFixed(4)} gm`,
        label: "Total Gold Earned",
        icon: "gold_coin",
      },
      totalReferrals: {
        count: stats.totalReferrals,
        label: "Total Referrals",
        icon: "users",
      },
      successfulReferrals: {
        count: stats.successfulReferrals,
        label: "Successful Referrals",
        icon: "check_circle",
      },
      rewardsValue: {
        amount: Math.round(stats.totalRewardAmount * 100) / 100,
        formattedAmount: `₹${(Math.round(stats.totalRewardAmount * 100) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        label: "Rewards Value",
        icon: "rupee",
      },
    };

    // 5. Format Referred Friends list matching screenshot
    const referredFriends = referralsList.map((ref) => {
      const friend = ref.referredUserId;
      const friendName = friend
        ? friend.fullName || "New Friend"
        : "Invited Contact";
      const avatarLetter = (friendName.charAt(0) || "U").toUpperCase();
      const createdDate = new Date(
        ref.createdAt || (friend ? friend.createdAt : Date.now()),
      );

      const formattedJoinDate = `Joined on ${createdDate.toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      )}`;

      let status = "Pending Purchase";
      let statusColor = "orange";
      let rewardText = "Not eligible yet";

      if (ref.status === "REWARDED" || ref.status === "SUCCESSFUL") {
        status = "Successful";
        statusColor = "green";
        const goldQty = parseFloat(
          ref.rewardGold ? ref.rewardGold.toString() : "0",
        );
        const amt = parseFloat(
          ref.rewardAmount ? ref.rewardAmount.toString() : "0",
        );
        if (goldQty > 0) {
          rewardText = `Earned ${goldQty >= 1 ? goldQty.toFixed(2) + " gm" : (goldQty * 1000).toFixed(0) + " mg"}`;
        } else if (amt > 0) {
          rewardText = `Earned ₹${amt.toLocaleString("en-IN")}`;
        } else {
          rewardText = "Earned Reward";
        }
      } else if (ref.status === "EXPIRED") {
        status = "Expired";
        statusColor = "gray";
        rewardText = "Offer expired";
      }

      return {
        _id: ref._id,
        name: friendName,
        avatarLetter,
        mobileMasked:
          friend && friend.mobile ? `******${friend.mobile.slice(-4)}` : null,
        joinedDate: formattedJoinDate,
        status,
        statusColor,
        rewardText,
        createdAt: ref.createdAt,
      };
    });

    return {
      referralCode,
      shareLink,
      shareMessage,
      yourEarnings,
      referredFriends,
    };
  }

  /**
   * Lightweight list of users who signed up using this user's referral code.
   * Returns who was referred, when, their status, and reward credited.
   */
  async getMyReferredUsers(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());
    const user = await User.findById(userObjectId).select(
      "fullName referralCode",
    );
    if (!user) throw new Error("User not found");

    const referrals = await Referral.find({ referrerId: userObjectId })
      .populate(
        "referredUserId",
        "fullName mobile email profileImage createdAt",
      )
      .sort({ createdAt: -1 });

    const list = referrals.map((ref) => {
      const friend = ref.referredUserId || {};
      const rewardGold = parseFloat((ref.rewardGold || 0).toString());
      const rewardAmount = parseFloat((ref.rewardAmount || 0).toString());
      return {
        _id: ref._id,
        referredUserId: friend._id || null,
        name: friend.fullName || "New User",
        mobile: friend.mobile
          ? `******${String(friend.mobile).slice(-4)}`
          : null,
        email: friend.email || null,
        profileImage: friend.profileImage || null,
        status: ref.status,
        rewardGold,
        rewardAmount,
        rewardedAt: ref.rewardedAt || null,
        joinedAt: ref.createdAt,
      };
    });

    return {
      referralCode: user.referralCode || "",
      totalReferrals: list.length,
      successfulReferrals: list.filter(
        (r) => r.status === "SUCCESSFUL" || r.status === "REWARDED",
      ).length,
      referrals: list,
    };
  }
}

module.exports = new ReferralService();

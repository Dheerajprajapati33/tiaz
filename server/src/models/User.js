const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },

    fullName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    dob: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
    },

    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      default: null,
    },

    nationality: {
      type: String,
      trim: true,
      default: "Indian",
    },

    profileImage: {
      type: String,
      default: null,
    },

    department: {
      type: String,
      trim: true,
      default: "Risk & Custody Operations",
    },

    upiId: {
      type: String,
      trim: true,
      default: null,
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
      index: true,
    },

    password: {
      type: String,
      select: false,
    },

    pin: {
      type: String,
      select: false,
    },

    otp: {
      type: String,
      select: false,
      default: null,
    },

    otpExpire: {
      type: Date,
      select: false,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    kyc: {
      aadhaarFront: {
        type: String,
        default: null,
      },
      aadhaarBack: {
        type: String,
        default: null,
      },
      panCard: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        enum: ["pending", "under_review", "verified", "rejected"],
        default: "pending",
        index: true,
      },
      rejectionReason: {
        type: String,
        default: null,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      index: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastLoginIp: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Automatic pre-save hook to calculate isProfileComplete
userSchema.pre("save", function (next) {
  const isComplete = Boolean(
    this.fullName &&
    this.fullName.trim().length > 0 &&
    this.mobile &&
    this.email &&
    this.dob &&
    this.gender &&
    this.panNumber &&
    this.address &&
    this.profileImage,
  );
  this.isProfileComplete = isComplete;
  next();
});

module.exports = mongoose.model("User", userSchema);

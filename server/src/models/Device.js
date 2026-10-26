const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    deviceId: {
      type: String,
      required: true,
    },

    deviceName: {
      type: String,
      default: null,
    },

    platform: {
      type: String,
      enum: ["android", "ios", "web", "other"],
      default: "other",
    },

    osVersion: {
      type: String,
      default: null,
    },

    appVersion: {
      type: String,
      default: null,
    },

    pushToken: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    isTrusted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model("Device", deviceSchema);

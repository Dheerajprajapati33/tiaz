const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      enum: ['terms', 'privacy'],
      index: true
    },
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      required: true,
      default: ''
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Content', contentSchema);

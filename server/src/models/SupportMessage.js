const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      enum: ['USER', 'SUPPORT', 'ADMIN'],
      default: 'USER'
    },
    message: {
      type: String,
      required: true
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String
      }
    ],
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportMessage', supportMessageSchema);

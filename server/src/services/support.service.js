const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const FAQ = require('../models/FAQ');
const crypto = require('crypto');

class SupportService {
  async createTicket(userId, { subject, category, priority, message }) {
    const ticketNumber = 'TCK' + Date.now().toString().slice(-6) + crypto.randomBytes(2).toString('hex').toUpperCase();

    const ticket = await SupportTicket.create({
      ticketNumber,
      user: userId,
      subject,
      category,
      priority
    });

    await SupportMessage.create({
      ticket: ticket._id,
      sender: userId,
      senderType: 'USER',
      message
    });

    return ticket;
  }

  async getUserTickets(userId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      SupportTicket.find({ user: userId }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      SupportTicket.countDocuments({ user: userId })
    ]);
    return { tickets, total };
  }

  async getTicketDetails(userId, ticketId) {
    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId });
    if (!ticket) throw new Error('Ticket not found');

    const messages = await SupportMessage.find({ ticket: ticketId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    return { ticket, messages };
  }

  async replyToTicket(ticketId, senderId, senderType, message, attachments = []) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const supportMsg = await SupportMessage.create({
      ticket: ticketId,
      sender: senderId,
      senderType,
      message,
      attachments
    });

    ticket.updatedAt = new Date();
    await ticket.save();

    return supportMsg;
  }

  async getFAQs(category) {
    const query = { isPublished: true };
    if (category) query.category = category;
    return await FAQ.find(query).sort({ order: 1 });
  }
}

module.exports = new SupportService();

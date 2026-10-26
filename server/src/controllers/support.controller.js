const supportService = require('../services/support.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

class SupportController {
  async createTicket(req, res) {
    try {
      const ticket = await supportService.createTicket(req.user._id, req.body);
      return successResponse(res, 'Support ticket created successfully', ticket, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getTickets(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const { tickets, total } = await supportService.getUserTickets(req.user._id, { page, limit });
      return paginatedResponse(res, 'Tickets retrieved', tickets, { page, limit, total });
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getTicketDetails(req, res) {
    try {
      const details = await supportService.getTicketDetails(req.user._id, req.params.ticketId);
      return successResponse(res, 'Ticket details retrieved', details);
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  async replyTicket(req, res) {
    try {
      const { message, attachments } = req.body;
      const reply = await supportService.addMessage(
        req.params.ticketId,
        req.user._id,
        req.user.role === 'ADMIN' ? 'ADMIN' : 'USER',
        message,
        attachments
      );
      return successResponse(res, 'Reply added', reply, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getFAQs(req, res) {
    try {
      const faqs = await supportService.getFAQs(req.query.category);
      return successResponse(res, 'FAQs retrieved', faqs);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new SupportController();

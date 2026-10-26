import { create } from 'zustand';
import { initialSupportTickets } from '../mock/supportTickets.js';

export const useSupportStore = create((set, get) => ({
  tickets: initialSupportTickets,
  loading: false,
  error: null,
  activeTab: 'Open',
  searchQuery: '',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addReply: (ticketId, replyText, adminName = 'Rajesh Varma (Admin)') => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      name: adminName,
      time: new Date().toLocaleTimeString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      content: replyText
    };

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              updatedAt: new Date().toISOString(),
              messages: [...t.messages, newMessage]
            }
          : t
      )
    }));
  },

  updateTicketStatus: (ticketId, newStatus) => {
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
  },

  assignTicket: (ticketId, agentName) => {
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, assignedTo: agentName, updatedAt: new Date().toISOString() }
          : t
      )
    }));
  },

  getTicketById: (id) => get().tickets.find((t) => t.id === id)
}));

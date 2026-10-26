import { create } from 'zustand';
import { initialPayments } from '../mock/payments.js';

export const usePaymentStore = create((set, get) => ({
  payments: initialPayments,
  loading: false,
  error: null,
  methodFilter: 'All',
  searchQuery: '',

  setMethodFilter: (method) => set({ methodFilter: method }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  updatePaymentStatus: (paymentId, newStatus) => {
    set((state) => ({
      payments: state.payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: newStatus,
              paidAt: newStatus === 'Success' ? new Date().toISOString() : p.paidAt
            }
          : p
      )
    }));
  },

  getPaymentById: (id) => get().payments.find((p) => p.id === id)
}));

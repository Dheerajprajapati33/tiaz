import { create } from 'zustand';
import { initialTransactions } from '../mock/transactions.js';

export const useTransactionStore = create((set, get) => ({
  transactions: initialTransactions,
  loading: false,
  error: null,
  typeFilter: 'All',
  searchQuery: '',

  setTypeFilter: (filter) => set({ typeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addTransaction: (newTxn) => {
    set((state) => ({
      transactions: [
        {
          id: `TXN-2025-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString(),
          status: 'Success',
          channel: 'Admin Portal',
          ...newTxn
        },
        ...state.transactions
      ]
    }));
  },

  getTransactionById: (id) => get().transactions.find((t) => t.id === id)
}));

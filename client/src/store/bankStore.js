import { create } from 'zustand';
import { initialBankAccounts } from '../mock/bankAccounts.js';

export const useBankStore = create((set, get) => ({
  accounts: initialBankAccounts,
  loading: false,
  error: null,
  statusFilter: 'All',
  searchQuery: '',

  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  verifyAccount: (id) => {
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id
          ? { ...a, verificationStatus: 'Verified', pennyDropStatus: 'Success (Verified by Admin)' }
          : a
      )
    }));
  },

  rejectAccount: (id, reason = 'Name mismatch in penny drop') => {
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id
          ? { ...a, verificationStatus: 'Failed', pennyDropStatus: `Failed: ${reason}` }
          : a
      )
    }));
  },

  getAccountById: (id) => get().accounts.find((a) => a.id === id)
}));

import { create } from 'zustand';
import { initialReferrals } from '../mock/referrals.js';

export const useReferralStore = create((set, get) => ({
  referrals: initialReferrals,
  loading: false,
  error: null,
  statusFilter: 'All',
  searchQuery: '',

  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  rewardReferral: (referralId, amount = 250, gold = 0.033) => {
    set((state) => ({
      referrals: state.referrals.map((r) =>
        r.id === referralId
          ? {
              ...r,
              status: 'Successful',
              rewardAmount: amount,
              rewardGold: gold,
              rewardedAt: new Date().toISOString()
            }
          : r
      )
    }));
  },

  getReferralById: (id) => get().referrals.find((r) => r.id === id)
}));

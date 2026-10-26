import { create } from 'zustand';
import { initialKycs } from '../mock/kycs.js';
import { useUserStore } from './userStore.js';

export const useKycStore = create((set, get) => ({
  kycs: initialKycs,
  loading: false,
  error: null,
  activeTab: 'Pending',
  searchQuery: '',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  approveKyc: (kycId, adminNotes = 'Approved by compliance officer') => {
    const kyc = get().kycs.find((k) => k.id === kycId);
    if (kyc) {
      // Update user kycStatus in userStore
      useUserStore.getState().updateUserKycStatus(kyc.userId, 'Verified');
    }

    set((state) => ({
      kycs: state.kycs.map((k) =>
        k.id === kycId
          ? {
              ...k,
              status: 'Verified',
              adminNotes,
              rejectionReason: '',
              timeline: [
                ...k.timeline,
                {
                  step: 'Approved by Compliance Officer',
                  date: new Date().toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  status: 'done'
                }
              ]
            }
          : k
      )
    }));
  },

  rejectKyc: (kycId, rejectionReason = 'Document verification failed. Please submit a clearer copy.') => {
    const kyc = get().kycs.find((k) => k.id === kycId);
    if (kyc) {
      useUserStore.getState().updateUserKycStatus(kyc.userId, 'Rejected');
    }

    set((state) => ({
      kycs: state.kycs.map((k) =>
        k.id === kycId
          ? {
              ...k,
              status: 'Rejected',
              rejectionReason,
              timeline: [
                ...k.timeline,
                {
                  step: `Rejected: ${rejectionReason}`,
                  date: new Date().toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  status: 'failed'
                }
              ]
            }
          : k
      )
    }));
  },

  requestReupload: (kycId, instructions = 'Please upload a high-resolution color scan of address proof') => {
    set((state) => ({
      kycs: state.kycs.map((k) =>
        k.id === kycId
          ? {
              ...k,
              status: 'Pending',
              rejectionReason: instructions,
              adminNotes: `Re-upload requested: ${instructions}`,
              timeline: [
                ...k.timeline,
                {
                  step: `Re-upload Requested: ${instructions}`,
                  date: new Date().toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  status: 'pending'
                }
              ]
            }
          : k
      )
    }));
  },

  updateKycNotes: (kycId, notes) => {
    set((state) => ({
      kycs: state.kycs.map((k) =>
        k.id === kycId ? { ...k, adminNotes: notes } : k
      )
    }));
  },

  getKycById: (kycId) => {
    return get().kycs.find((k) => k.id === kycId);
  }
}));

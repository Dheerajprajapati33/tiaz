import { create } from 'zustand';
import { initialUsers } from '../mock/users.js';

export const useUserStore = create((set, get) => ({
  users: initialUsers,
  loading: false,
  error: null,
  searchQuery: '',
  statusFilter: 'All',
  kycFilter: 'All',
  roleFilter: 'All',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setKycFilter: (filter) => set({ kycFilter: filter }),
  setRoleFilter: (filter) => set({ roleFilter: filter }),

  blockUser: (userId) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: 'Blocked' } : u
      )
    }));
  },

  unblockUser: (userId) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: 'Active' } : u
      )
    }));
  },

  updateUser: (userId, updates) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, ...updates } : u
      )
    }));
  },

  updateUserKycStatus: (userId, newKycStatus) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, kycStatus: newKycStatus } : u
      )
    }));
  },

  getUserById: (userId) => {
    return get().users.find((u) => u.id === userId);
  }
}));

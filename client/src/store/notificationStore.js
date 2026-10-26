import { create } from 'zustand';
import { initialNotifications } from '../mock/notifications.js';

export const useNotificationStore = create((set) => ({
  notifications: initialNotifications,
  loading: false,
  error: null,
  typeFilter: 'All',

  setTypeFilter: (filter) => set({ typeFilter: filter }),

  createNotification: (newNotif) => {
    const entry = {
      id: `NOTIF-2025-${String(Date.now()).slice(-4)}`,
      status: 'Sent',
      sentCount: newNotif.targetAudience === 'All Users' ? 24582 : (newNotif.targetAudience === 'Verified Users' ? 21806 : 1284),
      openRate: '0.0%',
      sentAt: new Date().toISOString(),
      ...newNotif
    };
    set((state) => ({
      notifications: [entry, ...state.notifications]
    }));
    return entry;
  }
}));

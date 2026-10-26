import { create } from 'zustand';
import { initialDevices } from '../mock/devices.js';
import { initialLoginHistory } from '../mock/loginHistory.js';

export const useDeviceStore = create((set, get) => ({
  devices: initialDevices,
  loginHistory: initialLoginHistory,
  loading: false,
  error: null,
  deviceSearch: '',
  loginSearch: '',
  loginMethodFilter: 'All',
  loginStatusFilter: 'All',

  setDeviceSearch: (q) => set({ deviceSearch: q }),
  setLoginSearch: (q) => set({ loginSearch: q }),
  setLoginMethodFilter: (m) => set({ loginMethodFilter: m }),
  setLoginStatusFilter: (s) => set({ loginStatusFilter: s }),

  removeDevice: (id) => {
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id)
    }));
  },

  toggleTrusted: (id) => {
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, isTrusted: !d.isTrusted } : d
      )
    }));
  }
}));

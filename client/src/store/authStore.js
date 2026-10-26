import { create } from 'zustand';
import { authApi } from '../services/api.js';

// Read existing session from localStorage if available
const getSavedAuth = () => {
  try {
    const token = localStorage.getItem('tiaz_admin_token');
    const userJson = localStorage.getItem('tiaz_admin_user');
    if (token && userJson) {
      return { token, user: JSON.parse(userJson), isAuthenticated: true };
    }
  } catch (e) {
    console.error('Error loading saved admin session:', e);
  }
  return { token: null, user: null, isAuthenticated: false };
};

const initialAuth = getSavedAuth();

export const useAuthStore = create((set) => ({
  token: initialAuth.token,
  isAuthenticated: initialAuth.isAuthenticated,
  adminUser: initialAuth.user || {
    id: 'RAJ-89C1',
    name: 'Rajesh Varma',
    email: 'admin@tiaz.com',
    role: 'Super Administrator',
    department: 'Risk & Custody Operations',
    phone: '+91 98200 11990',
    avatar: null,
    lastLogin: '30 Sep 2026, 02:05 PM',
    permissions: ['all']
  },
  loading: false,
  error: null,

  login: async (email, password, rememberMe = true) => {
    set({ loading: true, error: null });

    try {
      // Call Live Backend Admin Login API
      const response = await authApi.adminLogin(email, password);

      if (response && response.success && response.data) {
        const { token, admin } = response.data;

        // Persist token and admin profile in storage
        if (rememberMe) {
          localStorage.setItem('tiaz_admin_token', token);
          localStorage.setItem('tiaz_admin_user', JSON.stringify(admin));
        } else {
          sessionStorage.setItem('tiaz_admin_token', token);
          sessionStorage.setItem('tiaz_admin_user', JSON.stringify(admin));
        }

        set({
          isAuthenticated: true,
          adminUser: admin,
          token,
          loading: false,
          error: null
        });

        return { success: true, data: admin };
      } else {
        const msg = response?.message || 'Login failed. Please verify credentials.';
        set({ loading: false, error: msg });
        return { success: false, error: msg };
      }
    } catch (err) {
      const errorMsg = err.message || 'Connection error. Please ensure backend server is reachable.';
      set({
        loading: false,
        error: errorMsg
      });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('tiaz_admin_token');
    localStorage.removeItem('tiaz_admin_user');
    sessionStorage.removeItem('tiaz_admin_token');
    sessionStorage.removeItem('tiaz_admin_user');

    set({
      token: null,
      isAuthenticated: false,
      adminUser: null,
      error: null
    });
  },

  updateProfile: (profileData) => {
    set((state) => {
      const updated = {
        ...state.adminUser,
        ...profileData
      };
      try {
        localStorage.setItem('tiaz_admin_user', JSON.stringify(updated));
      } catch (e) {}
      return { adminUser: updated };
    });
  }
}));

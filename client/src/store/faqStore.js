import { create } from 'zustand';
import { initialFaqs } from '../mock/faqs.js';

export const useFaqStore = create((set, get) => ({
  faqs: initialFaqs,
  loading: false,
  error: null,
  categoryFilter: 'All',
  searchQuery: '',

  setCategoryFilter: (cat) => set({ categoryFilter: cat }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addFaq: (newFaq) => {
    const entry = {
      id: `FAQ-${String(Date.now()).slice(-4)}`,
      viewsCount: 0,
      order: get().faqs.length + 1,
      status: 'Active',
      ...newFaq
    };
    set((state) => ({ faqs: [...state.faqs, entry] }));
  },

  updateFaq: (id, updates) => {
    set((state) => ({
      faqs: state.faqs.map((f) => (f.id === id ? { ...f, ...updates } : f))
    }));
  },

  deleteFaq: (id) => {
    set((state) => ({
      faqs: state.faqs.filter((f) => f.id !== id)
    }));
  },

  toggleFaqStatus: (id) => {
    set((state) => ({
      faqs: state.faqs.map((f) =>
        f.id === id ? { ...f, status: f.status === 'Active' ? 'Inactive' : 'Active' } : f
      )
    }));
  }
}));

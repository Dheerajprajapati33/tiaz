import { create } from 'zustand';
import { initialBuyOrders } from '../mock/goldOrders.js';
import { initialSellOrders } from '../mock/sellOrders.js';

export const useOrderStore = create((set, get) => ({
  buyOrders: initialBuyOrders,
  sellOrders: initialSellOrders,
  loading: false,
  error: null,

  updateBuyOrderStatus: (orderId, newStatus) => {
    set((state) => ({
      buyOrders: state.buyOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: newStatus,
              paymentStatus: newStatus === 'Completed' ? 'Paid' : (newStatus === 'Failed' ? 'Failed' : o.paymentStatus),
              timeline: [
                ...o.timeline,
                {
                  status: `Admin set status to ${newStatus}`,
                  time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  done: newStatus !== 'Failed'
                }
              ]
            }
          : o
      )
    }));
  },

  updateSellOrderStatus: (orderId, newStatus) => {
    set((state) => ({
      sellOrders: state.sellOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              timeline: [
                ...o.timeline,
                {
                  status: `Payout status updated to ${newStatus}`,
                  time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  done: newStatus !== 'Failed'
                }
              ]
            }
          : o
      )
    }));
  },

  getBuyOrderById: (id) => get().buyOrders.find((o) => o.id === id),
  getSellOrderById: (id) => get().sellOrders.find((o) => o.id === id)
}));

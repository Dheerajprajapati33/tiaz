import { create } from 'zustand';
import { initialGoldRates, initialRateHistory } from '../mock/goldRates.js';

export const useGoldStore = create((set, get) => ({
  rates: initialGoldRates,
  rateHistory: initialRateHistory,
  loading: false,
  error: null,

  updateRate: ({ purity, pricePerGram, buyRate, sellRate, source, effectiveDate, notes }) => {
    const currentRate = get().rates.find((r) => r.purity === purity);
    const oldBuy = currentRate ? currentRate.buyRate : buyRate;
    const oldSell = currentRate ? currentRate.sellRate : sellRate;

    const diff = Number((buyRate - oldBuy).toFixed(2));
    const diffPct = oldBuy > 0 ? Number(((diff / oldBuy) * 100).toFixed(2)) : 0;

    const newHistoryEntry = {
      id: `RH-${Date.now().toString().slice(-4)}`,
      purity,
      oldBuyRate: oldBuy,
      newBuyRate: Number(buyRate),
      oldSellRate: oldSell,
      newSellRate: Number(sellRate),
      updatedBy: 'Admin (Logged-in Desk)',
      date: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      reason: notes || 'Admin Manual Rate Revision'
    };

    set((state) => ({
      rates: state.rates.map((r) =>
        r.purity === purity
          ? {
              ...r,
              pricePerGram: Number(pricePerGram),
              pricePer10Gram: Number((pricePerGram * 10).toFixed(2)),
              buyRate: Number(buyRate),
              sellRate: Number(sellRate),
              source: source || r.source,
              effectiveDate: effectiveDate || new Date().toLocaleString(),
              updatedAt: new Date().toISOString(),
              change: diff,
              changePercentage: diffPct,
              trend: diff >= 0 ? 'up' : 'down',
              notes: notes || r.notes
            }
          : r
      ),
      rateHistory: [newHistoryEntry, ...state.rateHistory]
    }));
  },

  toggleRateStatus: (purity) => {
    set((state) => ({
      rates: state.rates.map((r) =>
        r.purity === purity
          ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' }
          : r
      )
    }));
  },

  getRateByPurity: (purity) => {
    return get().rates.find((r) => r.purity === purity);
  }
}));

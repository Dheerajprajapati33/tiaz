import { create } from 'zustand';
import { initialSilverRates, initialSilverRateHistory } from '../mock/silverRates.js';

export const useSilverStore = create((set, get) => ({
  rates: initialSilverRates,
  rateHistory: initialSilverRateHistory,
  loading: false,
  error: null,

  updateRate: ({ purity, pricePerGram, buyRate, sellRate, source, effectiveDate, notes }) => {
    const currentRate = get().rates.find((r) => r.purity === purity);
    const oldBuy = currentRate ? currentRate.buyRate : buyRate;
    const oldSell = currentRate ? currentRate.sellRate : sellRate;

    const diff = Number((buyRate - oldBuy).toFixed(2));
    const diffPct = oldBuy > 0 ? Number(((diff / oldBuy) * 100).toFixed(2)) : 0;

    const newHistoryEntry = {
      id: `SRH-${Date.now().toString().slice(-4)}`,
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
      reason: notes || 'Admin Manual Silver Rate Revision'
    };

    set((state) => ({
      rates: state.rates.map((r) =>
        r.purity === purity
          ? {
              ...r,
              pricePerGram: Number(pricePerGram),
              pricePerKg: Number((pricePerGram * 1000).toFixed(2)),
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
          ? { ...r, status: r.status === 'Active' ? 'Disabled' : 'Active' }
          : r
      )
    }));
  }
}));

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';
import { useGoldStore } from '../../store/goldStore.js';
import { useToast } from '../common/Toast.jsx';
import { AlertCircle } from 'lucide-react';

export default function EditRateModal({ isOpen, onClose, rate }) {
  const { updateRate } = useGoldStore();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    purity: '24K',
    fineness: '99.9%',
    pricePerGram: 7485.50,
    buyRate: 7485.50,
    sellRate: 7260.00,
    source: 'IBJA Spot + MMTC-PAMP Vault Benchmark',
    effectiveDate: new Date().toLocaleString(),
    notes: 'Routine daily bullion price revision'
  });

  useEffect(() => {
    if (rate) {
      setFormData({
        purity: rate.purity,
        fineness: rate.fineness,
        pricePerGram: rate.pricePerGram,
        buyRate: rate.buyRate,
        sellRate: rate.sellRate,
        source: rate.source,
        effectiveDate: new Date().toLocaleString(),
        notes: ''
      });
    }
  }, [rate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateRate({
      purity: formData.purity,
      pricePerGram: Number(formData.pricePerGram),
      buyRate: Number(formData.buyRate),
      sellRate: Number(formData.sellRate),
      source: formData.source,
      effectiveDate: formData.effectiveDate,
      notes: formData.notes
    });
    addToast(`${formData.purity} Gold Rate updated to ₹${formData.buyRate}/g`, 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update ${rate?.purity || '24K'} Gold Rate`}
      subtitle="Modify benchmark buy and sell prices in frontend mock state"
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Rate Revision
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Notice of Mock Data */}
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            <span className="font-bold">MOCK DATA NOTICE:</span> This updates local Zustand state and updates all rates, buy/sell values, and dashboard charts immediately. It does not alter external bullion market exchanges.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Purity Grade"
            value={formData.purity}
            disabled
            helperText={`Fineness: ${formData.fineness}`}
          />
          <Input
            label="Base Price / Gram (₹)"
            type="number"
            step="0.1"
            value={formData.pricePerGram}
            onChange={(e) => setFormData({ ...formData, pricePerGram: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Customer Buy Rate / g (₹)"
            type="number"
            step="0.1"
            value={formData.buyRate}
            onChange={(e) => setFormData({ ...formData, buyRate: e.target.value })}
            required
            helperText="Price charged when user buys gold"
          />
          <Input
            label="Customer Sell Rate / g (₹)"
            type="number"
            step="0.1"
            value={formData.sellRate}
            onChange={(e) => setFormData({ ...formData, sellRate: e.target.value })}
            required
            helperText="Payout credited when user sells"
          />
        </div>

        <Input
          label="Price Feed Source"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          placeholder="e.g. IBJA Spot, MMTC-PAMP, MCX"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Revision Reason / Note
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Morning trading open recalibration..."
            className="w-full bg-white text-sm text-slate-900 rounded-lg border border-slate-300 px-3.5 py-2 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 focus:outline-none"
          />
        </div>
      </form>
    </Modal>
  );
}

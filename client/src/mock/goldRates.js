// Mock Gold Rates for TIA'Z Platform (24K, 22K, 20K, 18K, 14K)
// Clearly designated as MOCK DATA for simulation and admin preview purposes

export const initialGoldRates = [
  {
    purity: '24K',
    fineness: '99.9%',
    finenessValue: 999,
    pricePerGram: 7485.50,
    pricePer10Gram: 74855.00,
    buyRate: 7485.50,
    sellRate: 7260.00,
    spreadPercentage: 3.01,
    change: +34.50,
    changePercentage: +0.46,
    trend: 'up',
    source: 'IBJA (India Bullion and Jewellers Association) + MMTC-PAMP',
    status: 'Active',
    updatedAt: new Date().toISOString(),
    effectiveDate: '2025-02-15 09:30 AM',
    notes: 'Primary benchmark rate for 99.99% pure investment-grade digital gold.'
  },
  {
    purity: '22K',
    fineness: '91.6%',
    finenessValue: 916,
    pricePerGram: 6862.00,
    pricePer10Gram: 68620.00,
    buyRate: 6862.00,
    sellRate: 6656.00,
    spreadPercentage: 3.00,
    change: +31.20,
    changePercentage: +0.45,
    trend: 'up',
    source: 'IBJA Spot Daily Reference',
    status: 'Active',
    updatedAt: new Date().toISOString(),
    effectiveDate: '2025-02-15 09:30 AM',
    notes: 'Jewellery grade benchmark purity rate.'
  },
  {
    purity: '20K',
    fineness: '83.3%',
    finenessValue: 833,
    pricePerGram: 6235.00,
    pricePer10Gram: 62350.00,
    buyRate: 6235.00,
    sellRate: 6048.00,
    spreadPercentage: 3.00,
    change: +28.00,
    changePercentage: +0.45,
    trend: 'up',
    source: 'TIA\'Z Internal Sovereign Reference',
    status: 'Active',
    updatedAt: new Date().toISOString(),
    effectiveDate: '2025-02-15 09:30 AM',
    notes: 'Secondary exchange purity tier.'
  },
  {
    purity: '18K',
    fineness: '75.0%',
    finenessValue: 750,
    pricePerGram: 5614.00,
    pricePer10Gram: 56140.00,
    buyRate: 5614.00,
    sellRate: 5445.00,
    spreadPercentage: 3.01,
    change: +25.50,
    changePercentage: +0.46,
    trend: 'up',
    source: 'MCX Spot Derivative Average',
    status: 'Active',
    updatedAt: new Date().toISOString(),
    effectiveDate: '2025-02-15 09:30 AM',
    notes: 'Specialty & luxury watch grade purity reference.'
  },
  {
    purity: '14K',
    fineness: '58.5%',
    finenessValue: 585,
    pricePerGram: 4379.00,
    pricePer10Gram: 43790.00,
    buyRate: 4379.00,
    sellRate: 4247.00,
    spreadPercentage: 3.01,
    change: +19.80,
    changePercentage: +0.45,
    trend: 'up',
    source: 'TIA\'Z Vault Partner Matrix',
    status: 'Active',
    updatedAt: new Date().toISOString(),
    effectiveDate: '2025-02-15 09:30 AM',
    notes: 'Entry-level consumer jewellery grade standard.'
  }
];

export const initialRateHistory = [
  { id: 'RH-101', purity: '24K', oldBuyRate: 7451.00, newBuyRate: 7485.50, oldSellRate: 7227.00, newSellRate: 7260.00, updatedBy: 'Admin (R. Varma)', date: '2025-02-15 09:30 AM', reason: 'Morning market open price update' },
  { id: 'RH-102', purity: '22K', oldBuyRate: 6830.80, newBuyRate: 6862.00, oldSellRate: 6625.00, newSellRate: 6656.00, updatedBy: 'Admin (R. Varma)', date: '2025-02-15 09:30 AM', reason: 'IBJA morning fix update' },
  { id: 'RH-103', purity: '24K', oldBuyRate: 7420.00, newBuyRate: 7451.00, oldSellRate: 7197.00, newSellRate: 7227.00, updatedBy: 'System Auto-Sync', date: '2025-02-14 06:00 PM', reason: 'Evening closing adjustment' },
  { id: 'RH-104', purity: '18K', oldBuyRate: 5588.50, newBuyRate: 5614.00, oldSellRate: 5420.00, newSellRate: 5445.00, updatedBy: 'Admin (P. Sharma)', date: '2025-02-14 11:15 AM', reason: 'Spot spread recalibration' },
  { id: 'RH-105', purity: '24K', oldBuyRate: 7390.00, newBuyRate: 7420.00, oldSellRate: 7168.00, newSellRate: 7197.00, updatedBy: 'System Auto-Sync', date: '2025-02-13 09:30 AM', reason: 'Market rate adjustment' }
];

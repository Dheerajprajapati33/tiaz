// Mock Silver Rates for TIA'Z Platform (999 Fine Silver, 925 Sterling Silver, 900 Coin Silver)
// designated for simulation and admin preview purposes

export const initialSilverRates = [
  {
    purity: '999 Fine',
    fineness: '99.9%',
    finenessValue: 999,
    pricePerGram: 92.50,
    pricePerKg: 92500.00,
    buyRate: 92.50,
    sellRate: 89.20,
    spreadPercentage: 3.57,
    change: +0.85,
    changePercentage: +0.93,
    trend: 'up',
    source: 'IBJA (India Bullion and Jewellers Association) + MMTC-PAMP',
    status: 'Active',
    updatedAt: new Date().toISOString(),
    effectiveDate: '2025-02-15 09:30 AM',
    notes: 'Primary wholesale benchmark rate for 99.9% pure investment-grade digital silver.'
  },
  {
    purity: '925 Sterling',
    fineness: '92.5%',
    finenessValue: 925,
    pricePerGram: 85.60,
    pricePerKg: 85600.00,
    buyRate: 85.60,
    sellRate: 82.50,
    spreadPercentage: 3.62,
    change: +0.78,
    changePercentage: +0.92,
    trend: 'up',
    source: 'IBJA Spot Daily Silver Reference',
    status: 'Active',
    updatedAt: new Date().toISOString(),
    effectiveDate: '2025-02-15 09:30 AM',
    notes: 'Sterling silver exchange & jewellery benchmark standard.'
  },
  {
    purity: '900 Coin',
    fineness: '90.0%',
    finenessValue: 900,
    pricePerGram: 83.25,
    pricePerKg: 83250.00,
    buyRate: 83.25,
    sellRate: 80.20,
    spreadPercentage: 3.66,
    change: +0.70,
    changePercentage: +0.85,
    trend: 'up',
    source: "TIA'Z Internal Sovereign Bullion Reference",
    status: 'Active',
    updatedAt: new Date().toISOString(),
    effectiveDate: '2025-02-15 09:30 AM',
    notes: 'Numismatic and sovereign commemorative minting grade.'
  }
];

export const initialSilverRateHistory = [
  {
    id: 'SRH-104',
    purity: '999 Fine',
    oldBuyRate: 91.65,
    newBuyRate: 92.50,
    oldSellRate: 88.40,
    newSellRate: 89.20,
    updatedBy: 'Admin (Logged-in Desk)',
    date: '15 Feb 2025, 09:30 AM',
    reason: 'IBJA Silver fixing morning adjustment'
  },
  {
    id: 'SRH-103',
    purity: '925 Sterling',
    oldBuyRate: 84.80,
    newBuyRate: 85.60,
    oldSellRate: 81.70,
    newSellRate: 82.50,
    updatedBy: 'Automated Feed (MCX Spot)',
    date: '14 Feb 2025, 05:00 PM',
    reason: 'MCX Silver closing delta sync'
  },
  {
    id: 'SRH-102',
    purity: '999 Fine',
    oldBuyRate: 90.90,
    newBuyRate: 91.65,
    oldSellRate: 87.70,
    newSellRate: 88.40,
    updatedBy: 'Automated Feed (MCX Spot)',
    date: '13 Feb 2025, 05:00 PM',
    reason: 'Global spot bullion benchmark calibration'
  }
];

export const silverPriceData = {
  '1D': [
    { time: '09:00 AM', rate: 91.80 },
    { time: '10:00 AM', rate: 91.95 },
    { time: '11:00 AM', rate: 92.10 },
    { time: '12:00 PM', rate: 92.05 },
    { time: '01:00 PM', rate: 92.20 },
    { time: '02:00 PM', rate: 92.35 },
    { time: '03:00 PM', rate: 92.40 },
    { time: '04:00 PM', rate: 92.30 },
    { time: '05:00 PM', rate: 92.50 }
  ],
  '7D': [
    { time: 'Feb 09', rate: 89.40 },
    { time: 'Feb 10', rate: 90.10 },
    { time: 'Feb 11', rate: 89.80 },
    { time: 'Feb 12', rate: 90.90 },
    { time: 'Feb 13', rate: 91.65 },
    { time: 'Feb 14', rate: 92.10 },
    { time: 'Feb 15', rate: 92.50 }
  ],
  '1M': [
    { time: 'Jan 16', rate: 84.50 },
    { time: 'Jan 21', rate: 85.80 },
    { time: 'Jan 26', rate: 87.20 },
    { time: 'Jan 31', rate: 88.50 },
    { time: 'Feb 05', rate: 89.90 },
    { time: 'Feb 10', rate: 91.20 },
    { time: 'Feb 15', rate: 92.50 }
  ],
  '3M': [
    { time: 'Nov 2024', rate: 81.20 },
    { time: 'Dec 2024', rate: 83.90 },
    { time: 'Jan 2025', rate: 87.50 },
    { time: 'Feb 2025', rate: 92.50 }
  ],
  '1Y': [
    { time: 'Mar 24', rate: 74.00 },
    { time: 'May 24', rate: 78.50 },
    { time: 'Jul 24', rate: 81.20 },
    { time: 'Sep 24', rate: 83.80 },
    { time: 'Nov 24', rate: 86.40 },
    { time: 'Jan 25', rate: 89.90 },
    { time: 'Feb 25', rate: 92.50 }
  ]
};

export const silverBuyVsSellData = [
  { month: 'Aug', buyAmount: 85, sellAmount: 22 },
  { month: 'Sep', buyAmount: 110, sellAmount: 28 },
  { month: 'Oct (Diwali)', buyAmount: 215, sellAmount: 44 },
  { month: 'Nov', buyAmount: 155, sellAmount: 51 },
  { month: 'Dec', buyAmount: 140, sellAmount: 55 },
  { month: 'Jan', buyAmount: 180, sellAmount: 64 },
  { month: 'Feb', buyAmount: 198, sellAmount: 68 }
];

export const silverRecentTransactions = [
  {
    id: 'TXN-SLV-8912',
    userName: 'Aarav Mehta',
    userId: 'USR-1029',
    type: 'Buy Silver',
    silverQuantity: 250.0,
    amount: 23125,
    status: 'Completed',
    date: '2025-02-15 11:42 AM'
  },
  {
    id: 'TXN-SLV-8911',
    userName: 'Kavita Sundaram',
    userId: 'USR-1034',
    type: 'Buy Silver',
    silverQuantity: 1000.0,
    amount: 92500,
    status: 'Completed',
    date: '2025-02-15 10:15 AM'
  },
  {
    id: 'TXN-SLV-8910',
    userName: 'Rohan Deshmukh',
    userId: 'USR-1048',
    type: 'Sell Silver',
    silverQuantity: 500.0,
    amount: 44600,
    status: 'Completed',
    date: '2025-02-15 09:50 AM'
  },
  {
    id: 'TXN-SLV-8909',
    userName: 'Priya Sharma',
    userId: 'USR-1011',
    type: 'Buy Silver',
    silverQuantity: 500.0,
    amount: 46250,
    status: 'Completed',
    date: '2025-02-14 04:30 PM'
  },
  {
    id: 'TXN-SLV-8908',
    userName: 'Vikram Joshi',
    userId: 'USR-1082',
    type: 'Sell Silver',
    silverQuantity: 200.0,
    amount: 17840,
    status: 'Completed',
    date: '2025-02-14 02:18 PM'
  }
];

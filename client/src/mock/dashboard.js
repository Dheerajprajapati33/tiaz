// Dashboard Mock Statistics and Chart Datasets for TIA'Z Digital Gold Platform

export const initialDashboardStats = {
  totalUsers: 24582,
  activeUsers: 18942,
  kycPending: 1284,
  kycVerified: 21806,
  kycUnderReview: 842,
  kycRejected: 650,
  goldHoldingsKg: 842.560,
  totalPurchasedInr: 128400000, // ₹12.84 Cr
  totalSoldInr: 42800000,      // ₹4.28 Cr
  totalTransactions: 48920,
  liveGoldRate24K: 7485.50,
  liveGoldRate22K: 6862.00,
  liveGoldRate18K: 5614.00,
  dayChangePercentage: +0.46,
  dayChangeAmount: +34.50
};

// 1. Gold Price Datasets across 1D, 7D, 1M, 3M, 1Y
export const goldPriceData = {
  '1D': [
    { time: '09:00 AM', rate: 7451.00 },
    { time: '10:00 AM', rate: 7460.50 },
    { time: '11:00 AM', rate: 7458.00 },
    { time: '12:00 PM', rate: 7472.00 },
    { time: '01:00 PM', rate: 7468.50 },
    { time: '02:00 PM', rate: 7479.00 },
    { time: '03:00 PM', rate: 7482.00 },
    { time: '04:00 PM', rate: 7480.00 },
    { time: '05:00 PM', rate: 7485.50 }
  ],
  '7D': [
    { time: 'Feb 09', rate: 7380.00 },
    { time: 'Feb 10', rate: 7405.00 },
    { time: 'Feb 11', rate: 7392.00 },
    { time: 'Feb 12', rate: 7420.00 },
    { time: 'Feb 13', rate: 7445.00 },
    { time: 'Feb 14', rate: 7465.00 },
    { time: 'Feb 15', rate: 7485.50 }
  ],
  '1M': [
    { time: 'Jan 16', rate: 7210.00 },
    { time: 'Jan 21', rate: 7260.00 },
    { time: 'Jan 26', rate: 7315.00 },
    { time: 'Jan 31', rate: 7350.00 },
    { time: 'Feb 05', rate: 7390.00 },
    { time: 'Feb 10', rate: 7440.00 },
    { time: 'Feb 15', rate: 7485.50 }
  ],
  '3M': [
    { time: 'Nov 2024', rate: 7050.00 },
    { time: 'Dec 2024', rate: 7180.00 },
    { time: 'Jan 2025', rate: 7320.00 },
    { time: 'Feb 2025', rate: 7485.50 }
  ],
  '1Y': [
    { time: 'Mar 24', rate: 6540.00 },
    { time: 'May 24', rate: 6720.00 },
    { time: 'Jul 24', rate: 6910.00 },
    { time: 'Sep 24', rate: 7080.00 },
    { time: 'Nov 24', rate: 7210.00 },
    { time: 'Jan 25', rate: 7380.00 },
    { time: 'Feb 25', rate: 7485.50 }
  ]
};

// 2. Buy vs Sell Gold Volume (Monthly in Lakhs ₹)
export const buyVsSellData = [
  { month: 'Aug', buyAmount: 112, sellAmount: 34 },
  { month: 'Sep', buyAmount: 145, sellAmount: 42 },
  { month: 'Oct (Diwali)', buyAmount: 260, sellAmount: 58 },
  { month: 'Nov', buyAmount: 198, sellAmount: 65 },
  { month: 'Dec', buyAmount: 184, sellAmount: 70 },
  { month: 'Jan', buyAmount: 220, sellAmount: 82 },
  { month: 'Feb', buyAmount: 245, sellAmount: 89 }
];

// 3. User Growth Data (Cumulative Users in Thousands)
export const userGrowthData = [
  { month: 'Aug', totalUsers: 9.4, activeUsers: 7.2 },
  { month: 'Sep', totalUsers: 11.8, activeUsers: 9.1 },
  { month: 'Oct', totalUsers: 15.6, activeUsers: 12.4 },
  { month: 'Nov', totalUsers: 18.2, activeUsers: 14.5 },
  { month: 'Dec', totalUsers: 20.7, activeUsers: 16.3 },
  { month: 'Jan', totalUsers: 22.9, activeUsers: 17.8 },
  { month: 'Feb', totalUsers: 24.58, activeUsers: 18.94 }
];

// 4. Transaction Volume Daily Trend (in ₹ Lakhs)
export const transactionVolumeData = [
  { day: 'Feb 09', volume: 42.5, count: 620 },
  { day: 'Feb 10', volume: 51.2, count: 740 },
  { day: 'Feb 11', volume: 48.0, count: 690 },
  { day: 'Feb 12', volume: 64.8, count: 880 },
  { day: 'Feb 13', volume: 72.1, count: 950 },
  { day: 'Feb 14', volume: 88.4, count: 1140 },
  { day: 'Feb 15', volume: 96.2, count: 1280 }
];

// 5. KYC Status Distribution
export const kycDistributionData = [
  { name: 'Verified', value: 21806, color: '#10B981' },
  { name: 'Pending', value: 1284, color: '#F59E0B' },
  { name: 'Under Review', value: 842, color: '#38BDF8' },
  { name: 'Rejected', value: 650, color: '#EF4444' }
];

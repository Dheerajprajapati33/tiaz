// 30 Realistic Sell Gold Orders for TIA'Z Platform
import { initialUsers } from './users.js';

export const initialSellOrders = [
  {
    id: 'SO-2025-4101',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    userMobile: '+91 98201 44521',
    userEmail: 'aarav.sharma@gmail.com',
    goldQuantity: 6.000,
    purity: '24K',
    sellRate: 7260.00,
    amount: 43560.00,
    payoutCharges: 0.00,
    netPayout: 43560.00,
    bankName: 'HDFC Bank',
    bankAccountMasked: 'XXXX XXXX 4521',
    ifsc: 'HDFC0000128',
    payoutMode: 'IMPS Direct Credit',
    utrNumber: 'IMPS50451109923',
    status: 'Completed',
    date: '2025-02-14T16:30:00Z',
    timeline: [
      { status: 'Sell Request Initiated', time: '2025-02-14 04:30 PM', done: true },
      { status: 'Gold Debited from Vault', time: '2025-02-14 04:31 PM', done: true },
      { status: 'Bank Payout Dispatched', time: '2025-02-14 04:32 PM', done: true },
      { status: 'UTR Acknowledged', time: '2025-02-14 04:33 PM', done: true }
    ]
  },
  {
    id: 'SO-2025-4102',
    userId: 'U1002',
    userName: 'Priya Patel',
    userMobile: '+91 98791 22891',
    userEmail: 'priya.patel@outlook.com',
    goldQuantity: 15.000,
    purity: '24K',
    sellRate: 7255.00,
    amount: 108825.00,
    payoutCharges: 0.00,
    netPayout: 108825.00,
    bankName: 'ICICI Bank',
    bankAccountMasked: 'XXXX XXXX 8832',
    ifsc: 'ICIC0000451',
    payoutMode: 'NEFT Payout',
    utrNumber: 'ICICN5044998231',
    status: 'Completed',
    date: '2025-02-13T10:15:00Z',
    timeline: [
      { status: 'Sell Request Initiated', time: '2025-02-13 10:15 AM', done: true },
      { status: 'Vault Release Authorized', time: '2025-02-13 10:16 AM', done: true },
      { status: 'Funds Credited to User Bank', time: '2025-02-13 10:35 AM', done: true }
    ]
  },
  {
    id: 'SO-2025-4103',
    userId: 'U1005',
    userName: 'Vikramaditya Singhania',
    userMobile: '+91 98110 99881',
    userEmail: 'vikram.singhania@corp.in',
    goldQuantity: 50.000,
    purity: '24K',
    sellRate: 7240.00,
    amount: 362000.00,
    payoutCharges: 0.00,
    netPayout: 362000.00,
    bankName: 'Kotak Mahindra Bank',
    bankAccountMasked: 'XXXX XXXX 9912',
    ifsc: 'KKBK0000214',
    payoutMode: 'RTGS Instant',
    utrNumber: 'KOTAKR520250212003',
    status: 'Completed',
    date: '2025-02-12T13:45:00Z',
    timeline: [
      { status: 'Sell Request Initiated', time: '2025-02-12 01:45 PM', done: true },
      { status: 'RTGS Dispatched', time: '2025-02-12 01:50 PM', done: true }
    ]
  },
  {
    id: 'SO-2025-4104',
    userId: 'U1007',
    userName: 'Suresh Kumar Menon',
    userMobile: '+91 98470 54321',
    userEmail: 'suresh.menon@kerala.net',
    goldQuantity: 10.000,
    purity: '24K',
    sellRate: 7260.00,
    amount: 72600.00,
    payoutCharges: 0.00,
    netPayout: 72600.00,
    bankName: 'State Bank of India',
    bankAccountMasked: 'XXXX XXXX 3390',
    ifsc: 'SBIN0001428',
    payoutMode: 'IMPS',
    utrNumber: 'Pending Gateway Batch',
    status: 'Processing',
    date: '2025-02-15T09:20:00Z',
    timeline: [
      { status: 'Sell Request Initiated', time: '2025-02-15 09:20 AM', done: true },
      { status: 'Gold Locked for Vault Redemption', time: '2025-02-15 09:21 AM', done: true },
      { status: 'Waiting Bank Payout Gateway Processing', time: '2025-02-15 09:22 AM', done: false }
    ]
  },
  {
    id: 'SO-2025-4105',
    userId: 'U1010',
    userName: 'Aditya Sen',
    userMobile: '+91 98300 44321',
    userEmail: 'aditya.sen@kolkata.org',
    goldQuantity: 5.000,
    purity: '24K',
    sellRate: 7260.00,
    amount: 36300.00,
    payoutCharges: 0.00,
    netPayout: 36300.00,
    bankName: 'Axis Bank',
    bankAccountMasked: 'XXXX XXXX 7712',
    ifsc: 'UTIB0000052',
    payoutMode: 'IMPS',
    utrNumber: 'Failed - Invalid Beneficiary Status',
    status: 'Failed',
    date: '2025-02-14T11:00:00Z',
    timeline: [
      { status: 'Sell Request Initiated', time: '2025-02-14 11:00 AM', done: true },
      { status: 'Bank Rejected Payout (Beneficiary Account Inactive)', time: '2025-02-14 11:05 AM', done: false },
      { status: 'Gold Re-credited to User Vault Wallet', time: '2025-02-14 11:06 AM', done: true }
    ]
  },
  // Adding records 6 to 30
  ...Array.from({ length: 25 }, (_, i) => {
    const user = initialUsers[(i + 7) % initialUsers.length];
    const qty = Number((1.0 + (i * 1.8) % 18).toFixed(3));
    const rate = 7240 + (i * 2.5);
    const amount = Number((qty * rate).toFixed(2));
    const statuses = ['Completed', 'Completed', 'Completed', 'Processing', 'Completed'];
    const ordStatus = statuses[i % statuses.length];
    const day = String(15 - (i % 11)).padStart(2, '0');
    const banks = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India', 'Kotak Mahindra Bank'];
    const chosenBank = banks[i % banks.length];

    return {
      id: `SO-2025-${String(4106 + i)}`,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      userEmail: user.email,
      goldQuantity: qty,
      purity: '24K',
      sellRate: rate,
      amount: amount,
      payoutCharges: 0.00,
      netPayout: amount,
      bankName: chosenBank,
      bankAccountMasked: `XXXX XXXX ${3000 + i * 27}`,
      ifsc: `${chosenBank.slice(0, 4).toUpperCase()}0001200`,
      payoutMode: 'IMPS Instant Payout',
      utrNumber: ordStatus === 'Completed' ? `IMPS${90000 + i * 371}` : 'Pending Gateway',
      status: ordStatus,
      date: `2025-02-${day}T15:10:00Z`,
      timeline: [
        { status: 'Sell Order Placed', time: `2025-02-${day} 03:10 PM`, done: true },
        { status: 'Vault Gold Settlement', time: `2025-02-${day} 03:11 PM`, done: true },
        { status: 'Beneficiary Bank Credit', time: `2025-02-${day} 03:12 PM`, done: ordStatus === 'Completed' }
      ]
    };
  })
];

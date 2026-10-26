// 50 Realistic Transactions for TIA'Z Platform
import { initialUsers } from './users.js';

export const initialTransactions = [
  {
    id: 'TXN-2025-9901',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    userMobile: '+91 98201 44521',
    type: 'Buy',
    direction: 'Credit', // Gold credited to vault
    goldQuantity: 10.000,
    goldRate: 7450.00,
    amount: 76735.00,
    status: 'Success',
    reference: 'BO-2025-8801',
    date: '2025-02-15T08:15:00Z',
    channel: 'App (iOS)',
    remarks: '24K Digital Gold Purchase with 3% GST'
  },
  {
    id: 'TXN-2025-9902',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    userMobile: '+91 98201 44521',
    type: 'Sell',
    direction: 'Debit', // Gold debited
    goldQuantity: 6.000,
    goldRate: 7260.00,
    amount: 43560.00,
    status: 'Success',
    reference: 'SO-2025-4101',
    date: '2025-02-14T16:30:00Z',
    channel: 'App (iOS)',
    remarks: 'Gold liquid payout into HDFC Bank'
  },
  {
    id: 'TXN-2025-9903',
    userId: 'U1002',
    userName: 'Priya Patel',
    userMobile: '+91 98791 22891',
    type: 'Buy',
    direction: 'Credit',
    goldQuantity: 25.000,
    goldRate: 7460.00,
    amount: 192095.00,
    status: 'Success',
    reference: 'BO-2025-8802',
    date: '2025-02-14T14:40:00Z',
    channel: 'App (Android)',
    remarks: 'Netbanking Direct Gold Allocation'
  },
  {
    id: 'TXN-2025-9904',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    userMobile: '+91 97654 33210',
    type: 'Referral Reward',
    direction: 'Credit',
    goldQuantity: 0.100,
    goldRate: 7485.50,
    amount: 748.55,
    status: 'Success',
    reference: 'REF-2025-0103',
    date: '2025-02-14T11:00:00Z',
    channel: 'System Automation',
    remarks: 'Referral bonus from Priyagold signup'
  },
  {
    id: 'TXN-2025-9905',
    userId: 'U1005',
    userName: 'Vikramaditya Singhania',
    userMobile: '+91 98110 99881',
    type: 'Buy',
    direction: 'Credit',
    goldQuantity: 100.000,
    goldRate: 7420.00,
    amount: 764260.00,
    status: 'Success',
    reference: 'BO-2025-8803',
    date: '2025-02-13T11:20:00Z',
    channel: 'Web Admin Desk',
    remarks: 'RTGS High-Value Vault Placement'
  },
  {
    id: 'TXN-2025-9906',
    userId: 'U1004',
    userName: 'Ananya Iyer',
    userMobile: '+91 94441 55672',
    type: 'Transfer',
    direction: 'Debit',
    goldQuantity: 2.000,
    goldRate: 7480.00,
    amount: 14960.00,
    status: 'Success',
    reference: 'GIFT-2025-1082',
    date: '2025-02-13T18:45:00Z',
    channel: 'App (iOS)',
    remarks: 'Gold Gift Sent to +91 98188 77665 (Neha Chawla)'
  },
  {
    id: 'TXN-2025-9907',
    userId: 'U1009',
    userName: 'Neha Chawla',
    userMobile: '+91 98188 77665',
    type: 'Transfer',
    direction: 'Credit',
    goldQuantity: 2.000,
    goldRate: 7480.00,
    amount: 14960.00,
    status: 'Success',
    reference: 'GIFT-2025-1082',
    date: '2025-02-13T18:45:00Z',
    channel: 'App (Android)',
    remarks: 'Gold Gift Received from Ananya Iyer'
  },
  {
    id: 'TXN-2025-9908',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    userMobile: '+91 97654 33210',
    type: 'Buy',
    direction: 'Credit',
    goldQuantity: 2.000,
    goldRate: 7485.50,
    amount: 15440.13,
    status: 'Pending',
    reference: 'BO-2025-8804',
    date: '2025-02-15T09:10:00Z',
    channel: 'App (Android)',
    remarks: 'Pending UPI authorization clearance'
  },
  {
    id: 'TXN-2025-9909',
    userId: 'U1004',
    userName: 'Ananya Iyer',
    userMobile: '+91 94441 55672',
    type: 'Buy',
    direction: 'Credit',
    goldQuantity: 5.000,
    goldRate: 7480.00,
    amount: 38522.00,
    status: 'Failed',
    reference: 'BO-2025-8805',
    date: '2025-02-14T17:05:00Z',
    channel: 'App (iOS)',
    remarks: 'Card 3D Secure session timed out'
  },
  {
    id: 'TXN-2025-9910',
    userId: 'U1007',
    userName: 'Suresh Kumar Menon',
    userMobile: '+91 98470 54321',
    type: 'Sell',
    direction: 'Debit',
    goldQuantity: 10.000,
    goldRate: 7260.00,
    amount: 72600.00,
    status: 'Pending',
    reference: 'SO-2025-4104',
    date: '2025-02-15T09:20:00Z',
    channel: 'Web Portal',
    remarks: 'Payout queue dispatched to SBI IMPS gateway'
  },
  // Adding records 11 to 50
  ...Array.from({ length: 40 }, (_, i) => {
    const user = initialUsers[(i + 8) % initialUsers.length];
    const types = ['Buy', 'Sell', 'Referral Reward', 'Buy', 'Transfer', 'Wallet Credit', 'Wallet Debit'];
    const selectedType = types[i % types.length];
    const isCredit = ['Buy', 'Referral Reward', 'Wallet Credit'].includes(selectedType) || (selectedType === 'Transfer' && i % 2 === 0);
    const qty = Number((0.5 + (i * 1.45) % 15).toFixed(3));
    const rate = selectedType.includes('Sell') ? 7250 : 7480;
    const amount = Number((qty * rate).toFixed(2));
    const statusOptions = ['Success', 'Success', 'Success', 'Success', 'Failed'];
    const st = statusOptions[i % statusOptions.length];
    const day = String(15 - (i % 14)).padStart(2, '0');

    return {
      id: `TXN-2025-${String(9911 + i)}`,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      type: selectedType,
      direction: isCredit ? 'Credit' : 'Debit',
      goldQuantity: qty,
      goldRate: rate,
      amount: amount,
      status: st,
      reference: `REF-2025-${8000 + i}`,
      date: `2025-02-${day}T14:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
      channel: i % 2 === 0 ? 'App (Android)' : 'App (iOS)',
      remarks: `${selectedType} operation for user portfolio`
    };
  })
];

// 20 Mock Referral Records for TIA'Z Platform
import { initialUsers } from './users.js';

export const initialReferrals = [
  {
    id: 'REF-2025-0101',
    referrerId: 'U1001',
    referrerName: 'Aarav Sharma',
    referredUserId: 'U1002',
    referredUserName: 'Priya Patel',
    referralCode: 'AARAV2025',
    status: 'Successful',
    rewardAmount: 500.00,
    rewardGold: 0.067,
    firstPurchaseAmount: 192095.00,
    createdAt: '2025-01-15T14:20:00Z',
    rewardedAt: '2025-01-15T14:45:00Z'
  },
  {
    id: 'REF-2025-0102',
    referrerId: 'U1001',
    referrerName: 'Aarav Sharma',
    referredUserId: 'U1009',
    referredUserName: 'Neha Chawla',
    referralCode: 'AARAV2025',
    status: 'Successful',
    rewardAmount: 250.00,
    rewardGold: 0.033,
    firstPurchaseAmount: 25400.00,
    createdAt: '2025-01-22T15:10:00Z',
    rewardedAt: '2025-01-22T15:30:00Z'
  },
  {
    id: 'REF-2025-0103',
    referrerId: 'U1002',
    referrerName: 'Priya Patel',
    referredUserId: 'U1003',
    referredUserName: 'Rohan Deshmukh',
    referralCode: 'PRIYAGOLD',
    status: 'Successful',
    rewardAmount: 100.00,
    rewardGold: 0.013,
    firstPurchaseAmount: 15440.00,
    createdAt: '2025-02-01T09:15:00Z',
    rewardedAt: '2025-02-01T09:30:00Z'
  },
  {
    id: 'REF-2025-0104',
    referrerId: 'U1003',
    referrerName: 'Rohan Deshmukh',
    referredUserId: 'U1014',
    referredUserName: 'Shreya Kulkarni',
    referralCode: 'ROHANDES',
    status: 'Pending',
    rewardAmount: 100.00,
    rewardGold: 0.013,
    firstPurchaseAmount: 0.00,
    createdAt: '2025-02-14T09:00:00Z',
    rewardedAt: null
  },
  {
    id: 'REF-2025-0105',
    referrerId: 'U1005',
    referrerName: 'Vikramaditya Singhania',
    referredUserId: 'U1006',
    referredUserName: 'Kavita Reddy',
    referralCode: 'VIKRAMGOLD',
    status: 'Pending',
    rewardAmount: 500.00,
    rewardGold: 0.067,
    firstPurchaseAmount: 0.00,
    createdAt: '2025-02-10T16:00:00Z',
    rewardedAt: null
  },
  // Adding records 6 to 20
  ...Array.from({ length: 15 }, (_, i) => {
    const referrer = initialUsers[i % 5];
    const referee = initialUsers[(i + 15) % initialUsers.length];
    const isSuccess = i % 3 !== 0;
    const day = String(10 + (i % 15)).padStart(2, '0');

    return {
      id: `REF-2025-${String(106 + i)}`,
      referrerId: referrer.id,
      referrerName: referrer.name,
      referredUserId: referee.id,
      referredUserName: referee.name,
      referralCode: referrer.referralCode,
      status: isSuccess ? 'Successful' : 'Pending',
      rewardAmount: isSuccess ? 250.00 : 0.00,
      rewardGold: isSuccess ? 0.033 : 0.000,
      firstPurchaseAmount: isSuccess ? 18500.00 : 0.00,
      createdAt: `2025-01-${day}T12:00:00Z`,
      rewardedAt: isSuccess ? `2025-01-${day}T12:30:00Z` : null
    };
  })
];

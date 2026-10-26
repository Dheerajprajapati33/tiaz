// 20 Mock Bank Accounts for TIA'Z Platform with masked account numbers
import { initialUsers } from './users.js';

export const initialBankAccounts = [
  {
    id: 'BA-2025-01',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    userMobile: '+91 98201 44521',
    accountHolderName: 'AARAV SHARMA',
    bankName: 'HDFC Bank',
    accountNumberMasked: 'XXXX XXXX 4521',
    ifsc: 'HDFC0000128',
    branch: 'Andheri West Branch, Mumbai',
    accountType: 'Savings',
    verificationStatus: 'Verified',
    pennyDropStatus: 'Success (₹1 Credited & Matched)',
    isPrimary: true,
    createdAt: '2025-01-12T11:00:00Z'
  },
  {
    id: 'BA-2025-02',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    userMobile: '+91 98201 44521',
    accountHolderName: 'AARAV SHARMA',
    bankName: 'Kotak Mahindra Bank',
    accountNumberMasked: 'XXXX XXXX 7714',
    ifsc: 'KKBK0000412',
    branch: 'Bandra Kurla Complex, Mumbai',
    accountType: 'Savings',
    verificationStatus: 'Verified',
    pennyDropStatus: 'Success',
    isPrimary: false,
    createdAt: '2025-01-20T16:20:00Z'
  },
  {
    id: 'BA-2025-03',
    userId: 'U1002',
    userName: 'Priya Patel',
    userMobile: '+91 98791 22891',
    accountHolderName: 'PRIYA R PATEL',
    bankName: 'ICICI Bank',
    accountNumberMasked: 'XXXX XXXX 8832',
    ifsc: 'ICIC0000451',
    branch: 'Bodakdev Branch, Ahmedabad',
    accountType: 'Savings',
    verificationStatus: 'Verified',
    pennyDropStatus: 'Success',
    isPrimary: true,
    createdAt: '2025-01-15T15:00:00Z'
  },
  {
    id: 'BA-2025-04',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    userMobile: '+91 97654 33210',
    accountHolderName: 'ROHAN S DESHMUKH',
    bankName: 'State Bank of India',
    accountNumberMasked: 'XXXX XXXX 1192',
    ifsc: 'SBIN0000455',
    branch: 'Kothrud Branch, Pune',
    accountType: 'Savings',
    verificationStatus: 'Pending',
    pennyDropStatus: 'Penny Drop in Progress',
    isPrimary: true,
    createdAt: '2025-02-01T10:00:00Z'
  },
  {
    id: 'BA-2025-05',
    userId: 'U1005',
    userName: 'Vikramaditya Singhania',
    userMobile: '+91 98110 99881',
    accountHolderName: 'VIKRAMADITYA SINGHANIA',
    bankName: 'Kotak Mahindra Bank',
    accountNumberMasked: 'XXXX XXXX 9912',
    ifsc: 'KKBK0000214',
    branch: 'Connaught Place, New Delhi',
    accountType: 'Current',
    verificationStatus: 'Verified',
    pennyDropStatus: 'Success',
    isPrimary: true,
    createdAt: '2025-01-05T09:00:00Z'
  },
  {
    id: 'BA-2025-06',
    userId: 'U1008',
    userName: 'Deepak Verma',
    userMobile: '+91 98390 87654',
    accountHolderName: 'DEEPAK VERMA',
    bankName: 'Punjab National Bank',
    accountNumberMasked: 'XXXX XXXX 6621',
    ifsc: 'PUNB0001928',
    branch: 'Civil Lines, Kanpur',
    accountType: 'Savings',
    verificationStatus: 'Failed',
    pennyDropStatus: 'Beneficiary Name Mismatch',
    isPrimary: true,
    createdAt: '2025-02-05T14:00:00Z'
  },
  // Adding records 7 to 20
  ...Array.from({ length: 14 }, (_, i) => {
    const user = initialUsers[(i + 6) % initialUsers.length];
    const banks = ['Axis Bank', 'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'IndusInd Bank', 'Bank of Baroda'];
    const bName = banks[i % banks.length];
    const statuses = ['Verified', 'Verified', 'Verified', 'Pending'];
    const status = statuses[i % statuses.length];

    return {
      id: `BA-2025-${String(7 + i).padStart(2, '0')}`,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      accountHolderName: user.name.toUpperCase(),
      bankName: bName,
      accountNumberMasked: `XXXX XXXX ${4000 + i * 83}`,
      ifsc: `${bName.slice(0, 4).toUpperCase()}0001092`,
      branch: `${user.address.split(',')[1] || 'Main'} Branch`,
      accountType: i % 4 === 0 ? 'Current' : 'Savings',
      verificationStatus: status,
      pennyDropStatus: status === 'Verified' ? 'Success' : 'Pending Penny Drop verification',
      isPrimary: i % 2 === 0,
      createdAt: `2025-01-${String(10 + (i % 15)).padStart(2, '0')}T11:00:00Z`
    };
  })
];

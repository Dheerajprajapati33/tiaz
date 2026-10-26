// 20 Mock Notifications for TIA'Z Platform
export const initialNotifications = [
  {
    id: 'NOTIF-2025-01',
    title: 'Akshaya Tritiya Gold Cashback Fest Announced',
    message: 'Get 2.5% extra 24K gold on purchases above ₹50,000 between March 1st and March 5th.',
    type: 'Gold',
    targetAudience: 'All Users',
    targetUserId: null,
    deliveryChannel: 'Push Notification & In-App',
    status: 'Sent',
    sentCount: 24582,
    openRate: '48.2%',
    sentAt: '2025-02-15T07:00:00Z'
  },
  {
    id: 'NOTIF-2025-02',
    title: 'Complete Your KYC to Unlock Vault Withdrawals',
    message: 'Quickly upload your PAN and verify Aadhaar via DigiLocker in under 2 minutes.',
    type: 'KYC',
    targetAudience: 'KYC Pending Users',
    targetUserId: null,
    deliveryChannel: 'SMS & WhatsApp Reminder',
    status: 'Sent',
    sentCount: 1284,
    openRate: '62.1%',
    sentAt: '2025-02-14T11:00:00Z'
  },
  {
    id: 'NOTIF-2025-03',
    title: 'Instant Gold Sell Payouts via IMPS are Live!',
    message: 'You can now sell digital gold and receive instantaneous bank credits 24x7 within 30 seconds.',
    type: 'Payment',
    targetAudience: 'Verified Users',
    targetUserId: null,
    deliveryChannel: 'Push Notification',
    status: 'Sent',
    sentCount: 21806,
    openRate: '54.0%',
    sentAt: '2025-02-13T10:30:00Z'
  },
  {
    id: 'NOTIF-2025-04',
    title: 'Security Alert: Two-Factor Authentication Recommended',
    message: 'Enable biometrics and SMS OTP for high-value gold transactions above ₹1,00,000.',
    type: 'Security',
    targetAudience: 'All Users',
    targetUserId: null,
    deliveryChannel: 'In-App Banner',
    status: 'Sent',
    sentCount: 24582,
    openRate: '71.5%',
    sentAt: '2025-02-11T09:00:00Z'
  },
  {
    id: 'NOTIF-2025-05',
    title: 'Your Order #BO-2025-8801 Gold is Vaulted',
    message: 'Your 10.000g of 24K gold has been safely insured and vaulted at Brinks Vaults Mumbai.',
    type: 'Transaction',
    targetAudience: 'Specific User',
    targetUserId: 'U1001',
    deliveryChannel: 'Push Notification & Email',
    status: 'Delivered',
    sentCount: 1,
    openRate: '100%',
    sentAt: '2025-02-15T08:16:00Z'
  },
  // Adding records 6 to 20
  ...Array.from({ length: 15 }, (_, i) => {
    const types = ['General', 'Gold', 'Transaction', 'Payment', 'Referral', 'Support', 'Security'];
    const audiences = ['All Users', 'Verified Users', 'KYC Pending Users', 'All Users'];
    const chosenType = types[i % types.length];
    const day = String(15 - (i % 12)).padStart(2, '0');

    return {
      id: `NOTIF-2025-${String(6 + i).padStart(2, '0')}`,
      title: `${chosenType} Update: Market bulletin #${104 + i}`,
      message: `Important announcement regarding ${chosenType.toLowerCase()} operations and platform scheduled maintenance window on Sunday 2 AM.`,
      type: chosenType,
      targetAudience: audiences[i % audiences.length],
      targetUserId: null,
      deliveryChannel: 'Push Notification & In-App',
      status: 'Sent',
      sentCount: 18000 + i * 410,
      openRate: `${45 + (i * 1.7) % 25}%`,
      sentAt: `2025-02-${day}T14:00:00Z`
    };
  })
];

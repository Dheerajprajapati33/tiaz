// 25 Realistic Mock Payments for TIA'Z Platform
import { initialUsers } from './users.js';

export const initialPayments = [
  {
    id: 'PAY-2025-1001',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    userMobile: '+91 98201 44521',
    orderId: 'BO-2025-8801',
    amount: 76735.00,
    method: 'UPI',
    provider: 'Razorpay UPI (Google Pay)',
    gatewayTxnId: 'pay_P09aZ188201',
    status: 'Success',
    paidAt: '2025-02-15T08:15:30Z',
    date: '2025-02-15T08:15:00Z',
    currency: 'INR',
    fee: 0.00
  },
  {
    id: 'PAY-2025-1002',
    userId: 'U1002',
    userName: 'Priya Patel',
    userMobile: '+91 98791 22891',
    orderId: 'BO-2025-8802',
    amount: 192095.00,
    method: 'Netbanking',
    provider: 'Cashfree (HDFC Netbanking)',
    gatewayTxnId: 'cf_nb_881920192',
    status: 'Success',
    paidAt: '2025-02-14T14:41:10Z',
    date: '2025-02-14T14:40:00Z',
    currency: 'INR',
    fee: 0.00
  },
  {
    id: 'PAY-2025-1003',
    userId: 'U1005',
    userName: 'Vikramaditya Singhania',
    userMobile: '+91 98110 99881',
    orderId: 'BO-2025-8803',
    amount: 764260.00,
    method: 'Bank Transfer',
    provider: 'ICICI Corporate Virtual Account',
    gatewayTxnId: 'ICICIR520250213009',
    status: 'Success',
    paidAt: '2025-02-13T11:25:00Z',
    date: '2025-02-13T11:20:00Z',
    currency: 'INR',
    fee: 0.00
  },
  {
    id: 'PAY-2025-1004',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    userMobile: '+91 97654 33210',
    orderId: 'BO-2025-8804',
    amount: 15440.13,
    method: 'UPI',
    provider: 'PayU (PhonePe Intent)',
    gatewayTxnId: 'payu_upi_9921001',
    status: 'Pending',
    paidAt: null,
    date: '2025-02-15T09:10:00Z',
    currency: 'INR',
    fee: 0.00
  },
  {
    id: 'PAY-2025-1005',
    userId: 'U1004',
    userName: 'Ananya Iyer',
    userMobile: '+91 94441 55672',
    orderId: 'BO-2025-8805',
    amount: 38522.00,
    method: 'Card',
    provider: 'Razorpay Cards (SBI Visa Debit)',
    gatewayTxnId: 'pay_Fail_991823',
    status: 'Failed',
    paidAt: null,
    date: '2025-02-14T17:05:00Z',
    currency: 'INR',
    fee: 0.00
  },
  // Adding records 6 to 25
  ...Array.from({ length: 20 }, (_, i) => {
    const user = initialUsers[(i + 9) % initialUsers.length];
    const methods = ['UPI', 'Card', 'Netbanking', 'Bank Transfer', 'UPI'];
    const providers = ['Razorpay UPI', 'Cashfree PG', 'PayU Enterprise', 'PineLabs'];
    const statuses = ['Success', 'Success', 'Success', 'Success', 'Refunded'];
    const method = methods[i % methods.length];
    const provider = providers[i % providers.length];
    const status = statuses[i % statuses.length];
    const amt = Number((12000 + (i * 18500) % 180000).toFixed(2));
    const day = String(15 - (i % 10)).padStart(2, '0');

    return {
      id: `PAY-2025-${String(1006 + i)}`,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      orderId: `BO-2025-${8810 + i}`,
      amount: amt,
      method: method,
      provider: `${provider} (${method})`,
      gatewayTxnId: `gw_${100000 + i * 849}`,
      status: status,
      paidAt: status === 'Success' ? `2025-02-${day}T12:02:15Z` : null,
      date: `2025-02-${day}T12:00:00Z`,
      currency: 'INR',
      fee: 0.00
    };
  })
];

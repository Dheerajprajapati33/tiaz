// 30 Realistic Buy Gold Orders
import { initialUsers } from './users.js';

export const initialBuyOrders = [
  {
    id: 'BO-2025-8801',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    userMobile: '+91 98201 44521',
    userEmail: 'aarav.sharma@gmail.com',
    quantity: 10.000,
    purity: '24K',
    goldRate: 7450.00,
    grossAmount: 74500.00,
    gst: 2235.00, // 3%
    charges: 0.00,
    finalAmount: 76735.00,
    paymentMethod: 'UPI (Google Pay)',
    paymentReference: 'UPI/504512398711',
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    vaultPartner: 'Brinks Vaults (Mumbai Sec-1)',
    certificateNumber: 'MMTC-TIAZ-2025-99812',
    date: '2025-02-15T08:15:00Z',
    timeline: [
      { status: 'Order Placed', time: '2025-02-15 08:15 AM', done: true },
      { status: 'Payment Confirmed', time: '2025-02-15 08:15 AM', done: true },
      { status: 'Gold Allocated in Vault', time: '2025-02-15 08:16 AM', done: true },
      { status: 'Vault Certificate Issued', time: '2025-02-15 08:16 AM', done: true }
    ]
  },
  {
    id: 'BO-2025-8802',
    userId: 'U1002',
    userName: 'Priya Patel',
    userMobile: '+91 98791 22891',
    userEmail: 'priya.patel@outlook.com',
    quantity: 25.000,
    purity: '24K',
    goldRate: 7460.00,
    grossAmount: 186500.00,
    gst: 5595.00,
    charges: 0.00,
    finalAmount: 192095.00,
    paymentMethod: 'Netbanking (HDFC Bank)',
    paymentReference: 'HDFC-TXN-99823101',
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    vaultPartner: 'Brinks Vaults (Mumbai Sec-1)',
    certificateNumber: 'MMTC-TIAZ-2025-99813',
    date: '2025-02-14T14:40:00Z',
    timeline: [
      { status: 'Order Placed', time: '2025-02-14 02:40 PM', done: true },
      { status: 'Payment Confirmed', time: '2025-02-14 02:41 PM', done: true },
      { status: 'Gold Allocated in Vault', time: '2025-02-14 02:42 PM', done: true }
    ]
  },
  {
    id: 'BO-2025-8803',
    userId: 'U1005',
    userName: 'Vikramaditya Singhania',
    userMobile: '+91 98110 99881',
    userEmail: 'vikram.singhania@corp.in',
    quantity: 100.000,
    purity: '24K',
    goldRate: 7420.00,
    grossAmount: 742000.00,
    gst: 22260.00,
    charges: 0.00,
    finalAmount: 764260.00,
    paymentMethod: 'RTGS (ICICI Bank)',
    paymentReference: 'ICICIR520250213009',
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    vaultPartner: 'Sequel Global Vaults (Delhi)',
    certificateNumber: 'MMTC-TIAZ-2025-99801',
    date: '2025-02-13T11:20:00Z',
    timeline: [
      { status: 'Order Placed', time: '2025-02-13 11:20 AM', done: true },
      { status: 'RTGS Cleared', time: '2025-02-13 11:25 AM', done: true },
      { status: 'Custody Vault Receipt Issued', time: '2025-02-13 11:30 AM', done: true }
    ]
  },
  {
    id: 'BO-2025-8804',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    userMobile: '+91 97654 33210',
    userEmail: 'rohan.deshmukh@gmail.com',
    quantity: 2.000,
    purity: '24K',
    goldRate: 7485.50,
    grossAmount: 14971.00,
    gst: 449.13,
    charges: 20.00,
    finalAmount: 15440.13,
    paymentMethod: 'UPI (PhonePe)',
    paymentReference: 'UPI/50459812001',
    paymentStatus: 'Pending',
    orderStatus: 'Processing',
    vaultPartner: 'Brinks Vaults (Mumbai Sec-1)',
    certificateNumber: 'Pending Allocation',
    date: '2025-02-15T09:10:00Z',
    timeline: [
      { status: 'Order Placed', time: '2025-02-15 09:10 AM', done: true },
      { status: 'Waiting Bank Gateway Confirmation', time: '2025-02-15 09:11 AM', done: false }
    ]
  },
  {
    id: 'BO-2025-8805',
    userId: 'U1004',
    userName: 'Ananya Iyer',
    userMobile: '+91 94441 55672',
    userEmail: 'ananya.iyer@yahoo.com',
    quantity: 5.000,
    purity: '24K',
    goldRate: 7480.00,
    grossAmount: 37400.00,
    gst: 1122.00,
    charges: 0.00,
    finalAmount: 38522.00,
    paymentMethod: 'Debit Card (SBI VISA)',
    paymentReference: 'SBI-TXN-110928',
    paymentStatus: 'Failed',
    orderStatus: 'Failed',
    vaultPartner: 'Brinks Vaults (Mumbai Sec-1)',
    certificateNumber: 'N/A',
    date: '2025-02-14T17:05:00Z',
    timeline: [
      { status: 'Order Placed', time: '2025-02-14 05:05 PM', done: true },
      { status: 'Card 3D-Secure Timed Out', time: '2025-02-14 05:07 PM', done: false }
    ]
  },
  // Adding orders 6 to 30
  ...Array.from({ length: 25 }, (_, i) => {
    const user = initialUsers[(i + 5) % initialUsers.length];
    const qty = Number((1.5 + (i * 2.3) % 25).toFixed(3));
    const rate = 7450 + (i * 3.5);
    const gross = Number((qty * rate).toFixed(2));
    const gst = Number((gross * 0.03).toFixed(2));
    const finalAmt = Number((gross + gst).toFixed(2));
    const statuses = ['Completed', 'Completed', 'Completed', 'Processing', 'Completed'];
    const pStatuses = ['Paid', 'Paid', 'Paid', 'Pending', 'Paid'];
    const ordStatus = statuses[i % statuses.length];
    const payStatus = pStatuses[i % pStatuses.length];
    const day = String(15 - (i % 12)).padStart(2, '0');

    return {
      id: `BO-2025-${String(8806 + i)}`,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      userEmail: user.email,
      quantity: qty,
      purity: '24K',
      goldRate: rate,
      grossAmount: gross,
      gst: gst,
      charges: 0.00,
      finalAmount: finalAmt,
      paymentMethod: i % 2 === 0 ? 'UPI (Paytm / BHIM)' : 'Netbanking (Axis Bank)',
      paymentReference: `PAY-REF-${99000 + i * 17}`,
      paymentStatus: payStatus,
      orderStatus: ordStatus,
      vaultPartner: 'Brinks Vaults (Mumbai Sec-1)',
      certificateNumber: ordStatus === 'Completed' ? `MMTC-TIAZ-2025-${80000 + i * 31}` : 'Pending',
      date: `2025-02-${day}T12:30:00Z`,
      timeline: [
        { status: 'Order Created', time: `2025-02-${day} 12:30 PM`, done: true },
        { status: 'Payment Authorized', time: `2025-02-${day} 12:31 PM`, done: payStatus === 'Paid' },
        { status: 'Vault Allocation', time: `2025-02-${day} 12:32 PM`, done: ordStatus === 'Completed' }
      ]
    };
  })
];

// 15 Mock Support Tickets with conversational message history
import { initialUsers } from './users.js';

export const initialSupportTickets = [
  {
    id: 'TCK-2025-501',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    userMobile: '+91 97654 33210',
    userEmail: 'rohan.deshmukh@gmail.com',
    category: 'KYC & Verification',
    subject: 'Address discrepancy query in electricity bill',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'Vikram Mehta (Senior Support)',
    createdAt: '2025-02-14T10:15:00Z',
    updatedAt: '2025-02-14T12:30:00Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        name: 'Rohan Deshmukh',
        time: '2025-02-14 10:15 AM',
        content: 'Hi, I received a notice saying my electricity bill address does not match my Aadhaar address. The Aadhaar has my permanent address in Satara, but I work and rent in Pune.'
      },
      {
        id: 'msg-2',
        sender: 'agent',
        name: 'Vikram Mehta',
        time: '2025-02-14 11:20 AM',
        content: 'Hello Rohan, thank you for reaching out. In that case, please upload your registered rent agreement along with the electricity bill under Address Proof. Our team will verify it manually within 4 hours.'
      },
      {
        id: 'msg-3',
        sender: 'user',
        name: 'Rohan Deshmukh',
        time: '2025-02-14 12:15 PM',
        content: 'Understood, I have uploaded the notarized rent agreement just now. Please review!'
      }
    ]
  },
  {
    id: 'TCK-2025-502',
    userId: 'U1004',
    userName: 'Ananya Iyer',
    userMobile: '+91 94441 55672',
    userEmail: 'ananya.iyer@yahoo.com',
    category: 'Payment & Billing',
    subject: 'Amount debited but order #BO-2025-8805 shows Failed',
    priority: 'Urgent',
    status: 'Open',
    assignedTo: 'Neha Sengupta (Finance Lead)',
    createdAt: '2025-02-14T17:15:00Z',
    updatedAt: '2025-02-14T17:15:00Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        name: 'Ananya Iyer',
        time: '2025-02-14 05:15 PM',
        content: 'My bank debited ₹38,522 via SBI Debit card for buy order #BO-2025-8805, but your app shows status Failed! Please credit the gold or issue immediate refund.'
      }
    ]
  },
  {
    id: 'TCK-2025-503',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    userMobile: '+91 98201 44521',
    userEmail: 'aarav.sharma@gmail.com',
    category: 'Gold Delivery & Vault',
    subject: 'Request physical bullion delivery of 20g 24K bar',
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'Aakash Verma (Vault Custody)',
    createdAt: '2025-02-13T14:00:00Z',
    updatedAt: '2025-02-14T09:30:00Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        name: 'Aarav Sharma',
        time: '2025-02-13 02:00 PM',
        content: 'I would like to convert 20 grams of my vault balance into two 10g tamper-proof Mint bullion coins delivered to my Mumbai address.'
      },
      {
        id: 'msg-2',
        sender: 'agent',
        name: 'Aakash Verma',
        time: '2025-02-13 03:15 PM',
        content: 'Hi Aarav, our vault custodian Brinks is preparing the minted 24K 99.9% purity coins. We will send the secure insured tracking link once dispatched.'
      }
    ]
  },
  {
    id: 'TCK-2025-504',
    userId: 'U1008',
    userName: 'Deepak Verma',
    userMobile: '+91 98390 87654',
    userEmail: 'deepak.verma90@gmail.com',
    category: 'Account & Security',
    subject: 'Account blocked after selfie mismatch',
    priority: 'High',
    status: 'Resolved',
    assignedTo: 'Karan Joshi (Compliance)',
    createdAt: '2025-02-05T15:00:00Z',
    updatedAt: '2025-02-06T11:00:00Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        name: 'Deepak Verma',
        time: '2025-02-05 03:00 PM',
        content: 'Why is my account showing blocked? I only tried to upload my KYC documents.'
      },
      {
        id: 'msg-2',
        sender: 'agent',
        name: 'Karan Joshi',
        time: '2025-02-06 11:00 AM',
        content: 'Deepak, automated security flagged the uploaded selfie as non-matching with government photo records. We have reset your KYC submission status. You may now log in and take a clear, well-lit photo.'
      }
    ]
  },
  {
    id: 'TCK-2025-505',
    userId: 'U1002',
    userName: 'Priya Patel',
    userMobile: '+91 98791 22891',
    userEmail: 'priya.patel@outlook.com',
    category: 'Referrals & Rewards',
    subject: 'Referral reward credit confirmation',
    priority: 'Low',
    status: 'Closed',
    assignedTo: 'Vikram Mehta (Senior Support)',
    createdAt: '2025-02-02T11:30:00Z',
    updatedAt: '2025-02-02T13:00:00Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        name: 'Priya Patel',
        time: '2025-02-02 11:30 AM',
        content: 'Has my referral reward of 0.013g for Rohan Deshmukh been credited?'
      },
      {
        id: 'msg-2',
        sender: 'agent',
        name: 'Vikram Mehta',
        time: '2025-02-02 01:00 PM',
        content: 'Yes Priya! The transaction TXN-2025-9904 has been credited to your digital vault holding. Happy investing!'
      }
    ]
  },
  // Adding records 6 to 15
  ...Array.from({ length: 10 }, (_, i) => {
    const user = initialUsers[(i + 10) % initialUsers.length];
    const categories = ['Gold Rates & Spread', 'Bank Payout', 'App Technical Bug', 'Account & Security'];
    const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const priorities = ['Medium', 'High', 'Urgent', 'Low'];
    const cat = categories[i % categories.length];
    const st = statuses[i % statuses.length];
    const pr = priorities[i % priorities.length];
    const day = String(14 - (i % 10)).padStart(2, '0');

    return {
      id: `TCK-2025-${String(506 + i)}`,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      userEmail: user.email,
      category: cat,
      subject: `Inquiry regarding ${cat.toLowerCase()} for account ${user.id}`,
      priority: pr,
      status: st,
      assignedTo: 'Vikram Mehta (Senior Support)',
      createdAt: `2025-02-${day}T09:30:00Z`,
      updatedAt: `2025-02-${day}T14:20:00Z`,
      messages: [
        {
          id: `msg-${506 + i}-1`,
          sender: 'user',
          name: user.name,
          time: `2025-02-${day} 09:30 AM`,
          content: `Hello support, I have a quick question about ${cat.toLowerCase()} and how limits apply to my account.`
        },
        {
          id: `msg-${506 + i}-2`,
          sender: 'agent',
          name: 'Vikram Mehta',
          time: `2025-02-${day} 10:15 AM`,
          content: `Hello ${user.name}, we are reviewing your account logs and will assist you shortly.`
        }
      ]
    };
  })
];

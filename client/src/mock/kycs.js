// 30 KYC Applications matching user dataset
import { initialUsers } from './users.js';

export const initialKycs = [
  {
    id: 'KYC-2025-001',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    mobile: '+91 97654 33210',
    email: 'rohan.deshmukh@gmail.com',
    pan: 'CRSPD9012E',
    panName: 'ROHAN S DESHMUKH',
    panDob: '1992-06-14',
    aadhaarLast4: '1190',
    aadhaarStatus: 'Pending Verification',
    addressProofType: 'Electricity Bill (MSEDCL)',
    address: '301, Shivneri Residency, Kothrud, Pune, MH - 411038',
    selfieStatus: 'Uploaded',
    submittedDate: '2025-02-14T09:15:00Z',
    status: 'Pending',
    adminNotes: 'Submitted fresh utility bill. Awaiting manual check of address discrepancy with Aadhaar.',
    rejectionReason: '',
    timeline: [
      { step: 'Documents Uploaded', date: '2025-02-14 09:15 AM', status: 'done' },
      { step: 'OCR Text Extracted', date: '2025-02-14 09:16 AM', status: 'done' },
      { step: 'Facial Match (96.4%)', date: '2025-02-14 09:16 AM', status: 'done' },
      { step: 'Admin Review Required', date: '2025-02-14 09:30 AM', status: 'pending' }
    ]
  },
  {
    id: 'KYC-2025-002',
    userId: 'U1006',
    userName: 'Kavita Reddy',
    mobile: '+91 99890 12345',
    email: 'kavita.reddy@gmail.com',
    pan: 'BJKPR1123M',
    panName: 'KAVITA REDDY',
    panDob: '1988-11-20',
    aadhaarLast4: '6632',
    aadhaarStatus: 'OTP Verified',
    addressProofType: 'Aadhaar Card (UIDAI)',
    address: 'Plot 45, Jubilee Hills Road No 36, Hyderabad, TS - 500033',
    selfieStatus: 'Verified (99.1%)',
    submittedDate: '2025-02-12T16:00:00Z',
    status: 'Under Review',
    adminNotes: 'High-value account prospective. Assigned to Senior Compliance Officer.',
    rejectionReason: '',
    timeline: [
      { step: 'Documents Uploaded', date: '2025-02-12 04:00 PM', status: 'done' },
      { step: 'DigiLocker Verification', date: '2025-02-12 04:02 PM', status: 'done' },
      { step: 'Name Match 100%', date: '2025-02-12 04:03 PM', status: 'done' },
      { step: 'Compliance Sign-off', date: '2025-02-13 11:00 AM', status: 'pending' }
    ]
  },
  {
    id: 'KYC-2025-003',
    userId: 'U1012',
    userName: 'Pooja Bhatt',
    mobile: '+91 98250 88211',
    email: 'pooja.bhatt@gmail.com',
    pan: 'BTPPB7721H',
    panName: 'POOJA BHATT',
    panDob: '1995-04-03',
    aadhaarLast4: '2291',
    aadhaarStatus: 'Under Verification',
    addressProofType: 'Bank Statement (HDFC Bank)',
    address: 'B-304, Rajkot Green Meadows, Rajkot, GJ - 360005',
    selfieStatus: 'Uploaded',
    submittedDate: '2025-02-12T11:20:00Z',
    status: 'Under Review',
    adminNotes: 'Bank statement seal is slightly blurry, verifying with netbanking penny drop.',
    rejectionReason: '',
    timeline: [
      { step: 'Application Received', date: '2025-02-12 11:20 AM', status: 'done' },
      { step: 'PAN Verification (NSDL)', date: '2025-02-12 11:22 AM', status: 'done' },
      { step: 'Penny Drop Account Match', date: '2025-02-12 11:45 AM', status: 'done' }
    ]
  },
  {
    id: 'KYC-2025-004',
    userId: 'U1014',
    userName: 'Shreya Kulkarni',
    mobile: '+91 98810 55441',
    email: 'shreya.kulkarni@gmail.com',
    pan: 'BFFPK2211C',
    panName: 'SHREYA KULKARNI',
    panDob: '1997-09-18',
    aadhaarLast4: '7722',
    aadhaarStatus: 'Pending Verification',
    addressProofType: 'Rent Agreement',
    address: 'Rowhouse 11, Model Colony, Pune, MH - 411016',
    selfieStatus: 'Uploaded',
    submittedDate: '2025-02-14T09:00:00Z',
    status: 'Pending',
    adminNotes: 'Registered rent agreement notarized copy uploaded.',
    rejectionReason: '',
    timeline: [
      { step: 'Application Received', date: '2025-02-14 09:00 AM', status: 'done' },
      { step: 'Automated Sanctions Check', date: '2025-02-14 09:05 AM', status: 'done' }
    ]
  },
  {
    id: 'KYC-2025-005',
    userId: 'U1008',
    userName: 'Deepak Verma',
    mobile: '+91 98390 87654',
    email: 'deepak.verma90@gmail.com',
    pan: 'BWKPV9981B',
    panName: 'DEEPAK VERMA',
    panDob: '1990-03-25',
    aadhaarLast4: '4421',
    aadhaarStatus: 'Failed',
    addressProofType: 'Voter ID',
    address: '42/1, Civil Lines, Kanpur, UP - 208001',
    selfieStatus: 'Mismatch (<60%)',
    submittedDate: '2025-02-05T13:40:00Z',
    status: 'Rejected',
    adminNotes: 'Selfie photo did not match PAN/Aadhaar photograph. Suspicious duplicate IP detected.',
    rejectionReason: 'Facial verification failed. Please submit a live selfie under good lighting.',
    timeline: [
      { step: 'Application Received', date: '2025-02-05 01:40 PM', status: 'done' },
      { step: 'Automated Face Match', date: '2025-02-05 01:42 PM', status: 'failed' },
      { step: 'Rejected by Compliance', date: '2025-02-05 02:10 PM', status: 'done' }
    ]
  },
  {
    id: 'KYC-2025-006',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    mobile: '+91 98201 44521',
    email: 'aarav.sharma@gmail.com',
    pan: 'ABCPS1234D',
    panName: 'AARAV SHARMA',
    panDob: '1989-08-12',
    aadhaarLast4: '8921',
    aadhaarStatus: 'Verified via DigiLocker',
    addressProofType: 'Passport',
    address: 'Flat 402, Oberoi Sky Heights, Andheri West, Mumbai, MH - 400053',
    selfieStatus: 'Verified (98.8%)',
    submittedDate: '2025-01-12T10:30:00Z',
    status: 'Verified',
    adminNotes: 'Clean profile, all docs verified against official government registers.',
    rejectionReason: '',
    timeline: [
      { step: 'Application Submitted', date: '2025-01-12 10:30 AM', status: 'done' },
      { step: 'DigiLocker Instant Match', date: '2025-01-12 10:31 AM', status: 'done' },
      { step: 'Approved by Auto-Pass System', date: '2025-01-12 10:32 AM', status: 'done' }
    ]
  },
  {
    id: 'KYC-2025-007',
    userId: 'U1002',
    userName: 'Priya Patel',
    mobile: '+91 98791 22891',
    email: 'priya.patel@outlook.com',
    pan: 'BPMPP4891K',
    panName: 'PRIYA R PATEL',
    panDob: '1991-02-17',
    aadhaarLast4: '3341',
    aadhaarStatus: 'Verified via UIDAI OTP',
    addressProofType: 'Aadhaar Card',
    address: 'B-12, Shivalik Villa, Bodakdev, Ahmedabad, GJ - 380054',
    selfieStatus: 'Verified (99.4%)',
    submittedDate: '2025-01-15T14:20:00Z',
    status: 'Verified',
    adminNotes: 'Verified without exception.',
    rejectionReason: '',
    timeline: [
      { step: 'Application Submitted', date: '2025-01-15 02:20 PM', status: 'done' },
      { step: 'UIDAI OTP Verified', date: '2025-01-15 02:22 PM', status: 'done' },
      { step: 'Approved by Admin #AD-04', date: '2025-01-15 02:35 PM', status: 'done' }
    ]
  },
  {
    id: 'KYC-2025-008',
    userId: 'U1004',
    userName: 'Ananya Iyer',
    mobile: '+91 94441 55672',
    email: 'ananya.iyer@yahoo.com',
    pan: 'AKLPI8821F',
    panName: 'ANANYA IYER',
    panDob: '1994-12-05',
    aadhaarLast4: '5512',
    aadhaarStatus: 'Verified',
    addressProofType: 'Bank Passbook (SBI)',
    address: '14/2, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai, TN - 600041',
    selfieStatus: 'Verified (97.9%)',
    submittedDate: '2025-01-18T11:45:00Z',
    status: 'Verified',
    adminNotes: 'Verified successfully.',
    rejectionReason: '',
    timeline: [
      { step: 'Application Submitted', date: '2025-01-18 11:45 AM', status: 'done' },
      { step: 'Approved', date: '2025-01-18 12:10 PM', status: 'done' }
    ]
  },
  {
    id: 'KYC-2025-009',
    userId: 'U1005',
    userName: 'Vikramaditya Singhania',
    mobile: '+91 98110 99881',
    email: 'vikram.singhania@corp.in',
    pan: 'AVPSS4409A',
    panName: 'VIKRAMADITYA SINGHANIA',
    panDob: '1982-01-30',
    aadhaarLast4: '7700',
    aadhaarStatus: 'Verified',
    addressProofType: 'Passport',
    address: '7, Golf Links, New Delhi, DL - 110003',
    selfieStatus: 'Verified (99.8%)',
    submittedDate: '2025-01-05T08:30:00Z',
    status: 'Verified',
    adminNotes: 'HNI Account. Enhanced Due Diligence (EDD) completed and archived.',
    rejectionReason: '',
    timeline: [
      { step: 'EDD Submitted', date: '2025-01-05 08:30 AM', status: 'done' },
      { step: 'Verified by Senior Compliance Head', date: '2025-01-05 09:10 AM', status: 'done' }
    ]
  },
  {
    id: 'KYC-2025-010',
    userId: 'U1007',
    userName: 'Suresh Kumar Menon',
    mobile: '+91 98470 54321',
    email: 'suresh.menon@kerala.net',
    pan: 'ALRPM7823Z',
    panName: 'SURESH KUMAR MENON',
    panDob: '1976-05-19',
    aadhaarLast4: '9921',
    aadhaarStatus: 'Verified',
    addressProofType: 'Aadhaar Card',
    address: 'G-4, Riverdale Enclave, Panampilly Nagar, Kochi, KL - 682036',
    selfieStatus: 'Verified',
    submittedDate: '2025-01-20T12:00:00Z',
    status: 'Verified',
    adminNotes: 'Clean submission.',
    rejectionReason: '',
    timeline: [
      { step: 'Submitted', date: '2025-01-20 12:00 PM', status: 'done' },
      { step: 'Approved', date: '2025-01-20 12:15 PM', status: 'done' }
    ]
  },
  // Adding records 11 - 30 to hit at least 30 KYC records
  ...Array.from({ length: 20 }, (_, i) => {
    const user = initialUsers[10 + i] || initialUsers[i];
    const statuses = ['Pending', 'Under Review', 'Verified', 'Verified', 'Rejected', 'Verified'];
    const assignedStatus = statuses[i % statuses.length];
    const day = 10 + (i % 18);

    return {
      id: `KYC-2025-${String(11 + i).padStart(3, '0')}`,
      userId: user.id,
      userName: user.name,
      mobile: user.mobile,
      email: user.email,
      pan: user.panNumber || `BXPPS${2000 + i}K`,
      panName: user.name.toUpperCase(),
      panDob: `19${80 + (i % 20)}-0${(i % 9) + 1}-15`,
      aadhaarLast4: String(2000 + i * 37).slice(-4),
      aadhaarStatus: assignedStatus === 'Verified' ? 'Verified' : (assignedStatus === 'Rejected' ? 'Rejected' : 'Pending OTP'),
      addressProofType: i % 2 === 0 ? 'Electricity Bill' : 'Passport',
      address: user.address,
      selfieStatus: assignedStatus === 'Rejected' ? 'Poor Quality' : 'Verified',
      submittedDate: `2025-02-${String(day).padStart(2, '0')}T14:30:00Z`,
      status: assignedStatus,
      adminNotes: assignedStatus === 'Verified' ? 'Approved through automated flow.' : (assignedStatus === 'Rejected' ? 'Document expired or edges truncated.' : 'Awaiting admin queue evaluation.'),
      rejectionReason: assignedStatus === 'Rejected' ? 'Uploaded document copy is illegible or has cut borders.' : '',
      timeline: [
        { step: 'Submission Received', date: `2025-02-${day} 02:30 PM`, status: 'done' },
        { step: 'OCR Extraction', date: `2025-02-${day} 02:32 PM`, status: 'done' },
        { step: assignedStatus === 'Verified' ? 'Approved by System' : (assignedStatus === 'Rejected' ? 'Rejected by Reviewer' : 'In Review Queue'), date: `2025-02-${day} 03:00 PM`, status: assignedStatus === 'Rejected' ? 'failed' : 'done' }
      ]
    };
  })
];

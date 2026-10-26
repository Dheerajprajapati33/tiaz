// 30 Mock Login History records for TIA'Z Platform
import { initialUsers } from './users.js';

export const initialLoginHistory = [
  {
    id: 'LOG-7701',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    loginMethod: 'Biometric',
    device: 'Apple iPhone 15 Pro Max',
    ipAddress: '103.24.88.192',
    location: 'Mumbai, Maharashtra',
    status: 'Success',
    failureReason: '',
    loginDate: '2025-02-15T09:12:00Z'
  },
  {
    id: 'LOG-7702',
    userId: 'U1002',
    userName: 'Priya Patel',
    loginMethod: 'Biometric',
    device: 'Samsung Galaxy S24 Ultra',
    ipAddress: '122.170.112.44',
    location: 'Ahmedabad, Gujarat',
    status: 'Success',
    failureReason: '',
    loginDate: '2025-02-15T08:50:00Z'
  },
  {
    id: 'LOG-7703',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    loginMethod: 'OTP',
    device: 'OnePlus 12 5G',
    ipAddress: '49.36.19.201',
    location: 'Pune, Maharashtra',
    status: 'Success',
    failureReason: '',
    loginDate: '2025-02-15T09:05:00Z'
  },
  {
    id: 'LOG-7704',
    userId: 'U1008',
    userName: 'Deepak Verma',
    loginMethod: 'Password',
    device: 'Xiaomi Redmi Note 13',
    ipAddress: '157.34.82.11',
    location: 'Kanpur, Uttar Pradesh',
    status: 'Failed',
    failureReason: 'Account suspended due to KYC risk block',
    loginDate: '2025-02-14T21:10:00Z'
  },
  {
    id: 'LOG-7705',
    userId: 'U1004',
    userName: 'Ananya Iyer',
    loginMethod: 'PIN',
    device: 'Apple iPhone 14',
    ipAddress: '106.51.78.112',
    location: 'Chennai, Tamil Nadu',
    status: 'Success',
    failureReason: '',
    loginDate: '2025-02-14T18:30:00Z'
  },
  // Adding records 6 to 30
  ...Array.from({ length: 25 }, (_, i) => {
    const user = initialUsers[(i + 3) % initialUsers.length];
    const methods = ['OTP', 'Biometric', 'Password', 'PIN', 'Biometric'];
    const m = methods[i % methods.length];
    const isSuccess = i % 6 !== 0;
    const day = String(15 - (i % 7)).padStart(2, '0');
    const hour = String((i * 3) % 24).padStart(2, '0');
    const minute = String((i * 11) % 60).padStart(2, '0');

    return {
      id: `LOG-${7706 + i}`,
      userId: user.id,
      userName: user.name,
      loginMethod: m,
      device: i % 2 === 0 ? 'Apple iPhone' : 'Samsung Android Phone',
      ipAddress: `117.${50 + i}.${100 + i * 2}.${10 + (i % 90)}`,
      location: user.address.split(',')[1] || 'India',
      status: isSuccess ? 'Success' : 'Failed',
      failureReason: isSuccess ? '' : (m === 'Password' ? 'Invalid password hash' : 'SMS OTP timeout'),
      loginDate: `2025-02-${day}T${hour}:${minute}:00Z`
    };
  })
];

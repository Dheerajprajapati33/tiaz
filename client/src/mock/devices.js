// 20 Mock Registered Devices for TIA'Z Platform Users
import { initialUsers } from './users.js';

export const initialDevices = [
  {
    id: 'DEV-901',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    device: 'Apple iPhone 15 Pro Max',
    platform: 'iOS',
    osVersion: 'iOS 18.2.1',
    appVersion: 'v2.4.1 (Build 412)',
    ipAddress: '103.24.88.192 (Mumbai, MH)',
    lastActive: '2025-02-15T09:12:00Z',
    isTrusted: true
  },
  {
    id: 'DEV-902',
    userId: 'U1001',
    userName: 'Aarav Sharma',
    device: 'Apple MacBook Pro 16" M3',
    platform: 'macOS',
    osVersion: 'macOS Sonoma 14.5',
    appVersion: 'Web Dashboard v1.9.0',
    ipAddress: '103.24.88.192 (Mumbai, MH)',
    lastActive: '2025-02-14T19:40:00Z',
    isTrusted: true
  },
  {
    id: 'DEV-903',
    userId: 'U1002',
    userName: 'Priya Patel',
    device: 'Samsung Galaxy S24 Ultra',
    platform: 'Android',
    osVersion: 'Android 14 (OneUI 6.1)',
    appVersion: 'v2.4.0 (Build 408)',
    ipAddress: '122.170.112.44 (Ahmedabad, GJ)',
    lastActive: '2025-02-15T08:50:00Z',
    isTrusted: true
  },
  {
    id: 'DEV-904',
    userId: 'U1003',
    userName: 'Rohan Deshmukh',
    device: 'OnePlus 12 5G',
    platform: 'Android',
    osVersion: 'OxygenOS 14.0',
    appVersion: 'v2.4.1 (Build 412)',
    ipAddress: '49.36.19.201 (Pune, MH)',
    lastActive: '2025-02-15T09:05:00Z',
    isTrusted: true
  },
  {
    id: 'DEV-905',
    userId: 'U1005',
    userName: 'Vikramaditya Singhania',
    device: 'Apple iPad Pro 12.9 M2',
    platform: 'iPadOS',
    osVersion: 'iPadOS 17.6',
    appVersion: 'v2.4.1 (Build 412)',
    ipAddress: '115.111.45.62 (New Delhi, DL)',
    lastActive: '2025-02-15T07:30:00Z',
    isTrusted: true
  },
  {
    id: 'DEV-906',
    userId: 'U1008',
    userName: 'Deepak Verma',
    device: 'Xiaomi Redmi Note 13',
    platform: 'Android',
    osVersion: 'HyperOS 1.0',
    appVersion: 'v2.3.9 (Build 399)',
    ipAddress: '157.34.82.11 (Kanpur, UP)',
    lastActive: '2025-02-05T13:45:00Z',
    isTrusted: false
  },
  // Adding records 7 to 20
  ...Array.from({ length: 14 }, (_, i) => {
    const user = initialUsers[(i + 4) % initialUsers.length];
    const platforms = [
      { name: 'Apple iPhone 14', os: 'iOS 17.5', plat: 'iOS' },
      { name: 'Google Pixel 8 Pro', os: 'Android 14', plat: 'Android' },
      { name: 'Samsung Galaxy A54', os: 'Android 14', plat: 'Android' },
      { name: 'Vivo V30 Pro', os: 'FuntouchOS 14', plat: 'Android' }
    ];
    const p = platforms[i % platforms.length];
    const day = String(15 - (i % 8)).padStart(2, '0');

    return {
      id: `DEV-${907 + i}`,
      userId: user.id,
      userName: user.name,
      device: p.name,
      platform: p.plat,
      osVersion: p.os,
      appVersion: 'v2.4.1 (Build 412)',
      ipAddress: `103.${40 + i}.${100 + i * 3}.${12 + i}`,
      lastActive: `2025-02-${day}T11:20:00Z`,
      isTrusted: i % 4 !== 0
    };
  })
];

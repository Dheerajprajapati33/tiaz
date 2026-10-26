require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const { hashPassword } = require('../utils/encryption');

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log(`Connected to DB: ${mongoose.connection.name}`);

    const email = 'admin@tiaz.com';
    const mobile = '9820011990';
    const rawPassword = 'Admin@123';
    const hashedPassword = await hashPassword(rawPassword);

    let admin = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (admin) {
      admin.role = 'admin';
      admin.password = hashedPassword;
      admin.isActive = true;
      admin.isBlocked = false;
      admin.fullName = 'Rajesh Varma';
      admin.department = 'Risk & Custody Operations';
      admin.email = email;
      admin.mobile = mobile;
      await admin.save();
      console.log('Existing user updated to Admin successfully!');
    } else {
      admin = await User.create({
        fullName: 'Rajesh Varma',
        email,
        mobile,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isBlocked: false,
        department: 'Risk & Custody Operations',
        kyc: {
          status: 'verified'
        }
      });
      console.log('New Admin account created successfully!');
    }

    console.log('Admin Details:', {
      id: admin._id,
      name: admin.fullName,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();


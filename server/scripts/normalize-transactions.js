const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Transaction = require('../src/models/Transaction');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tiaz_db');
  console.log('Connected to MongoDB');

  const res1 = await Transaction.updateMany(
    { metalType: null, $or: [{ referenceType: 'GoldOrder' }, { goldQuantity: { $gt: 0 } }] },
    { $set: { metalType: 'GOLD', buyType: 'VIRTUAL' } }
  );

  const res2 = await Transaction.updateMany(
    { metalType: null, referenceType: 'Wallet' },
    { $set: { metalType: 'INR', buyType: 'VIRTUAL' } }
  );

  const res3 = await Transaction.updateMany(
    { buyType: null },
    { $set: { buyType: 'VIRTUAL' } }
  );

  console.log('Updated legacy records:', {
    gold: res1.modifiedCount,
    inr: res2.modifiedCount,
    buyType: res3.modifiedCount
  });

  const remainingNull = await Transaction.countDocuments({ metalType: null });
  console.log('Remaining null metalType count:', remainingNull);

  await mongoose.disconnect();
}

run().catch(console.error);

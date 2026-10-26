const mongoose = require('mongoose');
const env = require('../config/env');
const logger = require('../config/logger');

// Import all active models
const User = require('../models/User');
const BankAccount = require('../models/BankAccount');
const Device = require('../models/Device');
const FAQ = require('../models/FAQ');
const GoldOrder = require('../models/GoldOrder');
const GoldWallet = require('../models/GoldWallet');
const LoginHistory = require('../models/LoginHistory');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Referral = require('../models/Referral');
const SupportMessage = require('../models/SupportMessage');
const SupportTicket = require('../models/SupportTicket');
const Transaction = require('../models/Transaction');
const SilverOrder = require('../models/SilverOrder');
const SilverWallet = require('../models/SilverWallet');

const activeModels = [
  User,
  BankAccount,
  Device,
  FAQ,
  GoldOrder,
  GoldWallet,
  SilverOrder,
  SilverWallet,
  LoginHistory,
  Notification,
  Payment,
  Referral,
  SupportMessage,
  SupportTicket,
  Transaction
];

const resyncDatabase = async () => {
  try {
    logger.info(`Connecting to MongoDB at ${env.MONGO_URI}...`);
    await mongoose.connect(env.MONGO_URI);
    logger.success('Connected to MongoDB.');

    const db = mongoose.connection.db;
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(c => c.name);

    // Active collection names derived from Mongoose models
    const activeCollectionNames = activeModels.map(m => m.collection.collectionName);

    logger.info(`Found ${existingCollectionNames.length} collections in database.`);
    logger.info(`Active target collections: ${activeCollectionNames.join(', ')}`);

    // 1. Drop collections that are no longer needed (like 'otps', 'kycs', etc.)
    for (const colName of existingCollectionNames) {
      if (!activeCollectionNames.includes(colName) && !colName.startsWith('system.')) {
        logger.warn(`Dropping obsolete collection: "${colName}"...`);
        await db.collection(colName).drop();
        logger.success(`Dropped obsolete collection: "${colName}".`);
      }
    }

    // 2. Re-sync indexes for each active model
    logger.info('Synchronizing indexes for active models...');
    for (const model of activeModels) {
      try {
        await model.createCollection();
        await model.syncIndexes();
        logger.success(`Synced indexes for model: ${model.modelName} (Collection: ${model.collection.collectionName})`);
      } catch (idxErr) {
        logger.error(`Error syncing index for ${model.modelName}:`, idxErr.message);
      }
    }

    logger.success('✨ All active collections and indexes have been successfully re-synchronized!');
    process.exit(0);
  } catch (error) {
    logger.error('Database resync failed:', error);
    process.exit(1);
  }
};

resyncDatabase();

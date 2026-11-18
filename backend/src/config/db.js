const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cricket_auction_pro';
  
  try {
    console.log(`[DB] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('[DB] MongoDB connected successfully to provided URI');
  } catch (err) {
    console.warn('[DB] Could not connect to local/specified MongoDB server:', err.message);
    console.log('[DB] Spinning up embedded MongoDB in-memory server for zero-config local operation...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Connected successfully to embedded MongoDB instance at: ${memoryUri}`);
    } catch (memErr) {
      console.error('[DB] Failed to initialize embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };

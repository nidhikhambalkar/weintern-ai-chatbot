// ============================================================================== 
// FILE: db.js
// PURPOSE: Connects the backend to MongoDB and keeps the in-memory fallback.
// ==============================================================================

const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weintern_chatbot';

let isDbConnected = false;
let lastDbError = null;

const inMemoryDb = {
  sessions: [],
  messages: [],
  leads: [],
  escalations: [],
  autoId: {
    sessions: 1,
    messages: 1,
    leads: 1,
    escalations: 1,
  },
};

const initDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      isDbConnected = true;
      lastDbError = null;
      return;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isDbConnected = true;
    lastDbError = null;
    console.log('✅ [Database] MongoDB connected successfully.');
  } catch (error) {
    isDbConnected = false;
    lastDbError = error.message;
    console.warn('⚠️ [Database] Could not connect to MongoDB:', error.message);
    console.warn('ℹ️ [Fallback] Running in-memory mode for easy testing without MongoDB setup.');
  }
};

const getCollection = (name) => {
  if (!mongoose.connection.db) {
    return null;
  }
  return mongoose.connection.db.collection(name);
};

const query = async (collectionName, action, params = []) => {
  if (!isDbConnected) {
    await initDatabase();
  }

  if (!isDbConnected || !mongoose.connection.db) {
    throw new Error('MongoDB not connected');
  }

  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error(`Collection ${collectionName} not available`);
  }

  switch (action) {
    case 'find':
      return collection.find(...params).toArray();
    case 'findOne':
      return collection.findOne(...params);
    case 'insertOne':
      return collection.insertOne(...params);
    case 'insertMany':
      return collection.insertMany(...params);
    case 'updateOne':
      return collection.updateOne(...params);
    case 'updateMany':
      return collection.updateMany(...params);
    case 'deleteMany':
      return collection.deleteMany(...params);
    case 'countDocuments':
      return collection.countDocuments(...params);
    case 'aggregate':
      return collection.aggregate(...params).toArray();
    default:
      throw new Error(`Unsupported Mongo action: ${action}`);
  }
};

module.exports = {
  mongoose,
  getCollection,
  query,
  initDatabase,
  getIsDbConnected: () => isDbConnected,
  getIsMongoConnected: () => isDbConnected,
  getIsPgConnected: () => isDbConnected, // backwards-compatible alias
  getLastDbError: () => lastDbError,
  getLastPgError: () => lastDbError, // backwards-compatible alias
  inMemoryDb,
};

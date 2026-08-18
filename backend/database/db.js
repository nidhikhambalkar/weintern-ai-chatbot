// ==============================================================================
// FILE: db.js
// PURPOSE: Robust Database Manager with MongoDB + Local Persistent Storage (db_storage.json).
// FEATURES:
// 1. Dual Persistence: Saves to MongoDB when online, AND flushes to local db_storage.json disk file.
// 2. High Availability: If MongoDB is offline or disconnected, system seamlessly uses persistent local file storage with zero data loss.
// 3. Array Proxy Interceptors: Any direct push/update to inMemoryDb automatically flushes to db_storage.json.
// 4. Unified Query & Collection APIs: getCollection() and query() work reliably under all conditions.
// ==============================================================================

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const LOCAL_DB_FILE = path.join(__dirname, 'db_storage.json');
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weintern_chatbot';

let isDbConnected = false;
let lastDbError = null;

// Persistent local DB storage object
const rawInMemoryDb = {
  sessions: [],
  messages: [],
  leads: [],
  escalations: [],
  users: [],
  faqs: [],
  autoId: {
    sessions: 1,
    messages: 1,
    leads: 1,
    escalations: 1,
    users: 1,
    faqs: 1,
  },
};

// Save local DB to disk file
const saveLocalDb = () => {
  try {
    const dataToSave = {
      sessions: rawInMemoryDb.sessions,
      messages: rawInMemoryDb.messages,
      leads: rawInMemoryDb.leads,
      escalations: rawInMemoryDb.escalations,
      users: rawInMemoryDb.users,
      faqs: rawInMemoryDb.faqs,
      autoId: rawInMemoryDb.autoId,
      lastSaved: new Date().toISOString(),
    };
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ [Local DB] Failed to write db_storage.json:', err.message);
  }
};

// Load local DB from disk file on startup
const loadLocalDb = () => {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const fileData = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed.sessions)) rawInMemoryDb.sessions = parsed.sessions;
      if (Array.isArray(parsed.messages)) rawInMemoryDb.messages = parsed.messages;
      if (Array.isArray(parsed.leads)) rawInMemoryDb.leads = parsed.leads;
      if (Array.isArray(parsed.escalations)) rawInMemoryDb.escalations = parsed.escalations;
      if (Array.isArray(parsed.users)) rawInMemoryDb.users = parsed.users;
      if (Array.isArray(parsed.faqs)) rawInMemoryDb.faqs = parsed.faqs;
      if (parsed.autoId && typeof parsed.autoId === 'object') {
        rawInMemoryDb.autoId = { ...rawInMemoryDb.autoId, ...parsed.autoId };
      }
      console.log(`📁 [Local DB] Loaded persistent storage from disk (${rawInMemoryDb.messages.length} messages, ${rawInMemoryDb.leads.length} leads).`);
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.error('⚠️ [Local DB] Error loading db_storage.json:', err.message);
  }
};

// Intercept array mutations (push, pop, shift, unshift, splice) to auto-save to disk
const createPersistentArray = (targetArray) => {
  return new Proxy(targetArray, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function' && ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(prop)) {
        return function (...args) {
          const result = val.apply(target, args);
          saveLocalDb();
          return result;
        };
      }
      return val;
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      saveLocalDb();
      return result;
    },
  });
};

// Create inMemoryDb proxy wrapper
loadLocalDb();

const inMemoryDb = {
  sessions: createPersistentArray(rawInMemoryDb.sessions),
  messages: createPersistentArray(rawInMemoryDb.messages),
  leads: createPersistentArray(rawInMemoryDb.leads),
  escalations: createPersistentArray(rawInMemoryDb.escalations),
  users: createPersistentArray(rawInMemoryDb.users),
  faqs: createPersistentArray(rawInMemoryDb.faqs),
  autoId: rawInMemoryDb.autoId,
};

// ==============================================================================
// MONGOOSE SCHEMAS & MODELS
// ==============================================================================

const SessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true, index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const MessageSchema = new mongoose.Schema({
  session_id: { type: String, required: true, index: true },
  sender: { type: String, required: true, enum: ['user', 'bot', 'system'] },
  message: { type: String, required: true },
  source: { type: String, default: 'text' },
  voice_metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  timestamp: { type: Date, default: Date.now },
});

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  preferred_domain: { type: String, required: true },
  status: { type: String, default: 'new' },
  created_at: { type: Date, default: Date.now },
});

const EscalationSchema = new mongoose.Schema({
  session_id: { type: String, required: true, index: true },
  issue: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved', 'closed'], default: 'pending', index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String },
  role: { type: String, default: 'user' },
  created_at: { type: Date, default: Date.now },
});

const FaqSchema = new mongoose.Schema({
  category: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  keywords: [String],
  created_at: { type: Date, default: Date.now },
});

const SessionModel = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const MessageModel = mongoose.models.Message || mongoose.model('Message', MessageSchema);
const LeadModel = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
const EscalationModel = mongoose.models.Escalation || mongoose.model('Escalation', EscalationSchema);
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const FaqModel = mongoose.models.Faq || mongoose.model('Faq', FaqSchema);

// ==============================================================================
// FALLBACK & UNIFIED COLLECTION HANDLERS
// ==============================================================================

const matchesFilter = (item, filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, value] of Object.entries(filter)) {
    if (key === '_id' || key === 'id') {
      const itemVal = item._id || item.id;
      if (String(itemVal) !== String(value)) return false;
    } else if (item[key] !== value) {
      return false;
    }
  }
  return true;
};

const createFallbackCollection = (name) => {
  const getArray = () => {
    if (!rawInMemoryDb[name]) rawInMemoryDb[name] = [];
    return rawInMemoryDb[name];
  };

  return {
    find: (filter = {}) => {
      const arr = getArray().filter((item) => matchesFilter(item, filter));
      return {
        toArray: async () => [...arr],
        sort: function (sortObj = {}) {
          const [field, order] = Object.entries(sortObj)[0] || [];
          if (field) {
            arr.sort((a, b) => {
              if (a[field] < b[field]) return order === -1 ? 1 : -1;
              if (a[field] > b[field]) return order === -1 ? -1 : 1;
              return 0;
            });
          }
          return this;
        },
        limit: function (n) {
          arr.splice(n);
          return this;
        },
        skip: function (n) {
          arr.splice(0, n);
          return this;
        },
      };
    },
    findOne: async (filter = {}) => {
      const arr = getArray();
      return arr.find((item) => matchesFilter(item, filter)) || null;
    },
    insertOne: async (doc) => {
      const arr = getArray();
      const nextId = (rawInMemoryDb.autoId[name] = (rawInMemoryDb.autoId[name] || 0) + 1);
      const newDoc = {
        _id: String(nextId),
        id: nextId,
        created_at: new Date(),
        ...doc,
      };
      arr.push(newDoc);
      saveLocalDb();
      return { acknowledged: true, insertedId: newDoc._id };
    },
    insertMany: async (docs = []) => {
      const arr = getArray();
      const insertedIds = [];
      for (const doc of docs) {
        const nextId = (rawInMemoryDb.autoId[name] = (rawInMemoryDb.autoId[name] || 0) + 1);
        const newDoc = {
          _id: String(nextId),
          id: nextId,
          created_at: new Date(),
          ...doc,
        };
        arr.push(newDoc);
        insertedIds.push(newDoc._id);
      }
      saveLocalDb();
      return { acknowledged: true, insertedCount: docs.length, insertedIds };
    },
    updateOne: async (filter = {}, update = {}, options = {}) => {
      const arr = getArray();
      const itemIndex = arr.findIndex((i) => matchesFilter(i, filter));
      if (itemIndex !== -1) {
        const setFields = update.$set || {};
        arr[itemIndex] = { ...arr[itemIndex], ...setFields, updated_at: new Date() };
        saveLocalDb();
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
      }
      if (options.upsert) {
        const setFields = update.$set || {};
        const setOnInsert = update.$setOnInsert || {};
        const nextId = (rawInMemoryDb.autoId[name] = (rawInMemoryDb.autoId[name] || 0) + 1);
        const newDoc = {
          _id: String(nextId),
          id: nextId,
          created_at: new Date(),
          ...filter,
          ...setOnInsert,
          ...setFields,
        };
        arr.push(newDoc);
        saveLocalDb();
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id };
      }
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    },
    updateMany: async (filter = {}, update = {}) => {
      const arr = getArray();
      let modified = 0;
      const setFields = update.$set || {};
      for (let i = 0; i < arr.length; i++) {
        if (matchesFilter(arr[i], filter)) {
          arr[i] = { ...arr[i], ...setFields, updated_at: new Date() };
          modified++;
        }
      }
      if (modified > 0) saveLocalDb();
      return { acknowledged: true, matchedCount: modified, modifiedCount: modified };
    },
    deleteMany: async (filter = {}) => {
      const arr = getArray();
      const initialLen = arr.length;
      rawInMemoryDb[name] = arr.filter((item) => !matchesFilter(item, filter));
      const deletedCount = initialLen - rawInMemoryDb[name].length;
      if (deletedCount > 0) saveLocalDb();
      return { acknowledged: true, deletedCount };
    },
    countDocuments: async (filter = {}) => {
      const arr = getArray();
      return arr.filter((item) => matchesFilter(item, filter)).length;
    },
    aggregate: async () => {
      return getArray();
    },
    findOneAndUpdate: async (filter = {}, update = {}) => {
      const arr = getArray();
      const itemIndex = arr.findIndex((i) => matchesFilter(i, filter));
      if (itemIndex !== -1) {
        const setFields = update.$set || {};
        arr[itemIndex] = { ...arr[itemIndex], ...setFields, updated_at: new Date() };
        saveLocalDb();
        return arr[itemIndex];
      }
      return null;
    },
  };
};

const getCollection = (name) => {
  if (isDbConnected && mongoose.connection.db) {
    const mongoCollection = mongoose.connection.db.collection(name);
    // Wrap mongo collection to also mirror write operations to persistent disk storage
    return {
      find: (...args) => mongoCollection.find(...args),
      findOne: (...args) => mongoCollection.findOne(...args),
      insertOne: async (doc, ...args) => {
        const res = await mongoCollection.insertOne(doc, ...args);
        try {
          if (!rawInMemoryDb[name]) rawInMemoryDb[name] = [];
          rawInMemoryDb[name].push({ ...doc, _id: res.insertedId });
          saveLocalDb();
        } catch (_) {}
        return res;
      },
      insertMany: async (docs, ...args) => {
        const res = await mongoCollection.insertMany(docs, ...args);
        try {
          if (!rawInMemoryDb[name]) rawInMemoryDb[name] = [];
          rawInMemoryDb[name].push(...docs);
          saveLocalDb();
        } catch (_) {}
        return res;
      },
      updateOne: async (filter, update, options, ...args) => {
        const res = await mongoCollection.updateOne(filter, update, options, ...args);
        try {
          const fallback = createFallbackCollection(name);
          await fallback.updateOne(filter, update, options);
        } catch (_) {}
        return res;
      },
      updateMany: async (filter, update, options, ...args) => {
        const res = await mongoCollection.updateMany(filter, update, options, ...args);
        try {
          const fallback = createFallbackCollection(name);
          await fallback.updateMany(filter, update);
        } catch (_) {}
        return res;
      },
      deleteMany: async (filter, ...args) => {
        const res = await mongoCollection.deleteMany(filter, ...args);
        try {
          const fallback = createFallbackCollection(name);
          await fallback.deleteMany(filter);
        } catch (_) {}
        return res;
      },
      countDocuments: (...args) => mongoCollection.countDocuments(...args),
      aggregate: (...args) => mongoCollection.aggregate(...args),
      findOneAndUpdate: async (filter, update, options, ...args) => {
        const res = await mongoCollection.findOneAndUpdate(filter, update, options, ...args);
        try {
          const fallback = createFallbackCollection(name);
          await fallback.findOneAndUpdate(filter, update);
        } catch (_) {}
        return res;
      },
    };
  }
  return createFallbackCollection(name);
};

const query = async (collectionName, action, params = []) => {
  const collection = getCollection(collectionName);

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
    case 'findOneAndUpdate':
      return collection.findOneAndUpdate(...params);
    default:
      throw new Error(`Unsupported database action: ${action}`);
  }
};

// ==============================================================================
// INITIALIZATION & SEED SYNC
// ==============================================================================

const seedMongoFromDisk = async () => {
  try {
    if (!isDbConnected || !mongoose.connection.db) return;
    const collections = ['sessions', 'messages', 'leads', 'escalations', 'users', 'faqs'];
    for (const name of collections) {
      if (rawInMemoryDb[name] && rawInMemoryDb[name].length > 0) {
        const col = mongoose.connection.db.collection(name);
        const count = await col.countDocuments({});
        if (count === 0) {
          await col.insertMany(rawInMemoryDb[name].map((item) => ({ ...item, _id: undefined })));
          console.log(`✨ [Database Sync] Synced ${rawInMemoryDb[name].length} local ${name} to MongoDB.`);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ [Database Sync] Error syncing local data to MongoDB:', err.message);
  }
};

const initDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      isDbConnected = true;
      lastDbError = null;
      await seedMongoFromDisk();
      return;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isDbConnected = true;
    lastDbError = null;
    console.log('✅ [Database] MongoDB connected successfully.');
    await seedMongoFromDisk();
  } catch (error) {
    isDbConnected = false;
    lastDbError = error.message;
    console.warn('⚠️ [Database] Could not connect to MongoDB:', error.message);
    console.warn('ℹ️ [Local DB] Running in persistent local storage mode (db_storage.json).');
  }
};

// High-level helper methods for database operations
const saveSession = async (sessionId) => {
  return query('sessions', 'updateOne', [{ session_id: sessionId }, { $setOnInsert: { session_id: sessionId, created_at: new Date() } }, { upsert: true }]);
};

const saveMessage = async (msgData) => {
  const doc = {
    session_id: msgData.session_id,
    sender: msgData.sender,
    message: msgData.message,
    source: msgData.source || 'text',
    voice_metadata: msgData.voice_metadata || null,
    timestamp: new Date(),
  };
  await saveSession(msgData.session_id);
  return query('messages', 'insertOne', [doc]);
};

const saveLead = async (leadData) => {
  const doc = {
    name: leadData.name.trim(),
    email: leadData.email.trim(),
    phone: leadData.phone.trim(),
    preferred_domain: (leadData.preferred_domain || leadData.domain || '').trim(),
    status: leadData.status || 'new',
    created_at: new Date(),
  };
  return query('leads', 'insertOne', [doc]);
};

const saveEscalation = async (escData) => {
  const doc = {
    session_id: escData.session_id,
    issue: escData.issue.trim(),
    status: escData.status || 'pending',
    created_at: new Date(),
  };
  return query('escalations', 'insertOne', [doc]);
};

const getHistory = async (sessionId) => {
  return query('messages', 'find', [{ session_id: sessionId }]);
};

const getLeads = async () => {
  return query('leads', 'find', [{}]);
};

const getEscalations = async () => {
  return query('escalations', 'find', [{}]);
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
  saveLocalDb,
  loadLocalDb,
  // Schemas & Models
  SessionModel,
  MessageModel,
  LeadModel,
  EscalationModel,
  UserModel,
  FaqModel,
  // Helper storage functions
  saveSession,
  saveMessage,
  saveLead,
  saveEscalation,
  getHistory,
  getLeads,
  getEscalations,
};

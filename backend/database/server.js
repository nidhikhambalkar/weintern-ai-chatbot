// ==============================================================================
// FILE: server.js
// PURPOSE: Main Express Web Server and API Endpoint Handler (MongoDB version).
// WHY WE CREATED THIS FILE:
// 1. Receives requests from the Next.js frontend (e.g. chat messages, lead forms).
// 2. Contains all backend routes cleanly organized in one file so beginners can follow along easily.
// 3. Connects to database (db.js) using MongoDB to store and retrieve data.
// ==============================================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ObjectId } = require('mongodb');
const { initDatabase, getIsDbConnected, getCollection, inMemoryDb } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ==============================================================================
// SECTION 1: HEALTH CHECK ENDPOINT
// ==============================================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'WeIntern AI Chatbot Database Server',
    db_status: getIsDbConnected() ? 'MongoDB' : 'In-Memory Fallback',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).send('WeIntern Database Backend is running. Use /health for status.');
});

// ==============================================================================
// SECTION 2: LEAD MANAGEMENT ENDPOINTS (PRD Section 13 & 15)
// ==============================================================================

// ENDPOINT 1: POST /api/leads -> Save a new student lead
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, preferred_domain, domain } = req.body;
    const targetDomain = (preferred_domain || domain || '').trim();

    if (!name || !email || !phone || !targetDomain) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all fields: name, email, phone, and preferred_domain.'
      });
    }

    const newLead = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      preferred_domain: targetDomain,
      created_at: new Date()
    };

    if (getIsDbConnected()) {
      const collection = getCollection('leads');
      const result = await collection.insertOne(newLead);
      return res.status(201).json({
        success: true,
        message: 'Lead captured successfully in MongoDB!',
        data: { ...newLead, _id: result.insertedId }
      });
    }

    newLead.id = inMemoryDb.autoId.leads++;
    inMemoryDb.leads.push(newLead);

    return res.status(201).json({
      success: true,
      message: 'Lead captured successfully!',
      data: newLead
    });

  } catch (error) {
    console.error('Error saving lead:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to save lead.' });
  }
});

// ENDPOINT 2: GET /api/leads & GET /api/admin/leads -> Retrieve all captured leads
app.get(['/api/leads', '/api/admin/leads'], async (req, res) => {
  try {
    if (getIsDbConnected()) {
      const collection = getCollection('leads');
      const result = await collection.find({}).sort({ created_at: -1 }).toArray();
      return res.status(200).json({
        success: true,
        count: result.length,
        data: result
      });
    }

    return res.status(200).json({
      success: true,
      count: inMemoryDb.leads.length,
      data: [...inMemoryDb.leads].reverse()
    });
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch leads.' });
  }
});

// ==============================================================================
// SECTION 3: CONVERSATION HISTORY ENDPOINTS (PRD Section 13 & 15)
// ==============================================================================

// ENDPOINT 3: GET /api/history -> Get chat history for a session_id
app.get('/api/history', async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: session_id'
      });
    }

    if (getIsDbConnected()) {
      const collection = getCollection('messages');
      const result = await collection.find({ session_id: sessionId }).sort({ timestamp: 1 }).toArray();
      return res.status(200).json({
        success: true,
        session_id: sessionId,
        count: result.length,
        data: result
      });
    }

    const filteredMessages = inMemoryDb.messages.filter(m => m.session_id === sessionId);
    return res.status(200).json({
      success: true,
      session_id: sessionId,
      count: filteredMessages.length,
      data: filteredMessages
    });

  } catch (error) {
    console.error('Error fetching history:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch chat history.' });
  }
});

// ENDPOINT 4: POST /api/history -> Save a single chat message (user or bot)
app.post('/api/history', async (req, res) => {
  try {
    const { session_id, sender, message } = req.body;

    if (!session_id || !sender || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide session_id, sender, and message.'
      });
    }

    if (getIsDbConnected()) {
      const sessionCollection = getCollection('sessions');
      const messageCollection = getCollection('messages');

      if (sessionCollection) {
        await sessionCollection.updateOne(
          { session_id },
          { $setOnInsert: { session_id, created_at: new Date() } },
          { upsert: true }
        );
      }

      const doc = {
        session_id,
        sender,
        message,
        timestamp: new Date()
      };
      const result = await messageCollection.insertOne(doc);

      return res.status(201).json({
        success: true,
        data: { ...doc, _id: result.insertedId }
      });
    }

    const newMsg = {
      id: inMemoryDb.autoId.messages++,
      session_id,
      sender,
      message,
      timestamp: new Date().toISOString()
    };
    inMemoryDb.messages.push(newMsg);

    return res.status(201).json({
      success: true,
      data: newMsg
    });

  } catch (error) {
    console.error('Error saving message:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to save message.' });
  }
});

// ==============================================================================
// SECTION 4: HUMAN ESCALATION ENDPOINTS (PRD Section 13 & 15)
// ==============================================================================

// ENDPOINT 5: POST /api/escalate & POST /api/escalations -> Create support escalation ticket
app.post(['/api/escalate', '/api/escalations'], async (req, res) => {
  try {
    const { session_id, issue } = req.body;

    if (!session_id || !issue) {
      return res.status(400).json({
        success: false,
        error: 'Please provide session_id and issue description.'
      });
    }

    const doc = {
      session_id,
      issue: issue.trim(),
      status: 'pending',
      created_at: new Date()
    };

    if (getIsDbConnected()) {
      const collection = getCollection('escalations');
      const result = await collection.insertOne(doc);
      return res.status(201).json({
        success: true,
        message: 'Escalation ticket created successfully!',
        data: { ...doc, _id: result.insertedId }
      });
    }

    const newEscalation = {
      id: inMemoryDb.autoId.escalations++,
      ...doc
    };
    inMemoryDb.escalations.push(newEscalation);

    return res.status(201).json({
      success: true,
      message: 'Escalation ticket created successfully!',
      data: newEscalation
    });

  } catch (error) {
    console.error('Error creating escalation:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to create escalation ticket.' });
  }
});

// ENDPOINT 6: GET /api/escalations & GET /api/admin/escalations -> View support escalation tickets
app.get(['/api/escalations', '/api/admin/escalations'], async (req, res) => {
  try {
    if (getIsDbConnected()) {
      const collection = getCollection('escalations');
      const result = await collection.find({}).sort({ created_at: -1 }).toArray();
      return res.status(200).json({
        success: true,
        count: result.length,
        data: result
      });
    }

    return res.status(200).json({
      success: true,
      count: inMemoryDb.escalations.length,
      data: [...inMemoryDb.escalations].reverse()
    });
  } catch (error) {
    console.error('Error fetching escalations:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch escalations.' });
  }
});

// ENDPOINT 7: PATCH /api/escalations/:id & PATCH /api/admin/escalations/:id -> Update escalation status
app.patch(['/api/escalations/:id', '/api/admin/escalations/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'in_progress', 'resolved', 'closed'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${allowed.join(', ')}`
      });
    }

    if (getIsDbConnected()) {
      const collection = getCollection('escalations');
      let filter = {};
      try {
        filter = { _id: new ObjectId(id) };
      } catch (err) {
        filter = { id: Number(id) };
      }

      const result = await collection.findOneAndUpdate(
        filter,
        { $set: { status } },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ success: false, error: 'Ticket not found.' });
      }
      return res.status(200).json({ success: true, data: result });
    }

    const ticket = inMemoryDb.escalations.find(e => e.id === Number(id));
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }
    ticket.status = status;
    return res.status(200).json({ success: true, data: ticket });

  } catch (error) {
    console.error('Error updating escalation:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to update ticket.' });
  }
});

// ENDPOINT 8: GET /api/summary & GET /api/admin/summary -> Overview statistics
app.get(['/api/summary', '/api/admin/summary'], async (req, res) => {
  try {
    let leadsCount = 0;
    let escalationsCount = 0;
    let pendingCount = 0;

    if (getIsDbConnected()) {
      const leadsCollection = getCollection('leads');
      const escalationsCollection = getCollection('escalations');

      if (leadsCollection) {
        leadsCount = await leadsCollection.countDocuments({});
      }
      if (escalationsCollection) {
        escalationsCount = await escalationsCollection.countDocuments({});
        pendingCount = await escalationsCollection.countDocuments({ status: 'pending' });
      }
    } else {
      leadsCount = inMemoryDb.leads.length;
      escalationsCount = inMemoryDb.escalations.length;
      pendingCount = inMemoryDb.escalations.filter(e => e.status === 'pending').length;
    }

    return res.status(200).json({
      success: true,
      summary: {
        total_leads: leadsCount,
        total_escalations: escalationsCount,
        pending_escalations: pendingCount,
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch summary.' });
  }
});

// ==============================================================================
// SECTION 5: START SERVER FUNCTION
// ==============================================================================
const start = async () => {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 [Server] WeIntern Database Backend live on port ${PORT}`);
    console.log(`📡 [Health Check] http://localhost:${PORT}/health`);
    console.log(`====================================================`);
  });
};

start();

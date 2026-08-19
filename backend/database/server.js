// ==============================================================================
// FILE: server.js
// PURPOSE: Express Web Server for WeIntern Chatbot Database APIs.
// FEATURES:
// 1. Non-blocking Server Startup: Listens on PORT immediately while database connects.
// 2. High-Availability Endpoints: /api/leads, /api/history, /api/escalate, /api/summary, /api/sessions.
// 3. Reliable Data Storage: Works seamlessly with MongoDB and persistent local file storage (db_storage.json).
// ==============================================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ObjectId } = require('mongodb');
const {
  initDatabase,
  getIsDbConnected,
  getCollection,
  query,
  saveLead,
  saveMessage,
  saveEscalation,
  getHistory,
  getLeads,
  getEscalations,
} = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ==============================================================================
// SECTION 1: HEALTH CHECK & ROOT
// ==============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'WeIntern AI Chatbot Database Server',
    db_status: getIsDbConnected() ? 'MongoDB' : 'Persistent Local Storage (db_storage.json)',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.status(200).send('WeIntern Database Backend is running. Use /health for status.');
});

// ==============================================================================
// SECTION 2: LEAD MANAGEMENT ENDPOINTS
// ==============================================================================

// POST /api/leads -> Save a new student lead
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, preferred_domain, domain } = req.body;
    const targetDomain = (preferred_domain || domain || '').trim();

    if (!name || !email || !phone || !targetDomain) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all fields: name, email, phone, and preferred_domain.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    const result = await saveLead({
      name,
      email,
      phone,
      preferred_domain: targetDomain,
    });

    return res.status(201).json({
      success: true,
      message: 'Lead captured successfully in database!',
      data: {
        id: result.insertedId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferred_domain: targetDomain,
      },
    });
  } catch (error) {
    console.error('Error saving lead:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to save lead.' });
  }
});

// GET /api/leads & GET /api/admin/leads -> Retrieve all leads
app.get(['/api/leads', '/api/admin/leads'], async (req, res) => {
  try {
    const leads = await getLeads();
    const sortedLeads = Array.isArray(leads) ? [...leads].reverse() : [];
    return res.status(200).json({
      success: true,
      count: sortedLeads.length,
      data: sortedLeads,
    });
  } catch (error) {
    console.error('Error fetching leads:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch leads.' });
  }
});

// ==============================================================================
// SECTION 3: CONVERSATION HISTORY & SESSIONS ENDPOINTS
// ==============================================================================

// GET /api/history -> Get chat history for a session_id
app.get('/api/history', async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: session_id',
      });
    }

    const messages = await getHistory(sessionId);
    return res.status(200).json({
      success: true,
      session_id: sessionId,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching history:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch chat history.' });
  }
});

// POST /api/history -> Save a single chat message (user or bot)
app.post('/api/history', async (req, res) => {
  try {
    const { session_id, sender, message, source, voice_metadata } = req.body;

    if (!session_id || !sender || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide session_id, sender, and message.',
      });
    }

    const result = await saveMessage({
      session_id,
      sender,
      message,
      source,
      voice_metadata,
    });

    return res.status(201).json({
      success: true,
      message: 'Message saved successfully in database!',
      data: {
        id: result.insertedId,
        session_id,
        sender,
        message,
        source: source || 'text',
      },
    });
  } catch (error) {
    console.error('Error saving message:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to save message.' });
  }
});

// DELETE /api/history -> Clear chat history for a session_id
app.delete('/api/history', async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId || req.body?.session_id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: session_id',
      });
    }

    await query('messages', 'deleteMany', [{ session_id: sessionId }]);

    return res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully from database.',
      session_id: sessionId,
    });
  } catch (error) {
    console.error('Error clearing history:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to clear chat history.' });
  }
});

// GET /api/sessions & GET /api/admin/sessions -> Get list of active sessions
app.get(['/api/sessions', '/api/admin/sessions'], async (req, res) => {
  try {
    const sessions = await query('sessions', 'find', [{}]);
    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch sessions.' });
  }
});

// ==============================================================================
// SECTION 4: HUMAN ESCALATION ENDPOINTS
// ==============================================================================

// POST /api/escalate & POST /api/escalations -> Create support escalation ticket
app.post(['/api/escalate', '/api/escalations'], async (req, res) => {
  try {
    const { session_id, issue } = req.body;

    if (!session_id || !issue) {
      return res.status(400).json({
        success: false,
        error: 'Please provide session_id and issue description.',
      });
    }

    const result = await saveEscalation({
      session_id,
      issue,
    });

    return res.status(201).json({
      success: true,
      message: 'Escalation ticket created successfully in database!',
      data: {
        id: result.insertedId,
        session_id,
        issue: issue.trim(),
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Error creating escalation:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to create escalation ticket.' });
  }
});

// GET /api/escalations & GET /api/admin/escalations -> View escalation tickets
app.get(['/api/escalations', '/api/admin/escalations'], async (req, res) => {
  try {
    const escalations = await getEscalations();
    const sortedEscalations = Array.isArray(escalations) ? [...escalations].reverse() : [];
    return res.status(200).json({
      success: true,
      count: sortedEscalations.length,
      data: sortedEscalations,
    });
  } catch (error) {
    console.error('Error fetching escalations:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch escalations.' });
  }
});

// PATCH /api/escalations/:id & PATCH /api/admin/escalations/:id -> Update ticket status
app.patch(['/api/escalations/:id', '/api/admin/escalations/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'in_progress', 'resolved', 'closed'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const collection = getCollection('escalations');
    let filter = {};
    try {
      filter = { _id: new ObjectId(id) };
    } catch (_) {
      filter = { id: Number(id) };
    }

    const updated = await collection.findOneAndUpdate(
      filter,
      { $set: { status, updated_at: new Date() } },
      { returnDocument: 'after' }
    );

    const ticket = updated ? (updated.value || updated) : null;
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error('Error updating escalation:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to update ticket.' });
  }
});

// GET /api/summary & GET /api/admin/summary -> Overview statistics
app.get(['/api/summary', '/api/admin/summary'], async (req, res) => {
  try {
    const leads = await getLeads();
    const escalations = await getEscalations();

    const totalLeads = Array.isArray(leads) ? leads.length : 0;
    const totalEscalations = Array.isArray(escalations) ? escalations.length : 0;
    const pendingEscalations = Array.isArray(escalations)
      ? escalations.filter((e) => e.status === 'pending').length
      : 0;

    return res.status(200).json({
      success: true,
      summary: {
        total_leads: totalLeads,
        total_escalations: totalEscalations,
        pending_escalations: pendingEscalations,
      },
    });
  } catch (error) {
    console.error('Error fetching summary:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch summary.' });
  }
});

// ==============================================================================
// SECTION 5: START SERVER
// ==============================================================================

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 [Server] WeIntern Database Backend live on port ${PORT}`);
  console.log(`📡 [Health Check] http://localhost:${PORT}/health`);
  console.log(`====================================================`);

  // Initialize MongoDB connection asynchronously in background
  initDatabase().catch((err) => console.warn('⚠️ Background initDatabase notice:', err.message));
});

// ==============================================================================
// FILE: server.js
// PURPOSE: Main Express Web Server and API Endpoint Handler.
// WHY WE CREATED THIS FILE:
// 1. Receives requests from the Next.js frontend (e.g. chat messages, lead forms).
// 2. Contains all backend routes cleanly organized in one file so beginners can follow along easily.
// 3. Connects to database (db.js) to store and retrieve data.
// ==============================================================================

// Line 1: Import 'express' web framework to handle HTTP requests
const express = require('express');

// Line 2: Import 'cors' middleware to allow frontend (Next.js) to make requests to backend
const cors = require('cors');

// Line 3: Import 'dotenv' to read environment variables from .env file
const dotenv = require('dotenv');

// Line 4: Import database connection and fallback tools from db.js
const { query, initDatabase, getIsPgConnected, inMemoryDb } = require('./db');

// Line 5: Load environment variables into process.env
dotenv.config();

// Line 6: Create an instance of Express application
const app = express();

// Line 7: Define server port (reads PORT from .env or defaults to 5000)
const PORT = process.env.PORT || 5000;

// Line 8: Enable CORS middleware so browser allows cross-origin API requests
app.use(cors());

// Line 9: Enable JSON middleware to automatically parse incoming request body data
app.use(express.json());


// ==============================================================================
// SECTION 1: HEALTH CHECK ENDPOINT
// WHY: Used to verify if our server is running and online.
// ==============================================================================
app.get('/health', (req, res) => {
  // Respond with HTTP 200 (OK) status and JSON message
  res.status(200).json({
    status: 'online', // Server state
    service: 'WeIntern AI Chatbot Database Server', // Service name
    db_status: getIsPgConnected() ? 'PostgreSQL' : 'In-Memory Fallback', // Active DB mode
    timestamp: new Date().toISOString() // Current server timestamp
  });
});


// ==============================================================================
// SECTION 2: LEAD MANAGEMENT ENDPOINTS (PRD Section 13 & 15)
// WHY: Captures student lead data when students fill out the chatbot lead form.
// ==============================================================================

// ENDPOINT 1: POST /api/leads -> Save a new student lead
app.post('/api/leads', async (req, res) => {
  try {
    // Extract input fields from request body sent by frontend
    const { name, email, phone, preferred_domain } = req.body;

    // Line Validation: Check if any required field is missing
    if (!name || !email || !phone || !preferred_domain) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all fields: name, email, phone, and preferred_domain.'
      });
    }

    // Check if connected to real PostgreSQL database
    if (getIsPgConnected()) {
      // SQL query to insert new lead into leads table
      const sql = `
        INSERT INTO leads (name, email, phone, preferred_domain)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      // Execute query with parameterized values to prevent SQL injection
      const result = await query(sql, [name.trim(), email.trim(), phone.trim(), preferred_domain.trim()]);
      
      // Return HTTP 201 (Created) with inserted lead data
      return res.status(201).json({
        success: true,
        message: 'Lead captured successfully in PostgreSQL!',
        data: result.rows[0]
      });
    }

    // FALLBACK MODE (If PostgreSQL is not running locally):
    const newLead = {
      id: inMemoryDb.autoId.leads++, // Generate next ID
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      preferred_domain: preferred_domain.trim(),
      created_at: new Date().toISOString()
    };
    // Push new lead into in-memory array
    inMemoryDb.leads.push(newLead);

    // Return response
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


// ENDPOINT 2: GET /api/admin/leads -> Retrieve all captured leads for Admin
app.get('/api/admin/leads', async (req, res) => {
  try {
    // If PostgreSQL is connected
    if (getIsPgConnected()) {
      // Run SQL SELECT query to get all leads ordered by newest first
      const result = await query(`SELECT * FROM leads ORDER BY created_at DESC;`);
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    }

    // Fallback mode response
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
// WHY: Stores and retrieves conversation history so user can see past messages.
// ==============================================================================

// ENDPOINT 3: GET /api/history -> Get chat history for a session_id
app.get('/api/history', async (req, res) => {
  try {
    // Read session_id from query parameter (e.g. /api/history?session_id=123)
    const sessionId = req.query.session_id || req.query.sessionId;

    // Check if session_id parameter was provided
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: session_id'
      });
    }

    // If PostgreSQL connected
    if (getIsPgConnected()) {
      // Query messages table for matching session_id
      const sql = `SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC;`;
      const result = await query(sql, [sessionId]);
      return res.status(200).json({
        success: true,
        session_id: sessionId,
        count: result.rows.length,
        data: result.rows
      });
    }

    // Fallback mode: Filter in-memory messages array
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
    // Extract session_id, sender, and message from request body
    const { session_id, sender, message } = req.body;

    // Validate inputs
    if (!session_id || !sender || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide session_id, sender, and message.'
      });
    }

    // If PostgreSQL is connected
    if (getIsPgConnected()) {
      // Ensure session exists in sessions table
      await query(`INSERT INTO sessions (session_id) VALUES ($1) ON CONFLICT (session_id) DO NOTHING;`, [session_id]);
      
      // Insert message record into messages table
      const sql = `INSERT INTO messages (session_id, sender, message) VALUES ($1, $2, $3) RETURNING *;`;
      const result = await query(sql, [session_id, sender, message]);

      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }

    // Fallback mode: Save in memory
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
// WHY: Collects escalation requests when chatbot cannot answer student queries.
// ==============================================================================

// ENDPOINT 5: POST /api/escalate -> Create support ticket
app.post('/api/escalate', async (req, res) => {
  try {
    // Read session_id and issue description from request body
    const { session_id, issue } = req.body;

    // Check required inputs
    if (!session_id || !issue) {
      return res.status(400).json({
        success: false,
        error: 'Please provide session_id and issue description.'
      });
    }

    // If PostgreSQL connected
    if (getIsPgConnected()) {
      const sql = `INSERT INTO escalations (session_id, issue, status) VALUES ($1, $2, 'pending') RETURNING *;`;
      const result = await query(sql, [session_id, issue.trim()]);
      return res.status(201).json({
        success: true,
        message: 'Escalation ticket created successfully!',
        data: result.rows[0]
      });
    }

    // Fallback mode: Save in memory
    const newEscalation = {
      id: inMemoryDb.autoId.escalations++,
      session_id,
      issue: issue.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
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


// ENDPOINT 6: GET /api/admin/escalations -> View support escalation tickets for Admin
app.get('/api/admin/escalations', async (req, res) => {
  try {
    if (getIsPgConnected()) {
      const result = await query(`SELECT * FROM escalations ORDER BY created_at DESC;`);
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
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


// ENDPOINT 7: PATCH /api/admin/escalations/:id -> Update escalation ticket status
app.patch('/api/admin/escalations/:id', async (req, res) => {
  try {
    const { id } = req.params;     // Ticket ID from URL parameter
    const { status } = req.body;  // New status string ('pending', 'in_progress', 'resolved', 'closed')

    const allowed = ['pending', 'in_progress', 'resolved', 'closed'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${allowed.join(', ')}`
      });
    }

    if (getIsPgConnected()) {
      const sql = `UPDATE escalations SET status = $1 WHERE id = $2 RETURNING *;`;
      const result = await query(sql, [status, id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Ticket not found.' });
      }
      return res.status(200).json({ success: true, data: result.rows[0] });
    }

    // Fallback mode
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


// ENDPOINT 8: GET /api/admin/summary -> Overview statistics for Admin Dashboard
app.get('/api/admin/summary', async (req, res) => {
  try {
    let leadsCount = 0;
    let escalationsCount = 0;
    let pendingCount = 0;

    if (getIsPgConnected()) {
      const leadsRes = await query(`SELECT COUNT(*) FROM leads;`);
      const escRes = await query(`SELECT COUNT(*) FROM escalations;`);
      const pendingRes = await query(`SELECT COUNT(*) FROM escalations WHERE status = 'pending';`);

      leadsCount = parseInt(leadsRes.rows[0].count, 10);
      escalationsCount = parseInt(escRes.rows[0].count, 10);
      pendingCount = parseInt(pendingRes.rows[0].count, 10);
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
// WHY: Boots up database auto-creation and starts listening on the specified port.
// ==============================================================================
const start = async () => {
  // Line 1: Call database auto-initialization function
  await initDatabase();

  // Line 2: Start Express app server listening on PORT
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 [Server] WeIntern Database Backend live on port ${PORT}`);
    console.log(`📡 [Health Check] http://localhost:${PORT}/health`);
    console.log(`====================================================`);
  });
};

// Execute start function to ignite server
start();

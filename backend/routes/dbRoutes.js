const express = require('express');
const router = express.Router();
const { query, getIsPgConnected, inMemoryDb } = require('../database/db');

// ==============================================================================
// LEAD MANAGEMENT ENDPOINTS
// ==============================================================================

// POST /api/leads -> Save a new student lead
router.post('/leads', async (req, res) => {
  try {
    const { name, email, phone, preferred_domain, domain } = req.body;
    const targetDomain = (preferred_domain || domain || '').trim();

    if (!name || !email || !phone || !targetDomain) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all fields: name, email, phone, and preferred_domain.'
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    // Secure format validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid phone number (minimum 10 digits).'
      });
    }

    if (getIsPgConnected()) {
      const sql = `
        INSERT INTO leads (name, email, phone, preferred_domain)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const result = await query(sql, [trimmedName, trimmedEmail, trimmedPhone, targetDomain]);
      return res.status(201).json({
        success: true,
        message: 'Lead captured successfully in PostgreSQL!',
        data: result.rows[0]
      });
    }

    // Fallback mode (In-Memory)
    const newLead = {
      id: inMemoryDb.autoId.leads++,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      preferred_domain: targetDomain,
      created_at: new Date().toISOString()
    };
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

// GET /api/leads & GET /api/admin/leads -> Retrieve all leads
const getLeadsHandler = async (req, res) => {
  try {
    if (getIsPgConnected()) {
      const result = await query(`SELECT * FROM leads ORDER BY created_at DESC;`);
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
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
};

router.get('/leads', getLeadsHandler);
router.get('/admin/leads', getLeadsHandler);

// ==============================================================================
// CONVERSATION HISTORY ENDPOINTS
// ==============================================================================

// GET /api/history -> Get chat history for a session_id
router.get('/history', async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: session_id'
      });
    }

    if (getIsPgConnected()) {
      const sql = `SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC;`;
      const result = await query(sql, [sessionId]);
      return res.status(200).json({
        success: true,
        session_id: sessionId,
        count: result.rows.length,
        data: result.rows
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

// POST /api/history -> Save a single chat message
router.post('/history', async (req, res) => {
  try {
    const { session_id, sender, message } = req.body;

    if (!session_id || !sender || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide session_id, sender, and message.'
      });
    }

    if (getIsPgConnected()) {
      await query(`INSERT INTO sessions (session_id) VALUES ($1) ON CONFLICT (session_id) DO NOTHING;`, [session_id]);
      const sql = `INSERT INTO messages (session_id, sender, message) VALUES ($1, $2, $3) RETURNING *;`;
      const result = await query(sql, [session_id, sender, message]);

      return res.status(201).json({
        success: true,
        data: result.rows[0]
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
// HUMAN ESCALATION ENDPOINTS
// ==============================================================================

// POST /api/escalate & POST /api/escalations -> Create support ticket
const createEscalationHandler = async (req, res) => {
  try {
    const { session_id, issue } = req.body;

    if (!session_id || !issue) {
      return res.status(400).json({
        success: false,
        error: 'Please provide session_id and issue description.'
      });
    }

    if (getIsPgConnected()) {
      const sql = `INSERT INTO escalations (session_id, issue, status) VALUES ($1, $2, 'pending') RETURNING *;`;
      const result = await query(sql, [session_id, issue.trim()]);
      return res.status(201).json({
        success: true,
        message: 'Escalation ticket created successfully!',
        data: result.rows[0]
      });
    }

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
};

router.post('/escalate', createEscalationHandler);
router.post('/escalations', createEscalationHandler);

// GET /api/escalations & GET /api/admin/escalations
const getEscalationsHandler = async (req, res) => {
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
};

router.get('/escalations', getEscalationsHandler);
router.get('/admin/escalations', getEscalationsHandler);

// PATCH /api/escalations/:id & PATCH /api/admin/escalations/:id
const patchEscalationHandler = async (req, res) => {
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

    if (getIsPgConnected()) {
      const sql = `UPDATE escalations SET status = $1 WHERE id = $2 RETURNING *;`;
      const result = await query(sql, [status, id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Ticket not found.' });
      }
      return res.status(200).json({ success: true, data: result.rows[0] });
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
};

router.patch('/escalations/:id', patchEscalationHandler);
router.patch('/admin/escalations/:id', patchEscalationHandler);

// GET /api/summary & GET /api/admin/summary
const getSummaryHandler = async (req, res) => {
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
};

router.get('/summary', getSummaryHandler);
router.get('/admin/summary', getSummaryHandler);

module.exports = router;

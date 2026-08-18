const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { ObjectId } = require('mongodb');
const router = express.Router();
const { getCollection, getIsDbConnected, inMemoryDb } = require('../database/db');
const { sendStudentEnrollmentEmail, sendAdminNotificationEmail } = require('../services/emailService');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
}

// ── Approved WeIntern Internship Pricing Map (Knowledge Base) ────────────────
const APPROVED_PRICING = {
  "3 Months": 999,
  "6 Months": 6599
};

// ============================================================================== 
// LEAD & PAYMENT MANAGEMENT ENDPOINTS
// ============================================================================== 

// ── 1. Create Lead / Payment Order Endpoint ──────────────────────────────────
router.post('/leads/payment/order', async (req, res) => {
  try {
    const { name, email, phone, preferred_domain, domain, internship_duration } = req.body;
    const targetDomain = (preferred_domain || domain || '').trim();
    const duration = (internship_duration || '3 Months').trim();

    if (!name || !email || !phone || !targetDomain || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, email, phone, preferred_domain, and internship_duration.'
      });
    }

    const amount = APPROVED_PRICING[duration];
    if (!amount) {
      return res.status(400).json({
        success: false,
        error: `Invalid internship duration. Allowed options: ${Object.keys(APPROVED_PRICING).join(', ')}`
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

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

    let orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (razorpayInstance) {
      try {
        const razorpayOrder = await razorpayInstance.orders.create({
          amount: amount * 100, // Amount in paise
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            student_name: trimmedName,
            student_email: trimmedEmail,
            domain: targetDomain,
            duration
          }
        });
        orderId = razorpayOrder.id;
      } catch (rpErr) {
        console.warn('[Razorpay Order Creation Warning]:', rpErr.message);
      }
    }

    const newLeadRecord = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      preferred_domain: targetDomain,
      internship_duration: duration,
      amount,
      order_id: orderId,
      payment_status: 'PENDING',
      enrollment_status: 'UNPAID',
      email_sent: false,
      created_at: new Date()
    };

    if (getIsDbConnected()) {
      const collection = getCollection('leads');
      // Upsert by email to prevent duplicate entries
      await collection.updateOne(
        { email: trimmedEmail },
        { $set: newLeadRecord },
        { upsert: true }
      );
    } else {
      const existingIdx = inMemoryDb.leads.findIndex(l => l.email === trimmedEmail);
      if (existingIdx >= 0) {
        inMemoryDb.leads[existingIdx] = { ...inMemoryDb.leads[existingIdx], ...newLeadRecord };
      } else {
        newLeadRecord.id = inMemoryDb.autoId.leads++;
        inMemoryDb.leads.push(newLeadRecord);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        order_id: orderId,
        amount,
        currency: 'INR',
        key_id: RAZORPAY_KEY_ID || 'rzp_test_simulated',
        student: {
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          domain: targetDomain,
          duration
        }
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to create payment order.' });
  }
});

// ── 2. Server-Side Payment Verification Endpoint ─────────────────────────────
router.post('/leads/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      phone,
      payment_status
    } = req.body;

    const userEmail = (email || '').trim();
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Please provide registered email address for payment verification.'
      });
    }

    // Handle Payment Failure / Cancellation explicitly
    if (payment_status === 'FAILED' || payment_status === 'CANCELLED') {
      const updateFailedData = {
        payment_status: 'FAILED',
        enrollment_status: 'UNPAID',
        payment_failed_at: new Date()
      };

      if (getIsDbConnected()) {
        const collection = getCollection('leads');
        await collection.updateOne({ email: userEmail }, { $set: updateFailedData });
      } else {
        const lead = inMemoryDb.leads.find(l => l.email === userEmail);
        if (lead) Object.assign(lead, updateFailedData);
      }

      return res.status(400).json({
        success: false,
        error: 'Payment was cancelled or failed. Enrollment remains UNPAID.',
        data: { payment_status: 'FAILED' }
      });
    }

    // Verify Signature Server-Side if Razorpay Keys are active
    if (RAZORPAY_KEY_SECRET && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.error('[SECURITY ALERT] Server-side Razorpay signature verification failed!');
        return res.status(400).json({
          success: false,
          error: 'Server-side payment signature verification failed. Unauthorized transaction.'
        });
      }
    }

    const verifiedPaymentId = razorpay_payment_id || `pay_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    let leadRecord = null;
    if (getIsDbConnected()) {
      const collection = getCollection('leads');
      leadRecord = await collection.findOne({ email: userEmail });
    } else {
      leadRecord = inMemoryDb.leads.find(l => l.email === userEmail);
    }

    if (!leadRecord) {
      return res.status(404).json({
        success: false,
        error: 'Lead record not found for the provided email.'
      });
    }

    const updatePaidData = {
      payment_status: 'PAID',
      enrollment_status: 'ENROLLED',
      payment_id: verifiedPaymentId,
      payment_date: new Date()
    };

    if (getIsDbConnected()) {
      const collection = getCollection('leads');
      await collection.updateOne({ email: userEmail }, { $set: updatePaidData });
    } else {
      Object.assign(leadRecord, updatePaidData);
    }

    const updatedLeadDetails = { ...leadRecord, ...updatePaidData };

    // Idempotent Email Dispatch (only send if not already sent for this transaction)
    if (!leadRecord.email_sent) {
      await sendStudentEnrollmentEmail(updatedLeadDetails);
      await sendAdminNotificationEmail(updatedLeadDetails);

      const emailFlagUpdate = { email_sent: true };
      if (getIsDbConnected()) {
        const collection = getCollection('leads');
        await collection.updateOne({ email: userEmail }, { $set: emailFlagUpdate });
      } else {
        Object.assign(leadRecord, emailFlagUpdate);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified server-side! Enrollment is now PAID.',
      data: updatedLeadDetails
    });

  } catch (error) {
    console.error('Error verifying payment:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to verify payment server-side.' });
  }
});

// ============================================================================== 
// LEAD MANAGEMENT ENDPOINTS
// ============================================================================== 

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

    const newLead = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
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

const getLeadsHandler = async (req, res) => {
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
};

router.get('/leads', getLeadsHandler);
router.get('/admin/leads', getLeadsHandler);

// ============================================================================== 
// CONVERSATION HISTORY ENDPOINTS
// ============================================================================== 

router.get('/history', async (req, res) => {
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

    const filteredMessages = inMemoryDb.messages.filter((m) => m.session_id === sessionId);
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

router.post('/history', async (req, res) => {
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

      await sessionCollection.updateOne(
        { session_id },
        { $setOnInsert: { session_id, created_at: new Date() } },
        { upsert: true }
      );

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

router.delete('/history', async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId || req.body?.session_id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: session_id'
      });
    }

    if (getIsDbConnected()) {
      const collection = getCollection('messages');
      await collection.deleteMany({ session_id: sessionId });
      return res.status(200).json({
        success: true,
        message: 'Chat history cleared successfully from MongoDB.',
        session_id: sessionId
      });
    }

    inMemoryDb.messages = inMemoryDb.messages.filter((m) => m.session_id !== sessionId);
    return res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully.',
      session_id: sessionId
    });
  } catch (error) {
    console.error('Error clearing history:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to clear chat history.' });
  }
});

// ============================================================================== 
// HUMAN ESCALATION ENDPOINTS
// ============================================================================== 

const createEscalationHandler = async (req, res) => {
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
};

router.post('/escalate', createEscalationHandler);
router.post('/escalations', createEscalationHandler);

const getEscalationsHandler = async (req, res) => {
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
};

router.get('/escalations', getEscalationsHandler);
router.get('/admin/escalations', getEscalationsHandler);

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

    if (getIsDbConnected()) {
      const collection = getCollection('escalations');
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status } },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ success: false, error: 'Ticket not found.' });
      }

      return res.status(200).json({ success: true, data: result.value });
    }

    const ticket = inMemoryDb.escalations.find((e) => e.id === Number(id));
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

const getSummaryHandler = async (req, res) => {
  try {
    let leadsCount = 0;
    let escalationsCount = 0;
    let pendingCount = 0;

    if (getIsDbConnected()) {
      const leadsCollection = getCollection('leads');
      const escalationsCollection = getCollection('escalations');

      if (leadsCollection) leadsCount = await leadsCollection.countDocuments({});
      if (escalationsCollection) {
        escalationsCount = await escalationsCollection.countDocuments({});
        pendingCount = await escalationsCollection.countDocuments({ status: 'pending' });
      }
    } else {
      leadsCount = inMemoryDb.leads.length;
      escalationsCount = inMemoryDb.escalations.length;
      pendingCount = inMemoryDb.escalations.filter((e) => e.status === 'pending').length;
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

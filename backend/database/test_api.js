/**
 * Automated API Test Script for Backend Database Module
 */

const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: process.env.PORT || 5001,
  path: '/',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const makeRequest = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        ...options,
        path,
        method,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log('--- Starting Database APIs Automated Tests ---');

  try {
    // 1. Health check
    const health = await makeRequest('/health');
    console.log('1. GET /health:', health.statusCode, health.body);

    // 2. Create Lead
    const lead = await makeRequest('/api/leads', 'POST', {
      name: 'Alice Intern',
      email: 'alice@example.com',
      phone: '9876543210',
      preferred_domain: 'Web Development',
    });
    console.log('2. POST /api/leads:', lead.statusCode, lead.body);

    // 3. Admin Get Leads
    const leadsList = await makeRequest('/api/admin/leads');
    console.log('3. GET /api/admin/leads:', leadsList.statusCode, 'Count:', leadsList.body.count);

    // 4. Save Message
    const msg = await makeRequest('/api/history', 'POST', {
      session_id: 'sess-test-01',
      sender: 'user',
      message: 'What is the internship duration?',
    });
    console.log('4. POST /api/history:', msg.statusCode, msg.body);

    // 5. Get History
    const history = await makeRequest('/api/history?session_id=sess-test-01');
    console.log('5. GET /api/history:', history.statusCode, 'Messages Count:', history.body.count);

    // 6. Get Sessions
    const sessions = await makeRequest('/api/sessions');
    console.log('6. GET /api/sessions:', sessions.statusCode, 'Sessions Count:', sessions.body.count);

    // 7. Create Escalation
    const esc = await makeRequest('/api/escalate', 'POST', {
      session_id: 'sess-test-01',
      issue: 'User requested manual callback regarding certificate validity.',
    });
    console.log('7. POST /api/escalate:', esc.statusCode, esc.body);

    // 8. Admin Get Escalations
    const escList = await makeRequest('/api/admin/escalations');
    console.log('8. GET /api/admin/escalations:', escList.statusCode, 'Count:', escList.body.count);

    // 9. Update Escalation Status
    if (esc.body.data && esc.body.data.id) {
      const updatedEsc = await makeRequest(`/api/escalations/${esc.body.data.id}`, 'PATCH', {
        status: 'in_progress',
      });
      console.log('9. PATCH /api/escalations/:id:', updatedEsc.statusCode, updatedEsc.body);
    }

    // 10. Admin Dashboard Summary
    const summary = await makeRequest('/api/admin/summary');
    console.log('10. GET /api/admin/summary:', summary.statusCode, summary.body);

    console.log('--- All Tests Completed Successfully! ---');
  } catch (err) {
    console.error('Test execution failed:', err.message);
  }
}

runTests();

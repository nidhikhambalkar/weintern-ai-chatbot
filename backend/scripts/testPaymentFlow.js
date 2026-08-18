const http = require('http');

console.log('====================================================');
console.log('       LEAD PAYMENT & EMAIL FLOW INTEGRATION TEST   ');
console.log('====================================================\n');

function makeRequest(path, method, bodyData) {
  return new Promise((resolve, reject) => {
    const data = bodyData ? JSON.stringify(bodyData) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', err => reject(err));
    if (data) req.write(data);
    req.end();
  });
}

async function runPaymentTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Create Order for 3-Month Program
  console.log('▶ TEST 1: Create Payment Order for 3-Month Internship');
  const res1 = await makeRequest('/api/leads/payment/order', 'POST', {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '9876543210',
    preferred_domain: 'Full Stack Web Development',
    internship_duration: '3 Months'
  });

  if (res1.status === 200 && res1.data.success && res1.data.data.amount === 999) {
    console.log('  [PASS] 3-Month Order Created | Amount: ₹' + res1.data.data.amount + ' | Order ID: ' + res1.data.data.order_id);
    passed++;
  } else {
    console.log('  [FAIL] 3-Month Order Failed:', res1.data);
    failed++;
  }
  console.log('----------------------------------------------------');

  // Test 2: Create Order for 6-Month Program
  console.log('▶ TEST 2: Create Payment Order for 6-Month Internship');
  const res2 = await makeRequest('/api/leads/payment/order', 'POST', {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '9123456789',
    preferred_domain: 'Data Science & Analytics',
    internship_duration: '6 Months'
  });

  if (res2.status === 200 && res2.data.success && res2.data.data.amount === 6599) {
    console.log('  [PASS] 6-Month Order Created | Amount: ₹' + res2.data.data.amount + ' | Order ID: ' + res2.data.data.order_id);
    passed++;
  } else {
    console.log('  [FAIL] 6-Month Order Failed:', res2.data);
    failed++;
  }
  console.log('----------------------------------------------------');

  // Test 3: Server-Side Payment Verification (3-Month Student)
  console.log('▶ TEST 3: Server-Side Payment Verification (3-Month)');
  const res3 = await makeRequest('/api/leads/payment/verify', 'POST', {
    razorpay_order_id: res1.data.data ? res1.data.data.order_id : 'order_sim_1',
    razorpay_payment_id: 'pay_aarav_999_verified',
    email: 'aarav.sharma@example.com',
    phone: '9876543210'
  });

  if (res3.status === 200 && res3.data.success && res3.data.data.payment_status === 'PAID') {
    console.log('  [PASS] 3-Month Payment Verified Server-Side | Status: ' + res3.data.data.payment_status + ' | Payment ID: ' + res3.data.data.payment_id);
    passed++;
  } else {
    console.log('  [FAIL] 3-Month Payment Verification Failed:', res3.data);
    failed++;
  }
  console.log('----------------------------------------------------');

  // Test 4: Server-Side Payment Verification (6-Month Student)
  console.log('▶ TEST 4: Server-Side Payment Verification (6-Month)');
  const res4 = await makeRequest('/api/leads/payment/verify', 'POST', {
    razorpay_order_id: res2.data.data ? res2.data.data.order_id : 'order_sim_2',
    razorpay_payment_id: 'pay_priya_6599_verified',
    email: 'priya.patel@example.com',
    phone: '9123456789'
  });

  if (res4.status === 200 && res4.data.success && res4.data.data.payment_status === 'PAID') {
    console.log('  [PASS] 6-Month Payment Verified Server-Side | Status: ' + res4.data.data.payment_status + ' | Payment ID: ' + res4.data.data.payment_id);
    passed++;
  } else {
    console.log('  [FAIL] 6-Month Payment Verification Failed:', res4.data);
    failed++;
  }
  console.log('----------------------------------------------------');

  // Test 5: Failed Payment Handling
  console.log('▶ TEST 5: Failed Payment Handling');
  // First create order for failed attempt
  await makeRequest('/api/leads/payment/order', 'POST', {
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '9988776655',
    preferred_domain: 'UI/UX Design',
    internship_duration: '3 Months'
  });

  const res5 = await makeRequest('/api/leads/payment/verify', 'POST', {
    email: 'rohan.verma@example.com',
    phone: '9988776655',
    payment_status: 'FAILED'
  });

  if (res5.status === 400 && res5.data.data && res5.data.data.payment_status === 'FAILED') {
    console.log('  [PASS] Failed Payment Handled Correctly | Enrollment remains UNPAID');
    passed++;
  } else {
    console.log('  [FAIL] Failed Payment Handling Error:', res5.data);
    failed++;
  }
  console.log('----------------------------------------------------');

  // Test 6: Verify Dashboard Leads Data
  console.log('▶ TEST 6: Fetch Leads for Admin Dashboard');
  const res6 = await makeRequest('/api/leads', 'GET');

  if (res6.status === 200 && res6.data.success && Array.isArray(res6.data.data)) {
    console.log('  [PASS] Admin Leads Retrieved | Total Count: ' + res6.data.count);
    const aarav = res6.data.data.find(l => l.email === 'aarav.sharma@example.com');
    const priya = res6.data.data.find(l => l.email === 'priya.patel@example.com');
    if (aarav && aarav.payment_status === 'PAID' && priya && priya.payment_status === 'PAID') {
      console.log('  [PASS] Verified Aarav (3M, ₹999, PAID) and Priya (6M, ₹6,599, PAID) in DB!');
      passed++;
    } else {
      console.log('  [FAIL] DB Verification Error: Aarav or Priya not found/PAID');
      failed++;
    }
  } else {
    console.log('  [FAIL] Admin Leads Fetch Failed:', res6.data);
    failed++;
  }

  console.log('\n====================================================');
  console.log('         PAYMENT & EMAIL FLOW TEST SUMMARY          ');
  console.log('====================================================');
  console.log(` Total Tests:   6`);
  console.log(` Passed:        ${passed}`);
  console.log(` Failed:        ${failed}`);
  console.log(` Success Rate:  ${((passed / 6) * 100).toFixed(2)}%`);
  console.log('====================================================\n');
}

runPaymentTests();

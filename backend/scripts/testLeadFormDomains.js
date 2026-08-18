const http = require('http');

console.log('====================================================');
console.log('       LEAD FORM ALL DOMAINS SUBMISSION TEST        ');
console.log('====================================================\n');

const DOMAINS_TO_TEST = [
  "Full Stack Web Development",
  "Mobile App Development",
  "AI & Automation",
  "Data Science & Analytics",
  "Python Programming",
  "Java Programming",
  "C/C++ Programming",
  "Cloud Computing & DevOps",
  "DevOps Engineering",
  "UI/UX Design",
  "Digital Marketing & SEO",
  "Video Editing & Content Creation",
  "Full Stack Development",
  "Data Science",
  "Artificial Intelligence & Machine Learning",
  "Digital Marketing",
  "Cyber Security"
];

function submitLead(name, email, phone, domain) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ name, email, phone, preferred_domain: domain });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/leads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', err => reject(err));
    req.write(data);
    req.end();
  });
}

async function runLeadFormTests() {
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < DOMAINS_TO_TEST.length; i++) {
    const domain = DOMAINS_TO_TEST[i];
    const name = `Student ${i + 1}`;
    const email = `student_${i + 1}@example.com`;
    const phone = `98765${10005 + i}`;

    try {
      const res = await submitLead(name, email, phone, domain);
      if (res.status === 201 && res.data.success && res.data.data.preferred_domain === domain) {
        passed++;
        console.log(`[PASS] #${i + 1} Submitted Lead for Domain: "${domain}"`);
      } else {
        failed++;
        console.log(`[FAIL] #${i + 1} Failed for Domain: "${domain}" | Response:`, res.data);
      }
    } catch (err) {
      failed++;
      console.log(`[ERROR] #${i + 1} Error for Domain: "${domain}":`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log('         LEAD FORM TEST SUMMARY                     ');
  console.log('====================================================');
  console.log(`Total Domains Tested: ${DOMAINS_TO_TEST.length}`);
  console.log(`Passed Submissions:   ${passed}`);
  console.log(`Failed Submissions:   ${failed}`);
  console.log(`Success Rate:         ${((passed / DOMAINS_TO_TEST.length) * 100).toFixed(2)}%`);
  console.log('====================================================\n');
}

runLeadFormTests();

const http = require("http");

const queries = [
  "Who are you?",
  "What is WeIntern?",
  "What courses do you offer?",
  "What are the course fees?",
  "What is the internship program?",
  "How can I register?",
  "What certificates do you provide?",
  "What domains are available?",
  "What is the duration of the courses?",
  "What is the contact information?",
  "weintern kya hai?",
  "WeIntern ke courses kya hai?",
  "fees kya hai?",
  "mujhe internship ke baare mein batao"
];

function testQuery(message) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ message, sessionId: "test_session_verification" });
    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/chat",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", (err) => {
      resolve({ error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runAudit() {
  console.log("====================================================");
  console.log("       COMPLETE BACKEND API VERIFICATION            ");
  console.log("====================================================\n");

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const startTime = Date.now();
    const res = await testQuery(q);
    const duration = Date.now() - startTime;

    console.log(`[${i + 1}/${queries.length}] Query: "${q}" (${duration}ms)`);
    if (res.error) {
      console.log(`  ❌ Error: ${res.error}`);
      failed++;
    } else if (res.status === 200 && res.data && res.data.success && (res.data.data?.answer || res.data.reply)) {
      const answer = res.data.data?.answer || res.data.reply;
      console.log(`  HTTP: ${res.status} OK | Mode: ${res.data.mode}`);
      console.log(`  Response format: success=${res.data.success}, message="${res.data.message}", data.answer present`);
      console.log(`  Answer excerpt: ${answer.substring(0, 120).replace(/\n/g, " ")}...\n`);
      passed++;
    } else {
      console.log(`  ❌ Failed: HTTP ${res.status}`, res.data || res.raw);
      failed++;
    }
  }

  console.log("====================================================");
  console.log(`Results: ${passed}/${queries.length} passed, ${failed} failed.`);
  console.log("====================================================");
}

runAudit();

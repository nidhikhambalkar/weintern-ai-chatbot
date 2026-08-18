const http = require("http");

const testQuestions = [
  "Who are you?",
  "What is WeIntern?",
  "What courses do you offer?",
  "What are the fees?",
  "Tell me about the internship program.",
  "How can I register?",
  "What certificates do you provide?",
  "What domains are available?",
  "What is the duration of the courses?",
  "weintern kya hai?",
  "WeIntern ke courses kya hai?",
  "fees kya hai?",
  "mujhe internship ke baare mein batao"
];

function sendQuery(message, mode = "normal") {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ message, sessionId: "sim_test_session" });
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

    req.on("error", (err) => { resolve({ error: err.message }); });
    req.write(postData);
    req.end();
  });
}

async function runComparison() {
  console.log("====================================================");
  console.log("    LOCAL VS PRODUCTION SIMULATION VERIFICATION     ");
  console.log("====================================================\n");

  let passCount = 0;

  for (let i = 0; i < testQuestions.length; i++) {
    const q = testQuestions[i];
    const res = await sendQuery(q);

    console.log(`[Question ${i + 1}/${testQuestions.length}]: "${q}"`);

    if (res.error || res.status !== 200 || !res.data?.success) {
      console.log(`  ❌ Failed: ${res.error || ("HTTP " + res.status)}`);
      continue;
    }

    const answer = res.data?.data?.answer || res.data?.reply || "";
    console.log(`  HTTP Status: ${res.status} OK`);
    console.log(`  Mode: ${res.data.mode}`);
    console.log(`  JSON Format: success=${res.data.success}, message="${res.data.message}", data.answer present`);
    console.log(`  Answer Quality Check:`);
    console.log(`    - Non-empty answer: ${answer.length > 10 ? "YES" : "NO"}`);
    console.log(`    - Clean text: ${!answer.includes("undefined") && !answer.includes("null") ? "YES" : "NO"}`);
    console.log(`  Answer Output:`);
    console.log(`    "${answer.substring(0, 140).replace(/\n/g, " ")}..."\n`);

    if (answer && answer.length > 10 && !answer.includes("undefined")) {
      passCount++;
    }
  }

  console.log("====================================================");
  console.log(`Final Verification Score: ${passCount}/${testQuestions.length} Passed`);
  console.log("====================================================");
}

runComparison();

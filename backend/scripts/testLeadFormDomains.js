const http = require('http');

console.log('====================================================');
console.log('     APPLY / REGISTER LEAD FORM DOMAINS TEST       ');
console.log('====================================================\n');

const REQUIRED_DOMAINS = [
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
  "Video Editing & Content Creation"
];

async function runLeadFormTest() {
  console.log("----------------------------------------------------");
  console.log(" STEP 1: SUBMITTING LEADS FOR ALL 10 REQUIRED DOMAINS");
  console.log("----------------------------------------------------\n");

  let submittedCount = 0;

  for (let i = 0; i < REQUIRED_DOMAINS.length; i++) {
    const domain = REQUIRED_DOMAINS[i];
    const leadData = JSON.stringify({
      name: `Test Student ${i + 1}`,
      email: `teststudent${i + 1}@example.com`,
      phone: `+91 987654320${i}`,
      preferred_domain: domain
    });

    await new Promise((resolve) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: 5000,
          path: "/api/leads",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(leadData)
          }
        },
        (res) => {
          let body = "";
          res.on("data", chunk => body += chunk);
          res.on("end", () => {
            if (res.statusCode === 201) {
              const json = JSON.parse(body);
              if (json.success && json.data && json.data.preferred_domain === domain) {
                submittedCount++;
                console.log(`[PASS] Submitted Lead #${i + 1}: Domain "${domain}" -> Saved as "${json.data.preferred_domain}"`);
              }
            } else {
              console.log(`[FAIL] Lead #${i + 1}: Status ${res.statusCode} -> ${body}`);
            }
            resolve();
          });
        }
      );
      req.write(leadData);
      req.end();
    });
  }

  console.log("\n----------------------------------------------------");
  console.log(" STEP 2: VERIFYING BACKEND / ADMIN LEADS FETCH API ");
  console.log("----------------------------------------------------\n");

  let fetchedLeads = [];
  await new Promise((resolve) => {
    http.get("http://127.0.0.1:5000/api/leads", (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(body);
          if (json.success && Array.isArray(json.data)) {
            fetchedLeads = json.data;
          }
        }
        resolve();
      });
    });
  });

  console.log(`Fetched Total Leads from Backend: ${fetchedLeads.length}`);

  let verifiedCount = 0;
  REQUIRED_DOMAINS.forEach((domain) => {
    const match = fetchedLeads.find(l => l.preferred_domain === domain);
    if (match) {
      verifiedCount++;
      console.log(`[VERIFIED] Domain "${domain}" present in database record for student "${match.name}"`);
    } else {
      console.log(`[MISSING] Domain "${domain}" not found in fetched leads!`);
    }
  });

  console.log("\n====================================================");
  console.log("             LEAD FORM DOMAIN TEST SUMMARY          ");
  console.log("====================================================");
  console.log(`Required Domains Tested:   ${REQUIRED_DOMAINS.length}`);
  console.log(`Leads Submitted Cleanly:   ${submittedCount}`);
  console.log(`Leads Verified in DB:      ${verifiedCount}`);
  console.log(`Accuracy Rate:             ${((verifiedCount / REQUIRED_DOMAINS.length) * 100).toFixed(2)}%`);
  console.log("====================================================\n");
}

runLeadFormTest();

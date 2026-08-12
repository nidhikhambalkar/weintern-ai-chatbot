// ==============================================================================
// FILE: testVoiceFeatures.js
// PURPOSE: Automated verification of rate limiting, voice metadata logging,
//          leads validation, and escalation API endpoints.
// ==============================================================================

const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("🚀 Starting WeIntern Voice & API Integration Tests...\n");

  const sessionId = "test-session-" + Date.now();

  // Test 1: Chat API with Voice Source and Metadata
  try {
    console.log("➡️ Test 1: Testing /api/chat with source: 'voice' and metadata...");
    const chatRes = await axios.post(`${BASE_URL}/api/chat`, {
      message: "What is WeIntern orientation time?",
      session_id: sessionId,
      source: "voice",
      voice_metadata: {
        duration: 3.5,
        confidence: 0.98
      }
    });

    if (chatRes.data.success && chatRes.data.reply) {
      console.log("✅ Chat API voice message processed successfully.");
      console.log(`🤖 Reply: "${chatRes.data.reply.substring(0, 80)}..."`);
    } else {
      console.error("❌ Chat API failed to process voice source.", chatRes.data);
    }
  } catch (error) {
    console.error("❌ Test 1 Failed:", error.message);
  }

  // Test 2: Verify History Retrieval and Voice Metadata Storage
  try {
    console.log("\n➡️ Test 2: Verifying database history contains voice metadata...");
    const historyRes = await axios.get(`${BASE_URL}/api/history?session_id=${sessionId}`);

    if (historyRes.data.success && historyRes.data.data.length > 0) {
      const userMsg = historyRes.data.data.find(m => m.sender === "user");
      if (userMsg && userMsg.source === "voice" && userMsg.voice_metadata) {
        console.log("✅ Message correctly saved with source 'voice' and metadata!");
        console.log("📊 Metadata saved:", JSON.stringify(userMsg.voice_metadata));
      } else {
        console.warn("⚠️ Warning: Message was saved, but source/metadata was missing or incorrect:", userMsg);
      }
    } else {
      console.error("❌ Failed to retrieve history logs.", historyRes.data);
    }
  } catch (error) {
    console.error("❌ Test 2 Failed:", error.message);
  }

  // Test 3: Leads Validation
  try {
    console.log("\n➡️ Test 3: Verifying validation on /api/leads...");
    try {
      await axios.post(`${BASE_URL}/api/leads`, {
        name: "Test User",
        email: "invalid-email",
        phone: "123",
        preferred_domain: "Full Stack Development"
      });
      console.error("❌ Test 3 Failed: Invalid lead was accepted without 400 error.");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log("✅ Validation successfully blocked invalid email/phone with status 400.");
        console.log(`ℹ️ Validation message: "${err.response.data.error}"`);
      } else {
        console.error("❌ Test 3 Failed with unexpected error status:", err.response ? err.response.status : err.message);
      }
    }
  } catch (error) {
    console.error("❌ Test 3 Failed:", error.message);
  }

  // Test 4: Human Escalation API
  try {
    console.log("\n➡️ Test 4: Testing /api/escalate endpoint...");
    const escalateRes = await axios.post(`${BASE_URL}/api/escalate`, {
      session_id: sessionId,
      issue: "Need immediate assistance with EMI details."
    });

    if (escalateRes.data.success && escalateRes.data.data.id) {
      console.log(`✅ Escalation ticket created successfully. Ticket ID: #${escalateRes.data.data.id}`);
    } else {
      console.error("❌ Failed to create escalation ticket.", escalateRes.data);
    }
  } catch (error) {
    console.error("❌ Test 4 Failed:", error.message);
  }

  // Test 5: Rate Limiting Verification
  try {
    console.log("\n➡️ Test 5: Verifying Rate Limiting (sending 65 requests quickly)...");
    let limited = false;
    for (let i = 0; i < 70; i++) {
      try {
        await axios.get(`${BASE_URL}/health`);
      } catch (err) {
        if (err.response && err.response.status === 429) {
          limited = true;
          console.log(`✅ Rate limiter triggered on request #${i + 1} with status 429!`);
          break;
        }
      }
    }
    if (!limited) {
      console.error("❌ Test 5 Failed: Rate limiter did not trigger after 70 requests.");
    }
  } catch (error) {
    console.error("❌ Test 5 Failed:", error.message);
  }

  console.log("\n🏁 Voice and API Integration Tests Completed.");
}

// Check if server is running, then run tests
axios.get(`${BASE_URL}/health`)
  .then(() => {
    runTests();
  })
  .catch((err) => {
    console.error(`❌ Error: Backend server is not running on ${BASE_URL}.`);
    console.error("💡 Please start the backend server first (e.g. run 'npm run dev' inside backend/) and try again.\n");
    process.exit(1);
  });

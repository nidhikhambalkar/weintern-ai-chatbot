const http = require('http');
const { sanitizeMessage } = require('../utils/chatUtils');
const { searchKnowledgeBase } = require('../services/knowledgeBaseService');

console.log('====================================================');
console.log('       VOICE ASSISTANT FEATURE INTEGRATION TEST     ');
console.log('====================================================\n');

// Simulated Speech-to-Text Transcripts (Devanagari, Phonetic Mishearings, Hinglish, English)
const VOICE_TEST_CASES = [
  {
    name: "Devanagari Hindi: Trust & Genuine",
    rawVoiceTranscript: "क्या वी इंटर्न जेन्युइन है",
    expectedCategory: "company",
    expectedKeyword: "MSME"
  },
  {
    name: "Devanagari Hindi: Company Overview",
    rawVoiceTranscript: "वी इंटर्न के बारे में बताओ",
    expectedCategory: "company",
    expectedKeyword: "Learn → Build → Work → Earn"
  },
  {
    name: "Devanagari Hindi: Course Fees",
    rawVoiceTranscript: "कोर्स की फीस कितनी है",
    expectedCategory: "fees",
    expectedKeyword: "fee"
  },
  {
    name: "Devanagari Hindi: Recorded Sessions",
    rawVoiceTranscript: "क्या रिकॉर्डेड सेशंस मिलेंगे",
    expectedCategory: "benefits",
    expectedKeyword: "recorded"
  },
  {
    name: "Phonetic Mishearing: wee intern info",
    rawVoiceTranscript: "wee intern info",
    expectedCategory: "company",
    expectedKeyword: "Learn → Build → Work → Earn"
  },
  {
    name: "Phonetic Mishearing: is v intern genuine",
    rawVoiceTranscript: "is v intern genuine",
    expectedCategory: "company",
    expectedKeyword: "MSME"
  },
  {
    name: "Phonetic Mishearing: does we intern give hello r",
    rawVoiceTranscript: "does we intern give hello r",
    expectedCategory: "certificates",
    expectedKeyword: "LOR"
  },
  {
    name: "Voice Query: Do you provide recorded sessions?",
    rawVoiceTranscript: "Do you provide recorded sessions?",
    expectedCategory: "benefits",
    expectedKeyword: "recorded"
  },
  {
    name: "Voice Query: what ui/ux include?",
    rawVoiceTranscript: "what ui/ux include?",
    expectedCategory: "courses",
    expectedKeyword: "UI/UX"
  },
  {
    name: "Voice Query: What are the courses you provide?",
    rawVoiceTranscript: "What are the courses you provide?",
    expectedCategory: "courses",
    expectedKeyword: "Full Stack"
  },
  {
    name: "Voice Query: Can freshers join WeIntern?",
    rawVoiceTranscript: "Can freshers join WeIntern?",
    expectedCategory: "company",
    expectedKeyword: "freshers"
  },
  {
    name: "Voice Query: Does WeIntern conduct webinars?",
    rawVoiceTranscript: "Does WeIntern conduct webinars?",
    expectedCategory: "faq",
    expectedKeyword: "webinars"
  },
  {
    "name": "Voice Query: What are internship benefits?",
    rawVoiceTranscript: "What are internship benefits?",
    expectedCategory: "benefits",
    expectedKeyword: "benefits"
  },
  {
    name: "Voice Query: What is the Data Science fee?",
    rawVoiceTranscript: "What is the Data Science fee?",
    expectedCategory: "fees",
    expectedKeyword: "₹6,599"
  },
  {
    name: "Voice Query: Do I get a certificate?",
    rawVoiceTranscript: "Do I get a certificate?",
    expectedCategory: "certification",
    expectedKeyword: "certificate"
  },
  {
    name: "Voice Query: Why should I trust WeIntern?",
    rawVoiceTranscript: "Why should I trust WeIntern?",
    expectedCategory: "company",
    expectedKeyword: "MSME"
  },
  {
    name: "Voice Query: Is WeIntern government recognized?",
    rawVoiceTranscript: "Is WeIntern government recognized?",
    expectedCategory: "company",
    expectedKeyword: "MSME"
  }
];

let passCount = 0;
let failCount = 0;

async function runVoiceTests() {
  console.log("----------------------------------------------------");
  console.log("   STEP 1: SPEECH NORMALIZATION & INTENT ENGINE     ");
  console.log("----------------------------------------------------\n");

  VOICE_TEST_CASES.forEach((tc, idx) => {
    const sanitized = sanitizeMessage(tc.rawVoiceTranscript);
    const kbRes = searchKnowledgeBase(sanitized);
    const top = kbRes.matches && kbRes.matches[0];
    const replyText = top ? top.answer : "";
    const isPass = top && replyText.toLowerCase().includes(tc.expectedKeyword.toLowerCase());

    if (isPass) {
      passCount++;
      console.log(`[PASS] #${idx + 1} ${tc.name}`);
      console.log(`  Raw Transcript: "${tc.rawVoiceTranscript}"`);
      console.log(`  Normalized:     "${sanitized}"`);
      console.log(`  Matched Q:      "${top.question}"`);
      console.log(`  Category:       ${top.category} | Score: ${top.score}`);
      console.log(`  Answer Excerpt: ${replyText.replace(/\n/g, ' ').substring(0, 90)}...`);
    } else {
      failCount++;
      console.log(`[FAIL] #${idx + 1} ${tc.name}`);
      console.log(`  Raw Transcript: "${tc.rawVoiceTranscript}"`);
      console.log(`  Normalized:     "${sanitized}"`);
      console.log(`  Matched Q:      "${top ? top.question : 'NONE'}"`);
      console.log(`  Expected KW:    "${tc.expectedKeyword}"`);
      console.log(`  Got Answer:     "${replyText.substring(0, 90)}..."`);
    }
    console.log("----------------------------------------------------");
  });

  console.log("\n----------------------------------------------------");
  console.log("   STEP 2: LIVE BACKEND API HTTP VOICE POST TEST    ");
  console.log("----------------------------------------------------\n");

  let apiPass = 0;
  for (const tc of VOICE_TEST_CASES) {
    const data = JSON.stringify({
      message: tc.rawVoiceTranscript,
      source: "voice",
      sessionId: "voice_test_session_123"
    });

    await new Promise((resolve) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: 5000,
          path: "/api/chat",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            if (res.statusCode === 200) {
              const json = JSON.parse(body);
              if (json.success && json.reply) {
                apiPass++;
              }
            }
            resolve();
          });
        }
      );
      req.on("error", () => resolve());
      req.write(data);
      req.end();
    });
  }

  console.log(`API Voice Requests Passed: ${apiPass} / ${VOICE_TEST_CASES.length}`);

  console.log("\n====================================================");
  console.log("               VOICE TEST SUMMARY                  ");
  console.log("====================================================");
  console.log(`Total Voice Test Cases:  ${VOICE_TEST_CASES.length}`);
  console.log(`Speech Match Passed:     ${passCount}`);
  console.log(`Speech Match Failed:     ${failCount}`);
  console.log(`API Responses Passed:    ${apiPass}`);
  console.log(`Accuracy Rate:           ${((passCount / VOICE_TEST_CASES.length) * 100).toFixed(2)}%`);
  console.log("====================================================\n");
}

runVoiceTests();

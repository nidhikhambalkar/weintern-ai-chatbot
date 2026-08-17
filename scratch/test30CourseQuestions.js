const { searchKnowledgeBase } = require("../backend/services/knowledgeBaseService");
const { detectIntent } = require("../backend/services/intentService");
const { sanitizeMessage } = require("../backend/utils/chatUtils");

const testQueries = [
  "What does UI/UX include?",
  "what ui ux include",
  "uiux mein kya sikhate ho?",
  "what are benefits of ui/ux?",
  "data science mein kya sikhate ho?",
  "what are data science benefits?",
  "what are internship benefits?",
  "what is weinterm?",
  "what is the fee for ui/ux?",
  "what is python course syllabus?",
  "how much is full stack fee?",
  "what will i learn in full stack?",
  "what is mobile app development duration?",
  "what is ai automation fee?",
  "what is included in ai/ml course?",
  "java course mein kya sikhayenge?",
  "what is c++ duration?",
  "cloud devops course fee kya hai?",
  "what are digital marketing benefits?",
  "digital marketing fee structure?",
  "who is ceo of weintern?",
  "where is weintern located?",
  "what is internship stipend?",
  "who is eligible for internship?",
  "do i get a certificate from course?",
  "what is 6-month internship fee?",
  "tell me about data science",
  "what is python fee?",
  "what does mobile app course cover?",
  "what is weintern mission?",
  "is placement guarantee provided?",
  "how to contact mentor?"
];

console.log("================ STARTING 32 INTENT & RETRIEVAL TEST CASES ================\n");

let passedCount = 0;

testQueries.forEach((rawQ, i) => {
  const sanitized = sanitizeMessage(rawQ);
  const intent = detectIntent(sanitized);
  const kb = searchKnowledgeBase(sanitized);
  const topMatch = kb.matches[0];
  
  const isGenericOverview = topMatch?.question?.includes("Learn Build Work Earn") || topMatch?.question?.includes("Is WeIntern genuine");
  const isCourseQuery = /ui|ux|data|full|mobile|python|java|c\+\+|cloud|marketing|ai/i.test(rawQ);
  
  const passed = topMatch && topMatch.score >= 18 && (!isCourseQuery || !isGenericOverview);
  if (passed) passedCount++;

  console.log(`[TEST ${i + 1}] QUERY: "${rawQ}"`);
  console.log(`  └─ Sanitized: "${sanitized}"`);
  console.log(`  └─ Intent: ${intent.type} | Top Match Cat: ${topMatch?.category} | Score: ${topMatch?.score}`);
  console.log(`  └─ Top Match Q: "${topMatch?.question}"`);
  console.log(`  └─ Top Match Answer Preview: "${topMatch?.answer?.slice(0, 100)}..."`);
  console.log(`  └─ Status: ${passed ? "✅ PASS" : "❌ FAIL"}\n`);
});

console.log(`================ FINAL SCORE: ${passedCount}/${testQueries.length} PASSED ================`);

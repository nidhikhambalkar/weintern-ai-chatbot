const { searchKnowledgeBase } = require("../backend/services/knowledgeBaseService");
const { detectIntent } = require("../backend/services/intentService");
const { sanitizeMessage } = require("../backend/utils/chatUtils");

const testQueries = [
  // COURSES_LIST variations (High Priority)
  "What are the courses they provide?",
  "what courses do you provide",
  "what courses do you offer",
  "which courses are available",
  "what programs do you have",
  "what can I learn at WeIntern",
  "courses provided by WeIntern",
  "courses available",
  "which courses can I join",
  "list of courses",
  "list all the courses they provide",
  
  // COURSE_CONTENT
  "What does UI/UX include?",
  "what ui ux include",
  "uiux mein kya sikhate ho?",
  "data science mein kya sikhate ho?",
  "what will i learn in full stack?",
  
  // COURSE_BENEFITS
  "what are benefits of ui/ux?",
  "what are data science benefits?",
  "what are digital marketing benefits?",
  
  // COURSE_FEES
  "what is the fee for ui/ux?",
  "how much is full stack fee?",
  "what is python fee?",
  
  // COURSE_DURATION
  "what is mobile app development duration?",
  "what is c++ duration?",
  
  // INTERNSHIP_BENEFITS & CONTENT
  "what are internship benefits?",
  "what is 6-month internship fee?",
  "who is eligible for internship?",
  "what is internship stipend?",
  
  // COMPANY & CONTACT & FOUNDER & PLACEMENT
  "what is weinterm?",
  "who is ceo of weintern?",
  "where is weintern located?",
  "do i get a certificate from course?",
  "what is weintern mission?",
  "is placement guarantee provided?",
  "how to contact mentor?"
];

console.log("================ STARTING 35 INTENT & RETRIEVAL AUDIT TEST SUITE ================\n");

let passedCount = 0;

testQueries.forEach((rawQ, i) => {
  const sanitized = sanitizeMessage(rawQ);
  const intent = detectIntent(sanitized);
  const kb = searchKnowledgeBase(sanitized);
  const topMatch = kb.matches[0];
  
  const isCourseListQuery = /what courses|which courses|list of courses|courses available|courses provided|courses offer|programs do you have|what can i learn|list all/i.test(rawQ);
  const isMasterCourseAnswer = topMatch?.answer?.includes("Full Stack") && topMatch?.answer?.includes("Python");
  
  let passed = false;
  if (isCourseListQuery) {
    passed = topMatch && (isMasterCourseAnswer || topMatch.question.toLowerCase().includes("courses") || topMatch.question.toLowerCase().includes("learn"));
  } else {
    passed = topMatch && topMatch.score >= 18;
  }

  if (passed) passedCount++;

  console.log(`[TEST ${i + 1}] QUERY: "${rawQ}"`);
  console.log(`  └─ Sanitized: "${sanitized}"`);
  console.log(`  └─ Intent: ${intent.type} | Top Match Cat: ${topMatch?.category} | Score: ${topMatch?.score}`);
  console.log(`  └─ Top Match Q: "${topMatch?.question}"`);
  console.log(`  └─ Top Match Answer Preview: "${topMatch?.answer?.slice(0, 120).replace(/\n/g, " ")}..."`);
  console.log(`  └─ Status: ${passed ? "✅ PASS" : "❌ FAIL"}\n`);
});

console.log(`================ FINAL AUDIT SCORE: ${passedCount}/${testQueries.length} PASSED ================`);

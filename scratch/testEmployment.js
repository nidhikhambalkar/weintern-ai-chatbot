const { searchKnowledgeBase } = require("../backend/services/knowledgeBaseService");
const { detectIntent } = require("../backend/services/intentService");
const { sanitizeMessage } = require("../backend/utils/chatUtils");

const queries = [
  "Can I join as an employee?",
  "Can I join WeIntern as an employee?",
  "Can I work at WeIntern?",
  "Are there job opportunities at WeIntern?",
  "Is WeIntern hiring?",
  "Can I apply for a job at WeIntern?",
  "I want to work for WeIntern",
  "How can I join WeIntern as an employee?",
  "Can I join your company?",
  "Are there full-time opportunities?",
  "Does WeIntern hire interns as employees?",
  "Can I join WeIntern as a fresher?",
  "Can freshers join WeIntern?",
  "Can I work at WeIntern as a fresher?",
  "Does WeIntern hire freshers?",
  "Are there jobs for freshers at WeIntern?",
  "Can a fresher apply for a job at WeIntern?",
  "I am a fresher, can I join WeIntern?",
  "I have no experience, can I join?",
  "Can I join WeIntern without experience?",
  "Are freshers eligible to work at WeIntern?",
  "How can a fresher apply to WeIntern?",
  "Can I join WeIntern as an employee after graduation?",
  "Can interns become employees at WeIntern?",
  "Is there a full-time opportunity for freshers?",
  "Does WeIntern offer full-time jobs?",
  "How can I apply for a job at WeIntern?"
];

let passCount = 0;

queries.forEach((q, i) => {
  const sanitized = sanitizeMessage(q);
  const intent = detectIntent(sanitized);
  const kb = searchKnowledgeBase(sanitized);
  const topCat = kb.matches[0]?.category;
  const isEmploymentCat = topCat === "employment";
  
  if (isEmploymentCat) passCount++;

  console.log(`[Q${i+1}] "${q}"`);
  console.log(`  Intent: ${intent.type} | Top Match Cat: ${topCat}`);
  console.log(`  Top Match Q: ${kb.matches[0]?.question}`);
  console.log(`  Status: ${isEmploymentCat ? "✅ PASS" : "❌ FAIL"}\n`);
});

console.log(`================ FINAL EMPLOYMENT SUITE SCORE: ${passCount}/${queries.length} PASSED ================`);

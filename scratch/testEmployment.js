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
  "Does WeIntern hire interns as employees?"
];

queries.forEach((q, i) => {
  const sanitized = sanitizeMessage(q);
  const intent = detectIntent(sanitized);
  const kb = searchKnowledgeBase(sanitized);
  console.log(`[Q${i+1}] "${q}"`);
  console.log(`  Intent: ${intent.type}`);
  console.log(`  Top Match Category: ${kb.matches[0]?.category}`);
  console.log(`  Top Match Question: ${kb.matches[0]?.question}`);
  console.log(`  Top Match Answer: ${kb.matches[0]?.answer?.slice(0, 100)}...\n`);
});

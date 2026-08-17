const { sanitizeMessage } = require("../backend/utils/chatUtils");
const { detectIntent } = require("../backend/services/intentService");
const { searchKnowledgeBase } = require("../backend/services/knowledgeBaseService");

const testCases = [
  "what is weintern",
  "what is weinterm",
  "what is weintrn",
  "what is we intrn",
  "weintern kya hai",
  "what does weintern do",
  "what is weimterm",
  "what is vington",
  "what is weintarn",
  "what is weinternn"
];

console.log("=== TESTING WEINTERN SPELLING VARIATIONS ===");
testCases.forEach((q) => {
  const sanitized = sanitizeMessage(q);
  const intent = detectIntent(sanitized);
  const kb = intent.type === "weintern" ? searchKnowledgeBase(sanitized) : null;
  const topAnswer = kb?.matches?.[0]?.question || "NO KB MATCH";
  const score = kb?.matches?.[0]?.score || 0;
  console.log(`Query: "${q}" -> Sanitized: "${sanitized}" | Intent: ${intent.type} | Score: ${score} | Top Match Q: "${topAnswer}"`);
});

const { searchKnowledgeBase } = require('../services/knowledgeBaseService');

console.log('====================================================');
console.log('       PAYMENT INTENT RETRIEVAL & RANKING TEST       ');
console.log('====================================================\n');

const PAYMENT_TEST_QUERIES = [
  { query: "How to make payment?", expectedAnswerKeyword: "Razorpay" },
  { query: "How do I pay?", expectedAnswerKeyword: "Razorpay" },
  { query: "Payment kaise kare?", expectedAnswerKeyword: "Razorpay" },
  { query: "How can I pay fees?", expectedAnswerKeyword: "Razorpay" },
  { query: "Payment options?", expectedAnswerKeyword: "Razorpay" },
  { query: "Razorpay?", expectedAnswerKeyword: "Razorpay" },
  { query: "Bank transfer?", expectedAnswerKeyword: "bank transfer" },
  { query: "EMI?", expectedAnswerKeyword: "EMI" },
  { query: "Razorpay payment options", expectedAnswerKeyword: "Razorpay" },
  { query: "Bank transfer details for payment", expectedAnswerKeyword: "bank transfer" },
  { query: "UPI payment options", expectedAnswerKeyword: "UPI" },
  { query: "fees kaise de?", expectedAnswerKeyword: "Razorpay" }
];

let passed = 0;
let failed = 0;

PAYMENT_TEST_QUERIES.forEach((item, idx) => {
  const res = searchKnowledgeBase(item.query);
  const top = res.matches && res.matches[0];
  const isMatch = top && top.answer.toLowerCase().includes(item.expectedAnswerKeyword.toLowerCase()) && top.category !== 'company';

  if (isMatch) {
    passed++;
    console.log(`[PASS] #${idx + 1} Query: "${item.query}"`);
    console.log(`  Matched Q:      "${top.question}"`);
    console.log(`  Category:       ${top.category} | Score: ${top.score}`);
    console.log(`  Answer Excerpt: "${top.answer.substring(0, 90).replace(/\n/g, ' ')}..."`);
  } else {
    failed++;
    console.log(`[FAIL] #${idx + 1} Query: "${item.query}"`);
    console.log(`  Matched Q:      "${top ? top.question : 'NONE'}"`);
    console.log(`  Category:       ${top ? top.category : 'NONE'} | Score: ${top ? top.score : 0}`);
    console.log(`  Got Answer:     "${top ? top.answer.substring(0, 90).replace(/\n/g, ' ') : 'NONE'}..."`);
  }
  console.log('----------------------------------------------------');
});

console.log('\n====================================================');
console.log('         PAYMENT INTENT TEST SUMMARY                ');
console.log('====================================================');
console.log(`Total Test Queries:   ${PAYMENT_TEST_QUERIES.length}`);
console.log(`Passed Matches:       ${passed}`);
console.log(`Failed Matches:       ${failed}`);
console.log(`Accuracy Rate:        ${((passed / PAYMENT_TEST_QUERIES.length) * 100).toFixed(2)}%`);
console.log('====================================================\n');

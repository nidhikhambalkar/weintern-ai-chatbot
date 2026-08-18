const fs = require('fs');
const path = require('path');

const feesPath = path.join(__dirname, '..', 'knowledge-base', 'json', 'fees.json');
const faqPath = path.join(__dirname, '..', 'knowledge-base', 'json', 'faq.json');

const APPROVED_PAYMENT_ANSWER = "WeIntern accepts program fee payments online through Razorpay, which supports UPI (Google Pay, PhonePe, Paytm, BHIM), Debit Cards, Credit Cards, and Net Banking. EMI options are available for the 6-Month Program (₹6,599) in a 30:40:30 ratio (30% at enrollment, 40% midpoint, 30% at end). For direct bank transfer details or payment queries, contact support at +91 74149 74582 (WhatsApp) or contact@we-intern.in.";

const PAYMENT_VARIATIONS = [
  "How to make payment?",
  "How do I pay?",
  "Payment kaise kare?",
  "How can I pay fees?",
  "What payment options are available?",
  "What payment methods are accepted?",
  "Can I pay via Razorpay?",
  "Can I pay via Bank transfer?",
  "Is EMI available for fee payment?",
  "How to pay internship fee?",
  "Fee payment options",
  "Razorpay payment",
  "Bank transfer details for payment",
  "UPI payment options",
  "GPay PhonePe Paytm payment",
  "fees kaise de?",
  "fees kaise pay kare?"
];

function updateJsonFile(filePath) {
  let items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const existingQs = new Set(items.map(i => i.question.toLowerCase().trim()));
  let updatedCount = 0;
  let addedCount = 0;

  PAYMENT_VARIATIONS.forEach(qText => {
    const normQ = qText.toLowerCase().trim();
    const existingItem = items.find(i => i.question.toLowerCase().trim() === normQ);
    if (existingItem) {
      if (existingItem.answer !== APPROVED_PAYMENT_ANSWER) {
        existingItem.answer = APPROVED_PAYMENT_ANSWER;
        updatedCount++;
      }
    } else {
      items.push({
        category: "fees",
        question: qText,
        answer: APPROVED_PAYMENT_ANSWER
      });
      existingQs.add(normQ);
      addedCount++;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
  return { updatedCount, addedCount, total: items.length };
}

const resFees = updateJsonFile(feesPath);
const resFaq = updateJsonFile(faqPath);

console.log('====================================================');
console.log('       PAYMENT FAQS JSON UPDATE COMPLETE            ');
console.log('====================================================');
console.log(`fees.json: Updated ${resFees.updatedCount}, Added ${resFees.addedCount}, Total ${resFees.total}`);
console.log(`faq.json:  Updated ${resFaq.updatedCount}, Added ${resFaq.addedCount}, Total ${resFaq.total}`);
console.log('====================================================\n');

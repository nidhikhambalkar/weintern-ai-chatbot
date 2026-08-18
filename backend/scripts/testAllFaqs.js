const fs = require('fs');
const path = require('path');
const { searchKnowledgeBase } = require('../services/knowledgeBaseService');

const dir = path.join(__dirname, '..', 'knowledge-base', 'json');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let totalFaqs = 0;
let correct = 0;
let mismatches = 0;
const mismatchList = [];

console.log('====================================================');
console.log('       FULL AUTOMATED FAQ RETRIEVAL TEST           ');
console.log('====================================================\n');

files.forEach(fileName => {
  const filePath = path.join(dir, fileName);
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  items.forEach((item, index) => {
    totalFaqs++;
    const res = searchKnowledgeBase(item.question);
    const topMatch = res.matches && res.matches[0];
    if (topMatch && (topMatch.answer === item.answer || topMatch.question === item.question)) {
      correct++;
    } else {
      mismatches++;
      if (mismatchList.length < 20) {
        mismatchList.push({
          file: fileName,
          index,
          q: item.question,
          expectedA: item.answer.substring(0, 50),
          gotQ: topMatch ? topMatch.question : 'NONE',
          gotA: topMatch ? topMatch.answer.substring(0, 50) : 'NONE',
          score: topMatch ? topMatch.score : 0
        });
      }
    }
  });
});

console.log('SUMMARY REPORT:');
console.log(`- Total FAQs Loaded: ${totalFaqs}`);
console.log(`- Total FAQs Tested: ${totalFaqs}`);
console.log(`- Correct Matches:   ${correct}`);
console.log(`- Mismatches:        ${mismatches}`);
console.log(`- Accuracy Rate:     ${((correct / totalFaqs) * 100).toFixed(2)}%\n`);

if (mismatchList.length > 0) {
  console.log('SAMPLE MISMATCHES:');
  console.log(JSON.stringify(mismatchList, null, 2));
}

console.log('\n----------------------------------------------------');
console.log('     USER EXAMPLE SPECIFIC QUERIES VERIFICATION     ');
console.log('----------------------------------------------------');

const userExamples = [
  "Do you provide recorded sessions?",
  "what ui/ux include?",
  "What are the courses you provide?",
  "Can freshers join WeIntern?",
  "Does WeIntern conduct webinars?",
  "What are internship benefits?",
  "What is the Data Science fee?",
  "Do I get a certificate?"
];

userExamples.forEach(q => {
  const res = searchKnowledgeBase(q);
  const top = res.matches && res.matches[0];
  console.log(`\nQuery: "${q}"`);
  console.log(`- Matched Question: ${top ? top.question : 'NONE'}`);
  console.log(`- Matched Category: ${top ? top.category : 'NONE'}`);
  console.log(`- Match Score:      ${top ? top.score : 0}`);
  console.log(`- Answer Excerpt:   ${top ? top.answer.replace(/\n/g, ' ').substring(0, 100) : 'NONE'}...`);
});

console.log('\n====================================================\n');

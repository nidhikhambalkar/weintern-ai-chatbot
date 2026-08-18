const { searchKnowledgeBase } = require('../services/knowledgeBaseService');
const { detectIntent } = require('../services/intentService');

const queries = [
  'Who are you?',
  'Who are you exactly?',
  'What are you?',
  'Introduce yourself.',
  'Tell me about yourself.',
  'What can you do?',
  'Are you a WeIntern chatbot?',
  'What is this chatbot?',
  'Aap kaun ho?',
  'Tu kon ahes?',
  'What is WeIntern?',
  'What is WeIntern company?',
  'Tell me about WeIntern',
  'Who is WeIntern?'
];

console.log('=== BOT IDENTITY VS COMPANY OVERVIEW TEST ===\n');

let pass = 0;
let fail = 0;

queries.forEach((q) => {
  const intent = detectIntent(q);
  const kb = searchKnowledgeBase(q);
  const isBotQuery = !q.toLowerCase().includes('what is weintern') && !q.toLowerCase().includes('tell me about weintern') && !q.toLowerCase().includes('who is weintern');

  console.log(`Query: "${q}"`);
  console.log(`  Intent: ${intent.type}`);
  if (intent.response) console.log(`  Intent Response: ${intent.response}`);
  console.log(`  KB Top Match: ${kb.topMatch ? kb.topMatch.question : 'None'}`);
  console.log(`  KB Score: ${kb.topMatch ? kb.topMatch.score : 0}`);
  console.log(`  KB Answer: ${kb.topMatch ? kb.topMatch.answer.substring(0, 110).replace(/\n/g, ' ') + '...' : 'None'}`);

  if (isBotQuery) {
    if (intent.type === 'bot_identity' || (kb.topMatch && kb.topMatch.answer.includes('WeIntern AI Assistant'))) {
      pass++;
      console.log('  -> ✅ CORRECT BOT IDENTITY');
    } else {
      fail++;
      console.log('  -> ❌ FAILED BOT IDENTITY');
    }
  } else {
    if (kb.topMatch && kb.topMatch.answer.includes('EdTech') && (kb.topMatch.question.includes('WeIntern') || kb.topMatch.question.includes('What is WeIntern'))) {
      pass++;
      console.log('  -> ✅ CORRECT COMPANY OVERVIEW');
    } else {
      fail++;
      console.log('  -> ❌ FAILED COMPANY OVERVIEW');
    }
  }
  console.log();
});

console.log(`--- Test Finished: Passed ${pass}/${queries.length}, Failed: ${fail} ---`);

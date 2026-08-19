const { searchKnowledgeBase } = require('../services/knowledgeBaseService');

console.log('====================================================');
console.log('       DOMAIN TECH STACK FAQ RETRIEVAL TEST         ');
console.log('====================================================\n');

const DOMAIN_TEST_SUITE = [
  // User Prompt Examples
  { query: "What are the technologies used in UI/UX?", expectedKeyword: "Figma" },
  { query: "ui ux technologies", expectedKeyword: "Figma" },
  { query: "what tools in ui ux?", expectedKeyword: "Figma" },
  { query: "ui ux mein kya sikhoge?", expectedKeyword: "Figma" },
  { query: "data science tech stack?", expectedKeyword: "Pandas" },
  { query: "full stack technologies?", expectedKeyword: "React" },
  { query: "cloud mein kya technologies hain?", expectedKeyword: "AWS" },
  { query: "marketing tools?", expectedKeyword: "Google Ads" },
  { query: "python mein kya use hota hai?", expectedKeyword: "Python" },
  { query: "mobile app ka tech stack?", expectedKeyword: "Flutter" },

  // 10 Domains Standard Queries
  { query: "Full Stack Web Development technologies?", expectedKeyword: "React" },
  { query: "what tools are used in Full Stack Web Development?", expectedKeyword: "Node.js" },
  { query: "Full Stack Web Development tech stack?", expectedKeyword: "MongoDB" },
  { query: "what will I learn in Full Stack Web Development?", expectedKeyword: "HTML" },

  { query: "Mobile App Development technologies?", expectedKeyword: "Flutter" },
  { query: "what tools are used in Mobile App Development?", expectedKeyword: "Firebase" },
  { query: "Mobile App Development tech stack?", expectedKeyword: "Dart" },
  { query: "what will I learn in Mobile App Development?", expectedKeyword: "Flutter" },

  { query: "AI & Automation technologies?", expectedKeyword: "OpenAI" },
  { query: "what tools are used in AI & Automation?", expectedKeyword: "n8n" },
  { query: "AI & Automation tech stack?", expectedKeyword: "LangChain" },

  { query: "Data Science & Analytics technologies?", expectedKeyword: "Pandas" },
  { query: "what tools are used in Data Science & Analytics?", expectedKeyword: "Tableau" },
  { query: "Data Science & Analytics tech stack?", expectedKeyword: "SQL" },

  { query: "Python Programming technologies?", expectedKeyword: "Python" },
  { query: "what tools are used in Python Programming?", expectedKeyword: "OOP" },

  { query: "Java Programming technologies?", expectedKeyword: "Java" },
  { query: "what tools are used in Java Programming?", expectedKeyword: "JDBC" },

  { query: "C/C++ Programming technologies?", expectedKeyword: "C++" },
  { query: "what tools are used in C/C++ Programming?", expectedKeyword: "DSA" },

  { query: "Cloud Computing & DevOps technologies?", expectedKeyword: "Docker" },
  { query: "what tools are used in Cloud Computing & DevOps?", expectedKeyword: "Kubernetes" },

  { query: "UI/UX Design technologies?", expectedKeyword: "Figma" },
  { query: "what tools are used in UI/UX Design?", expectedKeyword: "Adobe XD" },

  { query: "Digital Marketing & SEO technologies?", expectedKeyword: "Google Ads" },
  { query: "what tools are used in Digital Marketing & SEO?", expectedKeyword: "Canva" }
];

let passCount = 0;
let failCount = 0;

DOMAIN_TEST_SUITE.forEach((item, idx) => {
  const res = searchKnowledgeBase(item.query);
  const top = res.matches && res.matches[0];
  const isMatch = top && top.answer.toLowerCase().includes(item.expectedKeyword.toLowerCase());

  if (isMatch) {
    passCount++;
    console.log(`[PASS] #${idx + 1} Query: "${item.query}"`);
    console.log(`  Matched Q:      "${top.question}"`);
    console.log(`  Category:       ${top.category} | Score: ${top.score}`);
    console.log(`  Answer Excerpt: "${top.answer.substring(0, 90).replace(/\n/g, ' ')}..."`);
  } else {
    failCount++;
    console.log(`[FAIL] #${idx + 1} Query: "${item.query}"`);
    console.log(`  Matched Q:      "${top ? top.question : 'NONE'}"`);
    console.log(`  Category:       ${top ? top.category : 'NONE'} | Score: ${top ? top.score : 0}`);
    console.log(`  Expected KW:    "${item.expectedKeyword}"`);
    console.log(`  Got Answer:     "${top ? top.answer.substring(0, 90).replace(/\n/g, ' ') : 'NONE'}..."`);
  }
  console.log('----------------------------------------------------');
});

console.log('\n====================================================');
console.log('         DOMAIN TECH STACK TEST SUMMARY             ');
console.log('====================================================');
console.log(`Total Test Queries:   ${DOMAIN_TEST_SUITE.length}`);
console.log(`Passed Matches:       ${passCount}`);
console.log(`Failed Matches:       ${failCount}`);
console.log(`Accuracy Rate:        ${((passCount / DOMAIN_TEST_SUITE.length) * 100).toFixed(2)}%`);
console.log('====================================================\n');

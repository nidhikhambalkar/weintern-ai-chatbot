const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'knowledge-base', 'json');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const domains = [
  "Full Stack",
  "Mobile App",
  "AI & Automation",
  "Data Science",
  "Python",
  "Java",
  "C/C++",
  "Cloud",
  "UI/UX",
  "Digital Marketing"
];

domains.forEach(d => {
  console.log(`\n====================================================`);
  console.log(` SEARCHING FOR TECH STACK DETAILS: ${d}`);
  console.log(`====================================================`);
  files.forEach(f => {
    const filePath = path.join(dir, f);
    const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    items.forEach((item, idx) => {
      const q = item.question || '';
      const a = item.answer || '';
      const textCombined = (q + " " + a).toLowerCase();
      if (textCombined.includes(d.toLowerCase())) {
        if (textCombined.includes('cover') || textCombined.includes('tool') || textCombined.includes('technolog') || textCombined.includes('stack') || textCombined.includes('include') || textCombined.includes('learn') || textCombined.includes('framework') || textCombined.includes('language')) {
          console.log(`[File: ${f} | Index: ${idx}]`);
          console.log(`  Question: "${q}"`);
          console.log(`  Answer:   "${a.replace(/\n/g, ' ')}"`);
          console.log(`----------------------------------------------------`);
        }
      }
    });
  });
});

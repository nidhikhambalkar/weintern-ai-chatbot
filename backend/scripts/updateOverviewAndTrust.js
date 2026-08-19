const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'knowledge-base', 'json');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const APPROVED_OVERVIEW_ANSWER = `WeIntern is an EdTech career development platform designed to help students, beginners, and freshers build real-world, industry-ready skills.

Key Highlights:
🚀 Learn → Build → Work → Earn Model — Combine structured domain training, hands-on live projects, team internship work, and performance-based stipend opportunities up to ₹10,000.
📚 Comprehensive Programs — Offers industry-oriented training in Full Stack Web Development, Mobile App Development, AI & Automation, Data Science & Analytics, Python, Java, C/C++, UI/UX Design, Cloud Computing, and Digital Marketing.
👨‍🏫 Mentor & Career Support — Dedicated guidance from experienced domain mentors, doubt resolution, resume building, and placement preparation.
📜 Recognized Credentials — Official verified certificates backed by recognitions and associations including MSME (Government of India), NSDC, Skill India Mission, Ministry of Skill Development & Entrepreneurship, AICTE, Google Partner, AWS, and ISO 9001:2015 certification.`;

const APPROVED_TRUST_ANSWER = "WeIntern has recognitions, certifications, and industry associations across government, skill development, education, and technology, including the Ministry of MSME, Government of India; NSDC; Skill India Mission; Ministry of Skill Development & Entrepreneurship; AICTE; Google Partner; AWS; and ISO 9001:2015 certification. These credentials and associations demonstrate its focus on structured skill development, industry-relevant learning, and professional standards.";

const OVERVIEW_QUESTIONS = [
  "Tell me about WeIntern",
  "Give me information about WeIntern",
  "What is WeIntern?",
  "What does WeIntern do?",
  "Explain WeIntern",
  "WeIntern ke baare mein batao",
  "WeIntern kya hai?",
  "WeIntern ke bare mein information do",
  "weintern info",
  "info about weintern",
  "information about weintern",
  "who is weintern",
  "who are weintern",
  "tell me about weintern."
];

const TRUST_QUESTIONS = [
  "Why should I trust WeIntern?",
  "Is WeIntern a trusted organization?",
  "What recognitions does WeIntern have?",
  "What certifications does WeIntern have?",
  "Is WeIntern government recognized?",
  "Which government organizations recognize WeIntern?",
  "Does WeIntern have any industry recognition?",
  "What government and industry associations does WeIntern have?",
  "What makes WeIntern trustworthy?",
  "How can I verify WeIntern's credibility?",
  "Does WeIntern have any official certifications?",
  "Is WeIntern associated with recognized organizations?",
  "What organizations is WeIntern associated with?",
  "Does WeIntern have any government affiliations?",
  "Does WeIntern have any technology industry associations?",
  "What proof of recognition does WeIntern have?",
  "What makes WeIntern different and trustworthy?",
  "Are WeIntern's programs backed by recognized organizations?",
  "Does WeIntern have any certifications or partnerships?",
  "Can I trust WeIntern before enrolling?",
  "What credentials does WeIntern have?",
  "Is WeIntern certified or recognized?",
  "Which organizations are connected with WeIntern?",
  "What official recognitions does WeIntern have?",
  "Why should students trust WeIntern?",
  "WeIntern ke paas kaunse recognitions hain?",
  "WeIntern genuine hai kya?",
  "WeIntern ko kaun kaun recognize karta hai?",
  "WeIntern ki credibility kya hai?",
  "WeIntern ke certifications kya hain?",
  "WeIntern par trust kyu kare?",
  "WeIntern ke government aur industry associations kaunse hain?",
  "Kya WeIntern government recognized hai?",
  "Student WeIntern par trust kaise kare?",
  "WeIntern ke paas kya official recognition hai?",
  "Is WeIntern genuine?",
  "Is WeIntern genuine",
  "Is WeIntern a legitimate and trustworthy platform for internships?",
  "weintern genuine?",
  "government recognition?",
  "why trust?",
  "what makes you legit?",
  "who recognizes weintern?",
  "why trust weintern?"
];

const overviewSet = new Set(OVERVIEW_QUESTIONS.map(q => q.toLowerCase().trim()));
const trustSet = new Set(TRUST_QUESTIONS.map(q => q.toLowerCase().trim()));

let updatedCount = 0;
let addedCount = 0;

files.forEach(f => {
  const filePath = path.join(dir, f);
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  items.forEach(item => {
    const qNorm = item.question.toLowerCase().trim();
    if (overviewSet.has(qNorm)) {
      if (item.answer !== APPROVED_OVERVIEW_ANSWER) {
        item.answer = APPROVED_OVERVIEW_ANSWER;
        updatedCount++;
        modified = true;
      }
    } else if (trustSet.has(qNorm) || /\b(is weintern genuine|weintern genuine hai|why trust weintern|why should i trust weintern|what makes you legit|who recognizes weintern|government recognition\?*|why trust\?*)\b/i.test(qNorm)) {
      if (item.answer !== APPROVED_TRUST_ANSWER) {
        item.answer = APPROVED_TRUST_ANSWER;
        updatedCount++;
        modified = true;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
  }
});

// Ensure ALL OVERVIEW_QUESTIONS and TRUST_QUESTIONS exist in company.json
const companyPath = path.join(dir, 'company.json');
const companyItems = JSON.parse(fs.readFileSync(companyPath, 'utf8'));
const existingCompanyQs = new Set(companyItems.map(item => item.question.toLowerCase().trim()));

OVERVIEW_QUESTIONS.forEach(q => {
  const qNorm = q.toLowerCase().trim();
  if (!existingCompanyQs.has(qNorm)) {
    companyItems.push({
      category: 'company',
      question: q,
      answer: APPROVED_OVERVIEW_ANSWER
    });
    existingCompanyQs.add(qNorm);
    addedCount++;
  }
});

TRUST_QUESTIONS.forEach(q => {
  const qNorm = q.toLowerCase().trim();
  if (!existingCompanyQs.has(qNorm)) {
    companyItems.push({
      category: 'company',
      question: q,
      answer: APPROVED_TRUST_ANSWER
    });
    existingCompanyQs.add(qNorm);
    addedCount++;
  }
});

fs.writeFileSync(companyPath, JSON.stringify(companyItems, null, 2), 'utf8');

console.log('====================================================');
console.log('  OVERVIEW & TRUST FAQs UPDATE AND AUDIT COMPLETE   ');
console.log('====================================================');
console.log(`- Existing FAQs Updated with Approved Answers: ${updatedCount}`);
console.log(`- New Unique FAQs Added to company.json:       ${addedCount}`);
console.log('====================================================');

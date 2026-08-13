function getGreetingResponse(rawText) {
  const text = String(rawText).trim();
  const lower = text.toLowerCase();

  // 1. Marathi Greetings
  const isMarathiDevanagari = /कसा\s*काय|कसे\s*आहात|कसा\s*आहेस|कशी\s*आहेस/.test(text) || (/नमस्कार/.test(text) && /कसा|कसे|कशी|मी|तुम्हाला/.test(text));
  const isMarathiLatin = /\b(kasa\s*kay|kase\s*ahat|kasa\s*ahes|kashi\s*ahes|kse\s*ahat|ksa\s*kay)\b/.test(lower);

  if (isMarathiDevanagari || isMarathiLatin) {
    return "नमस्कार! 👋 मी WeIntern AI Assistant आहे. मी तुम्हाला courses, internships, fees, certificates आणि WeIntern ची माहिती मिळवण्यासाठी मदत करण्यास इथे आहे. आज मी तुम्हाला कशी मदत करू शकेन?";
  }

  // 2. Hindi / Hinglish Greetings
  const isHindiDevanagari = /नमस्ते|नमस्कार|प्रणाम|राम\s*राम|सत\s*श्री\s*अकाल|आदाब|कैसे\s*हो|कैसे\s*हैं/.test(text) || /\b(nmste|nmskar|prnam)\b/.test(lower);
  if (isHindiDevanagari) {
    return "नमस्ते! 👋 मैं WeIntern AI Assistant हूँ। मैं आपकी courses, internships, fees, certificates और WeIntern की जानकारी पाने में मदद करने के लिए यहाँ हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?";
  }

  const isHinglish = /\b(namaste|namaskar|pranam|ram\s*ram|sat\s*sri\s*akal|satsriakal|adab|kaise\s*ho|kaise\s*hain|kya\s*hal\s*hai|sab\s*badiya)\b/.test(lower);
  if (isHinglish) {
    return "Namaste! 👋 Main WeIntern AI Assistant hoon. Main aapki courses, internships, fees, certificates aur WeIntern ki information me help karne ke liye yahan hoon. Aaj main aapki kya madad kar sakta hoon?";
  }

  // 3. English / Default Greeting Response
  return "Hi! 👋 I’m the WeIntern AI Assistant. I’m here to help you with courses, internships, fees, certificates, and other WeIntern information. How can I help you today?";
}

function detectIntent(message = "") {
  const rawText = String(message).trim();
  const lower = rawText.toLowerCase();

  const latinGreetingRegex = /^(hi+|hello+|hey+|hlo|good\s*morning|good\s*afternoon|good\s*evening|yo|sup|namaste|namaskar|pranam|ram\s*ram|satsriakal|adab|kaise\s*ho|kasa\s*kay|kase\s*ahat|nmste|nmskar|prnam|kse\s*ahat|ksa\s*kay)\b/i;
  const devanagariGreetingRegex = /^(नमस्ते|नमस्कार|प्रणाम|राम\s*राम|सत\s*श्री\s*अकाल|आदाब|कैसे\s*हो|कसा\s*काय|कसे\s*आहात|कसा\s*आहेस|कशी\s*आहेस)/;

  const hasGreetingStart = latinGreetingRegex.test(lower) || devanagariGreetingRegex.test(rawText);
  const words = lower.replace(/[^a-z0-9\u0900-\u097f\s]/g, "").split(/\s+/).filter(Boolean);

  const questionKeywords = [
    "fee", "fees", "price", "cost", "duration", "weeks", "months", "apply", "register",
    "registration", "enroll", "placement", "stipend", "certificate", "certification",
    "lor", "syllabus", "project", "projects", "contact", "phone", "email", "refund", "emi",
    "fullstack", "full stack", "python", "java", "devops", "cloud", "ai", "datascience"
  ];
  const hasQuestionKeyword = questionKeywords.some(kw => lower.includes(kw));

  if (hasGreetingStart && (!hasQuestionKeyword || words.length <= 3)) {
    return {
      type: "greeting",
      response: getGreetingResponse(rawText),
    };
  }

  // WeIntern-related keywords
  const weinternKeywords = [
    "weintern",
    "internship",
    "course",
    "courses",
    "program",
    "training",
    "mentor",
    "certificate",
    "certification",
    "placement",
    "resume",
    "interview",
    "fees",
    "fee",
    "emi",
    "payment",
    "refund",
    "domain",
    "full stack",
    "fullstack",
    "python",
    "java",
    "ai",
    "ml",
    "data science",
    "ui ux",
    "ui/ux",
    "digital marketing",
    "cyber security",
    "cloud",
    "orientation",
    "google meet",
    "support",
    "contact",
    "eligibility",
    "register",
    "registration",
    "apply",
    "join",
    "live project",
    "project",
    "intern",
    "interns",
    "interning",
    "stipend",
    "salary",
    "earn",
    "price",
    "cost",
    "charges",
    "duration",
    "weeks",
    "months",
    "time",
    "syllabus",
    "location",
    "whatsapp",
    "number",
    "office",

  // Internship
  "internship",
  "intern",
  "program",
  "training",
  "live project",
  "project",
  "projects",
  "task",
  "assignment",

  // Courses
  "course",
  "courses",
  "domain",
  "domains",
  "full stack",
  "fullstack",
  "web development",
  "python",
  "java",
  "ai",
  "machine learning",
  "ml",
  "data science",
  "ui ux",
  "ui/ux",
  "digital marketing",
  "cyber security",
  "cloud computing",

  // Fees
  "fee",
  "fees",
  "payment",
  "pay",
  "emi",
  "discount",
  "refund",
  "scholarship",

  // Placement
  "placement",
  "resume",
  "interview",
  "mock interview",
  "linkedin",
  "certificate",
  "certification",

  // Support
  "mentor",
  "support",
  "contact",
  "email",
  "whatsapp",
  "orientation",
  "google meet",

  // Registration
  "register",
  "registration",
  "enroll",
  "apply",
  "joining",

  // Eligibility
  "eligible",
  "eligibility",
  "fresher",
  "beginner",
  "student",

  // Duration
  "duration",
  "month",
  "months",
  "3 month",
  "6 month",

  // C/C++
"c",
"c++",
"c/c++",
"programming",
"coding",
"compiler",
"gcc",
"mingw",
"codeblocks",
"code::blocks",
"visual studio code",
"vscode",
"ide",
"data structures",
"algorithms",
"dsa",

// Java
"core java",
"spring",
"spring boot",
"jdbc",
"multithreading",

// Python
"automation",
"api",
"oop",
"file handling",

// AI
"prompt engineering",
"llm",
"langchain",
"rag",
"chatbot",

// Cloud
"aws",
"ec2",
"s3",
"docker",
"kubernetes",
"jenkins",
"terraform",
"ansible"
];

  const isWeIntern = weinternKeywords.some((keyword) =>
    lower.includes(keyword)
  );

  if (isWeIntern) {
    return {
      type: "weintern",
    };
  }

  // Out of domain
  return {
    type: "out-of-domain",
    response:
      "I'm the WeIntern Assistant. I can answer questions only about WeIntern internships, courses, fees, certifications, placements, mentor support, and related topics.",
  };
}

module.exports = {
  detectIntent,
};
const fs = require("fs");
const path = require("path");

const KB_DIR = path.join(__dirname, "..", "knowledge-base", "json");
const TOKEN_MAP = {
  kya: "what",
  kaise: "how",
  kitna: "how much",
  kitne: "how many",
  kis: "which",
  kise: "whom",
  kiske: "whose",
  kyun: "why",
  kab: "when",
  kaun: "who",
  konsa: "which",
  konsi: "which",
  milta: "get",
  milte: "get",
  milega: "get",
  hoga: "will",
  lagega: "will",
  support: "support",
  fees: "fees",
  fee: "fees",
  internship: "internship",
  intership: "internship",
  course: "course",
  courses: "course",
  certificate: "certificate",
  certificates: "certificate",
  placement: "placement",
  policy: "policy",
  policies: "policy",
  practical: "project",
  project: "project",
  projects: "project",
  assignment: "project",
  assignments: "project",
  task: "project",
  tasks: "project",
  mentor: "mentor",
  mentors: "mentor",
  guidance: "mentor",
  doubt: "support",
  help: "support",
  samjhao: "explain",
  explain: "explain",
  jaana: "know",
  jaane: "know",
  baare: "about",
  par: "",
  ke: "",
  me: "",
  ko: "",
  bhi: "",
  hua: "",
  karna: "",
  karne: "",
  hai: "",
  hain: "",
  nahi: "not",
  refund: "fees",
  payment: "fees",
  pay: "fees",
  upi: "fees",
  emi: "fees",
  scholarship: "fees",
  scholarships: "fees",
 
  interviews: "placement",
  
  jobs: "placement",
  rules: "policy",
  terms: "policy",
  conditions: "policy",
  complaint: "contact",
  escalation: "contact",
  whatsapp: "contact",
  email: "contact",
  contact: "contact",
  cert: "certificate",
  lor: "certificate",              // Letter of Recommendation → certificates
  recommendation: "certificate",  // "letter of recommendation" → certificates
  letter: "certificate",          // "letter" alone → certificates context
  "training certificate": "certificate",
  // Orientation & Meet
  orientation: "orientation",
  orient: "orientation",
  meet: "orientation",
  google: "orientation",
  link: "orientation",
  zoom: "orientation",
  joining: "orientation",
  session: "orientation",
  // Duration
  duration: "duration",
  kitne: "duration",
  months: "duration",
  month: "duration",
  mahine: "duration",
  mahina: "duration",
  weeks: "duration",
  week: "duration",
  long: "duration",
  // Eligibility
  eligible: "eligibility",
  eligibility: "eligibility",
  criteria: "eligibility",
  qualify: "eligibility",
  qualification: "eligibility",
  fresher: "eligibility",
  freshers: "eligibility",
  beginner: "eligibility",
  beginners: "eligibility",
  anyone: "eligibility",
  stream: "eligibility",
  // Registration
  register: "registration",
  registration: "registration",
  enroll: "registration",
  enrollment: "registration",
  apply: "registration",
  application: "registration",
  signup: "registration",
  sign: "registration",
  // Domains
  domain: "domains",
  domains: "domains",
  fullstack: "domains",
  aiml: "domains",
  datascience: "domains",
  python: "domains",
  java: "domains",
  uiux: "domains",
  marketing: "domains",
  cybersecurity: "domains",
  cloud: "domains",
  // Stipend / EMI / Guarantee / LinkedIn

  emi: "fees",
  installment: "fees",
  installments: "fees",
  discount: "fees",
  guarantee: "placement",
  guaranteed: "placement",
  "100%": "placement",
  linkedin: "placement",
  profile: "placement",

  // C/C++ synonyms
c: "c",
cpp: "c++",
cplusplus: "c++",
"c++": "c++",

tool: "ide",
tools: "ide",
ide: "ide",
editor: "ide",
compiler: "compiler",
compilers: "compiler",

develop: "development",
development: "development",
coding: "programming",
code: "programming",

vscode: "visual studio code",
visual: "visual",
studio: "studio",
gcc: "gcc",
mingw: "mingw",
codeblocks: "code blocks",
};

const CATEGORY_HINTS = {
  company: ["weintern", "company", "about weintern", "tell me about weintern"],
  courses: ["course", "courses", "program", "learn", "training", "skill"],
  benefits: ["benefit", "benefits", "mentor", "mentor support", "doubt", "class", "recorded", "network", "soft skill", "softskills"],
  internship: ["internship", "intern", "onboarding", "attendance", "team", "selection", "daily task", "live project", "project", "register", "enroll", "apply", "payment", "pay", "upi", "eligible", "fresher", "beginner", "how long", "how many months"],
  certificates: ["certificate", "certification", "verify", "validity", "lor", "letter", "recommendation", "training certificate", "linkedin"],
  certification: ["certificate", "certification", "verify", "validity", "lor", "letter", "recommendation", "training certificate", "linkedin"],
  placement: ["placement", "resume", "interview", "mock", "job", "career", "hire", "linkedin", "profile"],
  fees: ["fees", "fee", "discount", "scholarship", "emi", "refund", "price"],
  contact: ["contact", "support", "helpdesk", "whatsapp", "email", "complaint", "escalation", "reach", "office hours", "phone", "number"],
  policies: ["policy", "terms", "conditions", "privacy", "conduct", "attendance", "rules"],
  orientation: ["orientation", "orient", "google meet", "meet link", "link", "joining link", "session date", "session time", "when is orientation", "what time"],
  domains: ["domain", "domains", "which domain", "full stack", "ai ml", "data science", "python", "java", "ui ux", "digital marketing", "cyber security", "cloud computing", "what domain"],
  eligibility: ["eligible", "eligibility", "criteria", "qualification", "fresher", "beginner", "who can join", "can i join", "minimum", "stream"],
  duration: ["duration", "how long", "how many months", "months", "weeks", "long is", "mahine"],
  registration: ["register", "registration", "enroll", "enrollment", "apply", "sign up", "how to join", "steps to apply"],
};

const CATEGORY_KEYWORD_MAP = {
  company: ["weintern", "company", "about weintern", "tell me about weintern","info about weintern",
  "information about weintern",
  "what is weintern",
  "who is weintern",
  "know about weintern",
  "weintern ke baare",
  "weintern kya hai"],
  courses: ["course", "courses", "program", "training", "skill", "learn", "about course", "about courses", "course details", "course information", "program details", "program information", "training details", "training information", "skill development", "learn skills", "learn programming", "learn coding", "learn data science", "learn ai ml", "learn python", "learn java", "learn ui ux", "learn digital marketing", "learn cyber security", "learn cloud computing"],
  benefits: ["benefit", "benefits", "mentor", "doubt", "class", "recorded", "network", "soft skill", "softskills"],
  internship: ["internship", "intern", "onboarding", "attendance", "team", "selection", "daily task", "live project", "project", "register", "enroll", "apply", "payment", "upi", "eligible", "fresher", "beginner"],
  certificates: ["certificate", "certification", "verify", "validity", "lor", "letter", "recommendation", "training certificate", "linkedin"],
  certification: ["certificate", "certification", "verify", "validity", "lor", "letter", "recommendation", "training certificate", "linkedin"],
  placement: ["placement", "resume", "interview", "mock", "job", "career", "hire", "linkedin", "profile"],
  fees: ["fees", "fee", "discount", "scholarship", "emi", "refund", "price"],
  contact: ["contact", "support", "helpdesk", "whatsapp", "email", "complaint", "escalation", "reach", "office hours"],
  policies: ["policy", "terms", "conditions", "privacy", "conduct", "attendance", "rules"],
  orientation: ["orientation", "orient", "meet", "link", "google", "joining", "session"],
  domains: ["domain", "domains", "full stack", "ai ml", "data science", "python", "java", "ui ux", "digital marketing", "cyber security", "cloud computing"],
  eligibility: ["eligible", "eligibility", "criteria", "qualification", "fresher", "beginner", "stream"],
  duration: ["duration", "months", "weeks", "long", "mahine"],
  registration: ["register", "registration", "enroll", "enrollment", "apply"],
};

function normalize(text = "") {
  const cleaned = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  const tokens = cleaned.split(" ").filter(Boolean);
  const translated = tokens.flatMap((token) => {
    const mapped = TOKEN_MAP[token] || token;
    if (!mapped) {
      return [];
    }
    return String(mapped).split(" ");
  });

  const normalized = translated.join(" ").replace(/\s+/g, " ").trim();
  return normalized;
}

function levenshteinDistance(a = "", b = "") {
  const left = String(a).toLowerCase();
  const right = String(b).toLowerCase();
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[left.length][right.length];
}

function fuzzyMatchScore(token, entryTokens) {
  if (!token) return 0;
  let bestScore = 0;

  entryTokens.forEach((entryToken) => {
    if (!entryToken || entryToken === token) {
      return;
    }

    const distance = levenshteinDistance(token, entryToken);
    const maxLength = Math.max(token.length, entryToken.length);
    const similarity = maxLength === 0 ? 1 : 1 - distance / maxLength;

    if (similarity > bestScore) {
      bestScore = similarity;
    }
  });

  return bestScore;
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    if (!fileContent.trim()) {
      return [];
    }

    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed.entries)) {
      return parsed.entries;
    }

    return [];
  } catch (error) {
    return [];
  }
}

function buildKnowledgeIndex() {
  const index = {};
  const files = fs.existsSync(KB_DIR)
    ? fs.readdirSync(KB_DIR).filter((file) => file.endsWith(".json"))
    : [];

  files.forEach((fileName) => {
    const filePath = path.join(KB_DIR, fileName);
    const items = safeReadJson(filePath);
    index[fileName.replace(/\.json$/, "")] = items;
  });

  return index;
}

const knowledgeIndex = buildKnowledgeIndex();

function inferCategoryHints(queryTokens) {
  const hints = {};

  Object.entries(CATEGORY_HINTS).forEach(([category, phrases]) => {
    const hitCount = phrases.reduce((count, phrase) => {
      const phraseTokens = normalize(phrase).split(" ").filter(Boolean);
      const containsAll = phraseTokens.every((phraseToken) => queryTokens.includes(phraseToken));
      if (containsAll) {
        return count + 1;
      }
      const anyMatch = phraseTokens.some((phraseToken) => queryTokens.includes(phraseToken));
      return count + (anyMatch ? 1 : 0);
    }, 0);

    if (hitCount > 0) {
      hints[category] = hitCount;
    }
  });

  return hints;
}

function detectStrongCategory(queryTokens) {
  // Direct priority mapping for exact categories
  const directCategories = [
    "placement",
    "fees",
    "domains",
    "certificates",
    "certification",
    "orientation",
    "contact",
    "benefits",
    "courses",
    "company",
    "internship"
  ];
  
  // Virtual category routing to physical KB categories
  const isCourseQuery = queryTokens.includes("course") || queryTokens.includes("courses");
  if (isCourseQuery) {
    if (
      queryTokens.includes("fee") ||
      queryTokens.includes("fees") ||
      queryTokens.includes("price") ||
      queryTokens.includes("cost") ||
      queryTokens.includes("duration") ||
      queryTokens.includes("weeks") ||
      queryTokens.includes("all") ||
      queryTokens.includes("each") ||
      queryTokens.includes("how")
    ) {
      return "faq";
    }
    return "courses";
  }

  if (queryTokens.includes("duration") || queryTokens.includes("weeks") || queryTokens.includes("months") || queryTokens.includes("long")) {
    return "internship";
  }
  if (queryTokens.includes("eligibility") || queryTokens.includes("eligible") || queryTokens.includes("fresher") || queryTokens.includes("beginner") || queryTokens.includes("qualification")) {
    return "internship";
  }
  if (queryTokens.includes("registration") || queryTokens.includes("register") || queryTokens.includes("apply") || queryTokens.includes("enroll")) {
    return "internship";
  }
  if (queryTokens.includes("payment") || queryTokens.includes("pay") || queryTokens.includes("upi") || queryTokens.includes("razorpay")) {
    return "fees";
  }

  // LOR / Letter of Recommendation → always certificates
  if (
    queryTokens.includes("lor") ||
    queryTokens.includes("recommendation") ||
    queryTokens.includes("letter") ||
    (queryTokens.includes("certificate") && queryTokens.includes("get"))
  ) {
    return "certificates";
  }

  for (const cat of directCategories) {
    if (queryTokens.includes(cat)) {
      return cat;
    }
  }

  let strongestCategory = null;
  let strongestScore = 0;

  Object.entries(CATEGORY_KEYWORD_MAP).forEach(([category, phrases]) => {
    const score = phrases.reduce((count, phrase) => {
      const phraseTokens = normalize(phrase).split(" ").filter(Boolean);
      const hasMatch = phraseTokens.some((phraseToken) => queryTokens.includes(phraseToken));
      return count + (hasMatch ? 1 : 0);
    }, 0);

    if (score > strongestScore) {
      strongestCategory = category;
      strongestScore = score;
    }
  });

  return strongestScore > 0 ? strongestCategory : null;
}

function scoreMatch(entry, queryTokens, categoryHints, strongCategory) {
  const entryText = normalize(`${entry.question || ""} ${entry.answer || ""} ${entry.category || ""}`);
  const entryTokens = entryText.split(" ").filter(Boolean);
  const querySet = new Set(queryTokens);

  let score = 0;

  const isCourseQuery = queryTokens.includes("course") || queryTokens.includes("courses");
  const isFeeOrDurationQuery = queryTokens.includes("fee") || queryTokens.includes("fees") || queryTokens.includes("price") || queryTokens.includes("cost") || queryTokens.includes("duration") || queryTokens.includes("weeks") || queryTokens.includes("each") || queryTokens.includes("all");

  if (isCourseQuery && isFeeOrDurationQuery) {
    if (entryText.includes("full stack web development") && entryText.includes("7 999")) {
      score += 45;
    }
    if (entry.category === "faq" || entry.category === "courses" || entry.category === "domains") {
      score += 35;
    }
    if (entryText.includes("1 to 3 months") || entryText.includes("1 month 2 month") || entryText.includes("ranges from 1 to 3")) {
      score -= 80;
    }
  }

  const isCertificateQuery = queryTokens.includes("certificate") || queryTokens.includes("certificates") || queryTokens.includes("certification") || queryTokens.includes("cert");

  // General company/about query boosting
  const aboutKeywords = [
    "weintern",
    "about",
    "info",
    "information",
    "company",
    "platform",
    "tell"
  ];

  const hasAboutIntent = queryTokens.some((token) =>
    aboutKeywords.includes(token)
  );

  if (hasAboutIntent && entry.category === "company" && !isCertificateQuery) {
    score += 25;
  }

  if (
    hasAboutIntent &&
    entry.question &&
    normalize(entry.question).includes("what is weintern")
  ) {
    score += 30;
  }

  queryTokens.forEach((token) => {
    if (!token) return;
    if (entryText.includes(token)) {
      score += 3;
    }

    const fuzzyScore = fuzzyMatchScore(token, entryTokens);
    if (fuzzyScore >= 0.72) {
      score += 2;
    }
  });

  entryTokens.forEach((token) => {
    if (querySet.has(token)) {
      score += 2;
    }
  });

  Object.entries(categoryHints).forEach(([category, hitCount]) => {
    if (entry.category === category) {
      score += hitCount * 7;
    }
  });

  if (strongCategory && entry.category === strongCategory) {
    score += 18;
  }

  if (strongCategory && entry.category !== strongCategory) {
    score -= 6;
  }

  if (queryTokens.includes("project") && entryText.includes("project")) {
    // IDE / Compiler
if (
  (queryTokens.includes("ide") ||
   queryTokens.includes("compiler")) &&
  (entryText.includes("ide") ||
   entryText.includes("compiler") ||
   entryText.includes("visual studio code") ||
   entryText.includes("gcc") ||
   entryText.includes("mingw") ||
   entryText.includes("code blocks"))
) {
  score += 15;
}
    
}

  if (queryTokens.includes("mentor") && entryText.includes("mentor")) {
    score += 7;
  }

  if (queryTokens.includes("course") && entryText.includes("course")) {
    score += 6;
  }

  if (queryTokens.includes("fee") && entryText.includes("fee")) {
    score += 6;
  }

  if (queryTokens.includes("placement") && entryText.includes("placement")) {
    score += 6;
  }

  if (queryTokens.includes("contact") && (entryText.includes("contact") || entryText.includes("whatsapp") || entryText.includes("email"))) {
    score += 8;
  }

  if (isCertificateQuery) {
    if (entry.category === "certificates" || entry.category === "certification") {
      score += 65;
    } else if (entryText.includes("certificate") || entryText.includes("certification")) {
      score += 20;
    }
  }

  // LOR / Letter of Recommendation boost
  const isLorQuery = queryTokens.includes("lor") || queryTokens.includes("recommendation") || queryTokens.includes("letter");
  if (isLorQuery) {
    if (entry.category === "certificates" || entry.category === "certification") {
      score += 65;
    } else if (entryText.includes("lor") || entryText.includes("letter") || entryText.includes("recommendation")) {
      score += 20;
    }
  }

  if (queryTokens.includes("internship") && entryText.includes("internship")) {
    score += 8;
  }

  // Orientation & Google Meet scoring
  if (queryTokens.includes("orientation") && entryText.includes("orientation")) {
    score += 10;
  }

  if ((queryTokens.includes("meet") || queryTokens.includes("link") || queryTokens.includes("google")) && entryText.includes("meet")) {
    score += 10;
  }

  // Duration scoring
  if ((queryTokens.includes("duration") || queryTokens.includes("months") || queryTokens.includes("long") || queryTokens.includes("mahine")) && (entryText.includes("duration") || entryText.includes("month"))) {
    score += 9;
  }

  // Eligibility scoring
  if ((queryTokens.includes("eligible") || queryTokens.includes("eligibility") || queryTokens.includes("criteria") || queryTokens.includes("fresher") || queryTokens.includes("beginner")) && (entryText.includes("eligible") || entryText.includes("eligibility") || entryText.includes("fresher"))) {
    score += 9;
  }

  // Registration scoring
  if ((queryTokens.includes("register") || queryTokens.includes("registration") || queryTokens.includes("enroll") || queryTokens.includes("apply")) && (entryText.includes("register") || entryText.includes("enrollment") || entryText.includes("apply"))) {
    score += 8;
  }

  // Payment method scoring
  if ((queryTokens.includes("payment") || queryTokens.includes("pay") || queryTokens.includes("upi") || queryTokens.includes("paytm") || queryTokens.includes("razorpay")) && (entryText.includes("payment") || entryText.includes("upi") || entryText.includes("pay") || entryText.includes("razorpay"))) {
    score += 8;
  }

  // Domain scoring
  if (queryTokens.includes("domain") && entryText.includes("domain")) {
    score += 8;
  }

  // Stipend scoring
  if ((queryTokens.includes("stipend") || queryTokens.includes("salary") || queryTokens.includes("earn") || queryTokens.includes("earnings")) && entryText.includes("stipend")) {
    score += 12;
  }

  // EMI / discount scoring
  if ((queryTokens.includes("emi") || queryTokens.includes("installment") || queryTokens.includes("installments") || queryTokens.includes("ratio")) && (entryText.includes("emi") || entryText.includes("30:40:30") || entryText.includes("installment"))) {
    score += 12;
  }

  if ((queryTokens.includes("discount") || queryTokens.includes("one-time") || queryTokens.includes("onetime")) && (entryText.includes("discount") || entryText.includes("one-time"))) {
    score += 10;
  }

  // Placement guarantee scoring
  if ((queryTokens.includes("guarantee") || queryTokens.includes("guaranteed") || queryTokens.includes("100%")) && (entryText.includes("guarantee") || entryText.includes("guaranteed") || entryText.includes("100%"))) {
    score += 12;
  }

  // LinkedIn scoring
  if ((queryTokens.includes("linkedin") || queryTokens.includes("profile")) && (entryText.includes("linkedin") || entryText.includes("profile"))) {
    score += 10;
  }

  // 6-month / 3-month program scoring
  if ((queryTokens.includes("6") || queryTokens.includes("six") || queryTokens.includes("6-month")) && (entryText.includes("6-month") || entryText.includes("6 month") || entryText.includes("₹7,999"))) {
    score += 10;
  }

  if ((queryTokens.includes("3") || queryTokens.includes("three") || queryTokens.includes("3-month")) && (entryText.includes("3-month") || entryText.includes("3 month") || entryText.includes("₹999"))) {
    score += 10;
  }

  if (entry.question && normalize(entry.question).includes(queryTokens.join(" "))) {
    score += 5;
  }

  if (
  queryTokens.includes("weintern") &&
  (entry.category === "company" || entry.category === "faq") &&
  !isCertificateQuery
) {
  score += 25;
}

  if (entry.category && normalize(entry.category).includes(queryTokens.join(" "))) {
    score += 2;
  }

  return score;
}

function searchKnowledgeBase(message = "") {
  const query = normalize(message);
  const queryTokens = query.split(" ").filter(Boolean);
  const categoryHints = inferCategoryHints(queryTokens);

  // Pre-detect plan-price certificate questions before token-based detection
  // e.g. "What is included in 7999 plan?" or "999 wale plan mein kya milega?"
  const rawLower = message.toLowerCase();
  const hasPlanPrice = /7[,\s]?999/.test(rawLower) || (/\b999\b/.test(rawLower) && !/fees|fee|price|cost|how much/.test(rawLower));
  const hasCertContext = /plan|include|included|milega|milta|certificate|get|cert|lor/.test(rawLower);
  let strongCategory = detectStrongCategory(queryTokens);
  // Override fees→certificates when asking what a plan *includes* (cert context)
  if (hasPlanPrice && hasCertContext && (strongCategory === null || strongCategory === "fees")) {
    strongCategory = "certificates";
  }
  const isPlanCertQuery = hasPlanPrice && hasCertContext;
  const matches = [];

  Object.entries(knowledgeIndex).forEach(([category, entries]) => {
    entries.forEach((entry) => {
      let score = scoreMatch(entry, queryTokens, categoryHints, strongCategory);
      // Extra boost: "what's in 7999/999 plan" → heavily favour certificate entries
      if (isPlanCertQuery && (category === "certificates" || category === "certification")) {
        score += 50;
      }
     if (score >= 6) {
        matches.push({
          category,
          question: entry.question || entry.title || "General FAQ",
          answer: entry.answer || entry.description || "",
          score,
        });
      }
    });
  });

  matches.sort((a, b) => b.score - a.score);

  const bestMatches = matches.slice(0, 4);
  console.log("BEST MATCHES:", bestMatches);
  const contextText = bestMatches
    .map((match) => `Category: ${match.category}. Question: ${match.question}. Answer: ${match.answer}`)
    .join("\n");

  return {
    query,
    matches: bestMatches,
    contextText,
    hasMatch: bestMatches.length > 0,
  };
}

module.exports = {
  searchKnowledgeBase,
  buildKnowledgeIndex,
};

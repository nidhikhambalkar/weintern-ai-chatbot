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
  ceo: "company",
  founder: "company",
  owner: "company",
  founded: "company",
  started: "company",
  location: "company",
  located: "location",
  address: "company",
  headquarter: "company",
  headquarters: "company",
  introduce: "company",
  introduction: "company",
  overview: "company",
  info: "company",
  platform: "company",
  ashwin: "company",
  gurao: "company",
  namita: "company",
  gope: "company",
  kharadi: "company",
  pune: "company",
  cofounder: "company",
  "co-founder": "company",
  mission: "mission",
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

  // ── WeIntern single-token misspellings / speech variants ──────────────
  weintrn:    "weintern",
  wintern:    "weintern",
  wenitern:   "weintern",
  wigton:     "weintern",
  vinturn:    "weintern",
  winturn:    "weintern",
  weinturm:   "weintern",
  weinturn:   "weintern",
  weentern:   "weintern",
  weintearn:  "weintern",
  wenitern:   "weintern",
  wee:        "we",          // "wee intern" → will then match "we" + "intern"

  // ── Certificate typos ─────────────────────────────────────────────────
  certifcate:    "certificate",
  certificat:    "certificate",
  certficate:    "certificate",
  certicate:     "certificate",
  cretificate:   "certificate",
  certiificate:  "certificate",
  certifiate:    "certificate",
  cerificate:    "certificate",

  // ── Registration / register typos ─────────────────────────────────────
  regster:      "register",
  resgister:    "register",
  rgister:      "register",
  registrtion:  "registration",
  registation:  "registration",
  resigtration: "registration",
  regsitration: "registration",

  // ── Internship typos ──────────────────────────────────────────────────
  internsip:    "internship",
  internshp:    "internship",
  intrnship:    "internship",
  interniship:  "internship",
  internshipe:  "internship",
  internshipp:  "internship",
  intenrship:   "internship",

  // ── Placement typos ───────────────────────────────────────────────────
  placment:   "placement",
  placemnt:   "placement",
  palcement:  "placement",
  plcement:   "placement",
  placsment:  "placement",

  // ── Stipend typos ─────────────────────────────────────────────────────
  stipnd:     "stipend",
  stpend:     "stipend",
  stiend:     "stipend",
  stipened:   "stipend",
  stipent:    "stipend",
  stepend:    "stipend",
  stipond:    "stipend",

  // ── Duration typos ────────────────────────────────────────────────────
  duraton:   "duration",
  duartion:  "duration",
  duraion:   "duration",
  durtion:   "duration",

  // ── Mentor typos ──────────────────────────────────────────────────────
  mentr:  "mentor",
  mntor:  "mentor",
  metor:  "mentor",

  // ── Domain typos ──────────────────────────────────────────────────────
  doamin:  "domain",
  domian:  "domain",
  doman:   "domain",

  // ── Course typos ──────────────────────────────────────────────────────
  corse:   "course",
  coure:   "course",
  cource:  "course",
  coures:  "course",
  crouse:  "course",

  // ── Fees typos ────────────────────────────────────────────────────────
  feez: "fees",
  fes:  "fees",

  // ── Other key-term typos ──────────────────────────────────────────────
  orentation:  "orientation",
  orientaton:  "orientation",
  eligibilty:  "eligibility",
  elgibility:  "eligibility",
  elibility:   "eligibility",
  eligibity:   "eligibility",
  sylabus:     "syllabus",
  syllbus:     "syllabus",

  // ── Hinglish shortforms & conversational tokens ───────────────────────
  chahiye:  "want",
  chahie:   "want",
  chiye:    "want",
  batao:    "tell",
  btao:     "tell",
  bata:     "tell",
  janna:    "know",
  jaanta:   "know",
  pata:     "know",
  abhi:     "now",
  dobara:   "again",
  sab:      "all",
  koi:      "any",
  kuch:     "some",
  vo:       "that",
  woh:      "that",
  mujhe:    "me",
  meri:     "my",
  mera:     "my",
  h:        "",             // "kya h" → "what" ("h" = "hai" in Hinglish)
  hn:       "",             // "haan" variant
  smjhao:   "explain",
  samjhao:  "explain",
  bhai:     "",             // vocative filler
  yaar:     "",             // vocative filler
  bro:      "",             // vocative filler

  // Marathi shortforms
  sandanga: "tell",
  sangata:  "tell",
  kasa:     "how",
};

const CATEGORY_HINTS = {
  company: ["weintern", "company", "about weintern", "tell me about weintern", "what is weintern", "who is weintern", "who are weintern", "what does weintern do", "ceo", "founder", "owner", "location", "address", "introduce", "introduction", "overview", "info", "information", "platform", "edtech", "headquarter"],
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
  company: [
    "weintern", "company", "about weintern", "tell me about weintern",
    "info about weintern", "information about weintern",
    "what is weintern", "who is weintern", "who are weintern",
    "what does weintern do", "know about weintern",
    "weintern ke baare", "weintern kya hai",
    "ceo", "founder", "owner", "who founded", "who started",
    "location", "address", "headquarter", "headquarters",
    "introduce", "introduction", "overview", "info", "information",
    "platform", "edtech", "about", "vision", "mission"
  ],
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

// ── Phrase-level pre-normalization ───────────────────────────────────────────
// Runs BEFORE token-by-token normalization to handle multi-word variants and
// Hinglish compound phrases that cannot be fixed at the individual token level.
function preNormalize(text = "") {
  let t = String(text).toLowerCase().trim();

  // 1. WeIntern multi-word and phonetic name variants → "weintern"
  //    Must run before special-char stripping so spaces/hyphens are still present
  t = t.replace(
    /\b(v\s+intern|w\s+intern|wee\s+intern|we\s+intern|we-intern|we\s+interne|weintrern|weintrn|wintern|wenitern|wigton|vinturn|winturn|weinturm|weinturn|weentern|wenitern|we\s+inter\b|way\s+intern|vee\s+intern|be\s+intern|beintern|weinternship)\b/gi,
    "weintern"
  );

  // 2. Hinglish/informal phrase-level normalizations
  const phraseMap = [
    // Registration intent
    [/\b(register|enroll|apply|join|signup)\s+karna\s+(hai|h|hoga|he)\b/gi, "registration want"],
    [/\b(register|enroll|apply|join)\s+kaise\s+(kare|karu|karein|karna|hoga)\b/gi, "how registration"],
    [/\bkaise\s+(register|enroll|apply)\s+(kare|karu|karein|karna)\b/gi, "how registration"],
    [/\b(kaise|how)\s+(register|enroll|apply)\b/gi, "how registration"],
    // Fees/cost intent
    [/\b(kitna|kitni|kitne)\s+(fee|fees|paisa|paise|rupees|rs|rupay|cost|charge|amount)\b/gi, "fees how much"],
    [/\b(fee|fees|paisa|paise)\s+(kitna|kitni|kitne|lagega|lagenge|hoga|hoge|hai|h)\b/gi, "fees how much"],
    [/\binternship\s+fees?\s+kitna\b/gi, "internship fees how much"],
    [/\bcourse\s+ki\s+fees?\b/gi, "course fees"],
    [/\bfees?\s+kya\s+(h|hai)\b/gi, "fees what is"],
    // Duration intent
    [/\b(kitne|kitna)\s+(month|months|mahine|mahina|din|hafte|hafta|weeks|time)\b/gi, "duration months how many"],
    [/\bkitne\s+month\s+ka\b/gi, "duration months"],
    [/\bhow\s+many\s+months?\b/gi, "duration months"],
    [/\bhow\s+long\s+is\b/gi, "duration"],
    // Certificate intent
    [/\b(certif[a-z]*|cert)\s+(milega|milte|milta|milenge|kab|kaise|hoga)\b/gi, "certificate get"],
    // Stipend intent
    [/\b(stipend|paise|paisa|earning)\s+(milega|milte|milta|milenge|kitna|kab)\b/gi, "stipend get"],
    [/\bkitna\s+stipend\b/gi, "stipend how much"],
    // Placement/job
    [/\b(job|placement|naukri)\s+(milega|milte|milta|guarantee|pakka|hoga)\b/gi, "placement get"],
    // What is / kya hai
    [/\bkya\s+h\b/gi, "what is"],
    [/\bkya\s+hai\b/gi, "what is"],
    [/\bkya\s+hota\s+(hai|h)\b/gi, "what is"],
    [/\bkaisa\s+(hota|hai|h)\b/gi, "how is"],
    // "karna h" / "karna hai" → intent marker (want)
    [/\bkarna\s+(h|hai|hoga)\b/gi, "want"],
    [/\bkarna\s+chahta\b/gi, "want"],
    // Short queries
    [/\bkitna\s+(hai|h)\b/gi, "how much"],
    [/\bkitne\s+(hai|h)\b/gi, "how many"],
  ];

  phraseMap.forEach(([pattern, replacement]) => {
    t = t.replace(pattern, replacement);
  });

  return t;
}

function normalize(text = "") {
  // Phase 1: phrase-level pre-normalization (WeIntern variants, Hinglish phrases)
  const pre = preNormalize(text);

  // Phase 2: character-level cleaning
  const cleaned = String(pre)
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  // Phase 3: token-by-token TOKEN_MAP substitution
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
  const isSixMonthQuery = (
    queryTokens.includes("6") ||
    queryTokens.includes("six") ||
    queryTokens.includes("6-month") ||
    queryTokens.includes("6month")
  ) && (
    queryTokens.includes("month") ||
    queryTokens.includes("months") ||
    queryTokens.includes("program") ||
    queryTokens.includes("internship") ||
    queryTokens.includes("fee") ||
    queryTokens.includes("fees") ||
    queryTokens.includes("price") ||
    queryTokens.includes("details") ||
    queryTokens.includes("include") ||
    queryTokens.includes("included")
  );

  if (isSixMonthQuery) {
    return "fees";
  }

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

  // CEO / Founder / Owner / Location / Mission / Chatbot / Named person → always company
  if (
    queryTokens.includes("ceo") ||
    queryTokens.includes("founder") ||
    queryTokens.includes("owner") ||
    queryTokens.includes("founded") ||
    queryTokens.includes("headquarter") ||
    queryTokens.includes("headquarters") ||
    queryTokens.includes("ashwin") ||
    queryTokens.includes("gurao") ||
    queryTokens.includes("namita") ||
    queryTokens.includes("gope") ||
    queryTokens.includes("kharadi") ||
    queryTokens.includes("pune") ||
    queryTokens.includes("cofounder") ||
    queryTokens.includes("location") ||
    queryTokens.includes("located") ||
    queryTokens.includes("mission") ||
    queryTokens.includes("chatbot") ||
    queryTokens.includes("bot") ||
    (queryTokens.includes("created") && queryTokens.includes("why")) ||
    (queryTokens.includes("address") && queryTokens.includes("weintern")) ||
    (queryTokens.includes("introduce") && queryTokens.includes("weintern")) ||
    (queryTokens.includes("overview") && queryTokens.includes("weintern")) ||
    (queryTokens.includes("about") && queryTokens.includes("weintern") && !queryTokens.includes("course") && !queryTokens.includes("fee"))
  ) {
    return "company";
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

  const isSixMonthQuery = (
    queryTokens.includes("6") ||
    queryTokens.includes("six") ||
    queryTokens.includes("6-month") ||
    queryTokens.includes("6month")
  ) && (
    queryTokens.includes("month") ||
    queryTokens.includes("months") ||
    queryTokens.includes("program") ||
    queryTokens.includes("internship") ||
    queryTokens.includes("fee") ||
    queryTokens.includes("fees") ||
    queryTokens.includes("price") ||
    queryTokens.includes("details") ||
    queryTokens.includes("include") ||
    queryTokens.includes("included")
  );

  if (isSixMonthQuery) {
    if (entryText.includes("6 month internship program") || entryText.includes("6-month internship program") || entry.question.toLowerCase().includes("6-month") || entry.question.toLowerCase().includes("6 month")) {
      score += 65;
    }
    if (entryText.includes("training certificate") && entryText.includes("lor") && entryText.includes("mock interview")) {
      score += 45;
    }
    if (entryText.includes("full stack web development — 12 weeks") || entryText.includes("mobile app development — 10 weeks")) {
      score -= 80;
    }
  }

  const isCourseQuery = queryTokens.includes("course") || queryTokens.includes("courses");
  const isFeeOrDurationQuery = queryTokens.includes("fee") || queryTokens.includes("fees") || queryTokens.includes("price") || queryTokens.includes("cost") || queryTokens.includes("duration") || queryTokens.includes("weeks") || queryTokens.includes("each") || queryTokens.includes("all");

  if (isCourseQuery && isFeeOrDurationQuery && !isSixMonthQuery) {
    if (entryText.includes("full stack web development") && entryText.includes("6 599")) {
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
    "tell",
    "introduce",
    "introduction",
    "overview",
    "vision",
    "mission"
  ];

  const companyIdentityKeywords = [
    "ceo", "founder", "owner", "founded", "started",
    "location", "address", "headquarter", "headquarters",
    "introduce", "introduction", "overview"
  ];

  const hasAboutIntent = queryTokens.some((token) =>
    aboutKeywords.includes(token)
  );

  const hasCompanyIdentityIntent = queryTokens.some((token) =>
    companyIdentityKeywords.includes(token)
  );

  if (hasAboutIntent && entry.category === "company" && !isCertificateQuery) {
    score += 25;
  }

  // Strong boost for CEO/founder/owner/location queries → company entries
  if (hasCompanyIdentityIntent && entry.category === "company") {
    score += 45;
  }

  // ── Specific company question boosters ──────────────────────────────────
  // Boost the specific "where is ... located" entry over the generic intro
  const isLocationQuery = queryTokens.includes("location") || queryTokens.includes("located");
  if (isLocationQuery && entry.category === "company") {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("located") || normQ.includes("location") || normQ.includes("address")) {
      score += 70; // strong preference for the location-specific entry
    } else if (normQ.includes("what is weintern") || normQ.includes("introduce")) {
      score -= 40; // penalise generic intro for location queries
    }
  }

  // Boost the specific "mission" entry over the generic intro
  const isMissionQuery = queryTokens.includes("mission");
  if (isMissionQuery && entry.category === "company") {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("mission")) {
      score += 70; // strong preference for the mission-specific entry
    } else if (normQ.includes("what is weintern") || normQ.includes("introduce")) {
      score -= 40; // penalise generic intro for mission queries
    }
  }

  // Boost the specific "why was this chatbot created" entry when asking about chatbot
  const isChatbotPurposeQuery = queryTokens.includes("chatbot") || queryTokens.includes("bot") || (queryTokens.includes("created") && (queryTokens.includes("why") || queryTokens.includes("purpose")));
  if (isChatbotPurposeQuery && entry.category === "company") {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("chatbot") || normQ.includes("purpose")) {
      score += 80;
    } else if (normQ.includes("what is weintern") || normQ.includes("introduce")) {
      score -= 40;
    }
  }

  // Boost the specific "what is weintern" entry for direct overview questions
  const isWhatIsWeInternQuery = (queryTokens.includes("what") || queryTokens.includes("tell") || queryTokens.includes("about") || queryTokens.includes("kya") || queryTokens.includes("who")) && queryTokens.includes("weintern") && !queryTokens.includes("address") && !queryTokens.includes("location") && !queryTokens.includes("ceo") && !queryTokens.includes("founder") && !queryTokens.includes("mission") && !queryTokens.includes("fee") && !queryTokens.includes("course") && !queryTokens.includes("domain") && !queryTokens.includes("certificate") && !queryTokens.includes("stipend") && !queryTokens.includes("placement");
  if (isWhatIsWeInternQuery && entry.category === "company") {
    const normQ = normalize(entry.question || "");
    // Exact-match boost: only "What is WeIntern?" / "Who is WeIntern?" / "Tell me about WeIntern" — NOT "What is WeIntern's address/vision/..."
    const isExactOverviewEntry = /^(what is weintern|who is weintern|who are weintern|tell me about weintern|weintern kya hai|weintern ke baare mein batao)/.test(normQ) && !normQ.includes("address") && !normQ.includes("vision") && !normQ.includes("ceo") && !normQ.includes("founder");
    if (isExactOverviewEntry) {
      score += 150; // strong boost for the exact overview entry
    } else if (normQ.includes("address") || normQ.includes("located") || normQ.includes("vision") || normQ.includes("weinterns address") || normQ.includes("weinterns vision")) {
      score -= 200; // strongly penalise sub-entries like "What is WeIntern's address?"
    }
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
  if ((queryTokens.includes("6") || queryTokens.includes("six") || queryTokens.includes("6-month")) && (entryText.includes("6-month") || entryText.includes("6 month") || entryText.includes("₹6,599"))) {
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

  // ── EXACT QUESTION MATCH SHORTCUT ────────────────────────────────────────
  // Before running the full scoring loop, check if the user's normalised query
  // exactly matches (or very closely matches) a KB entry's question text.
  // This prevents near-identical entries (e.g. "What is WeIntern's address?")
  // from winning over the direct target (e.g. "What is WeIntern?").
  const normalizedQuery = query.trim();
  for (const [cat, entries] of Object.entries(knowledgeIndex)) {
    for (const entry of entries) {
      const normEntryQ = normalize(entry.question || "").trim();
      if (normEntryQ === normalizedQuery) {
        const exactMatch = {
          category: cat,
          question: entry.question || "",
          answer: entry.answer || "",
          score: 9999,
        };
        const contextText = `Category: ${cat}. Question: ${entry.question}. Answer: ${entry.answer}`;
        console.log("EXACT MATCH SHORTCUT:", entry.question);
        return {
          query: normalizedQuery,
          matches: [exactMatch],
          contextText,
          hasMatch: true,
        };
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Pre-detect plan-price certificate questions before token-based detection
  // e.g. "What is included in 6599 plan?" or "999 wale plan mein kya milega?"
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
      // Extra boost: "what's in 6599/999 plan" → heavily favour certificate entries
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

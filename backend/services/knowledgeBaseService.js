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
  refund: "refund",
  payment: "fees",
  pay: "fees",
  upi: "fees",
  emi: "fees",
  scholarship: "scholarship",
  scholarships: "scholarship",
 
  interviews: "placement",
  employee: "employee",
  employees: "employee",
  employment: "employment",
  hiring: "hiring",
  fulltime: "fulltime",
  rules: "policy",
  terms: "policy",
  conditions: "policy",
  complaint: "contact",
  escalation: "contact",
  whatsapp: "contact",
  email: "contact",
  contact: "contact",
  ceo: "ceo",
  founder: "founder",
  owner: "founder",
  founded: "founded",
  started: "started",
  location: "location",
  located: "located",
  address: "address",
  headquarter: "headquarters",
  headquarters: "headquarters",
  introduce: "introduce",
  introduction: "introduce",
  overview: "overview",
  info: "info",
  platform: "company",
  ashwin: "ashwin",
  gurao: "gurao",
  namita: "namita",
  gope: "gope",
  kharadi: "kharadi",
  pune: "pune",
  cofounder: "cofounder",
  "co-founder": "cofounder",
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
  // Events / Webinars / Workshops / Seminars / Community
  webinar: "webinar",
  webinars: "webinar",
  event: "event",
  events: "event",
  workshop: "workshop",
  workshops: "workshop",
  seminar: "seminar",
  seminars: "seminar",
  hackathon: "hackathon",
  hackathons: "hackathon",
  community: "community",
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
  fresher: "fresher",
  freshers: "fresher",
  beginner: "beginner",
  beginners: "beginner",
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
  // Domains (keep domain-specific tokens intact!)
  domain: "domain",
  domains: "domain",
  fullstack: "full_stack",
  aiml: "ai_automation",
  datascience: "data_science",
  python: "python",
  java: "java",
  uiux: "ui_ux",
  ui: "ui",
  ux: "ux",
  marketing: "digital_marketing",
  cybersecurity: "cyber_security",
  cloud: "cloud_devops",
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
  weinterm:   "weintern",
  weimterm:   "weintern",
  weintarn:   "weintern",
  weinternn:  "weintern",
  weintrm:    "weintern",
  weintrn:    "weintern",
  wintern:    "weintern",
  wenitern:   "weintern",
  wigton:     "weintern",
  vinturn:    "weintern",
  vington:    "weintern",
  vingten:    "weintern",
  winturn:    "weintern",
  weinturm:   "weintern",
  weinturn:   "weintern",
  weentern:   "weintern",
  weentrn:    "weintern",
  weintearn:  "weintern",
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
  employment: ["employee", "employment", "hiring", "hire", "work at weintern", "work for weintern", "job at weintern", "job opportunities", "is weintern hiring", "apply for job", "full-time", "full time", "hire interns as employees", "employee openings"],
  courses: ["course", "courses", "program", "learn", "training", "skill"],
  benefits: ["benefit", "benefits", "mentor", "mentor support", "doubt", "class", "recorded", "network", "soft skill", "softskills"],
  internship: ["internship", "intern", "onboarding", "attendance", "team", "selection", "daily task", "live project", "project", "register", "enroll", "apply", "payment", "pay", "upi", "eligible", "fresher", "beginner", "how long", "how many months"],
  certificates: ["certificate", "certification", "verify", "validity", "lor", "letter", "recommendation", "training certificate", "linkedin"],
  certification: ["certificate", "certification", "verify", "validity", "lor", "letter", "recommendation", "training certificate", "linkedin"],
  placement: ["placement", "resume", "interview", "mock", "placement assistance", "job assistance", "placement guarantee", "linkedin", "profile"],
  fees: ["fees", "fee", "discount", "scholarship", "emi", "refund", "price"],
  contact: ["contact", "support", "helpdesk", "whatsapp", "email", "complaint", "escalation", "reach", "office hours", "phone", "number"],
  policies: ["policy", "terms", "conditions", "privacy", "conduct", "attendance", "rules"],
  orientation: ["orientation", "orient", "google meet", "meet link", "link", "joining link", "session date", "session time", "when is orientation", "what time"],
  domains: ["domain", "domains", "which domain", "full stack", "ai ml", "data science", "python", "java", "ui ux", "digital marketing", "cyber security", "cloud computing", "what domain"],
  eligibility: ["eligible", "eligibility", "criteria", "qualification", "fresher", "beginner", "who can join", "can i join", "minimum", "stream"],
  duration: ["duration", "how long", "how many months", "months", "weeks", "long is", "mahine"],
  registration: ["register", "registration", "enroll", "enrollment", "apply", "sign up", "how to join", "steps to apply"],
  events: ["webinar", "webinars", "workshop", "workshops", "seminar", "seminars", "event", "events", "hackathon", "hackathons", "community", "conduct webinars", "organize webinars", "host events"],
};

const CATEGORY_KEYWORD_MAP = {
  events: [
    "webinar", "webinars", "workshop", "workshops", "seminar", "seminars",
    "event", "events", "hackathon", "hackathons", "community", "community group",
    "conduct webinars", "organize webinars", "host events", "attend webinars",
    "upcoming webinars", "live webinars"
  ],
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
  employment: [
    "employee", "employment", "hiring", "hire", "work at weintern", "work for weintern",
    "job at weintern", "job opportunities", "is weintern hiring", "apply for job",
    "fulltime", "full-time", "hire interns as employees", "employee openings",
    "career opportunities", "join as employee", "join as an employee", "join your company"
  ],
  courses: ["course", "courses", "program", "training", "skill", "learn", "about course", "about courses", "course details", "course information", "program details", "program information", "training details", "training information", "skill development", "learn skills", "learn programming", "learn coding", "learn data science", "learn ai ml", "learn python", "learn java", "learn ui ux", "learn digital marketing", "learn cyber security", "learn cloud computing"],
  benefits: ["benefit", "benefits", "mentor", "doubt", "class", "recorded", "network", "soft skill", "softskills"],
  internship: ["internship", "intern", "onboarding", "attendance", "team", "selection", "daily task", "live project", "project", "register", "enroll", "apply", "payment", "upi", "eligible", "fresher", "beginner"],
  certificates: ["certificate", "certification", "verify", "validity", "lor", "letter", "recommendation", "training certificate", "linkedin"],
  certification: ["certificate", "certification", "verify", "validity", "lor", "letter", "recommendation", "training certificate", "linkedin"],
  placement: ["placement", "resume", "interview", "mock", "placement assistance", "job assistance", "placement guarantee", "linkedin", "profile"],
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
    /\b(v\s*intern|v-intern|w\s+intern|w-intern|wee\s+intern|wee\s+intrn|we\s+intern|we-intern|we\s+interne|we\s+interm|we\s+intrn|we\s+intrm|we\s+intent|we\s+entered|we\s+entered\s+in|way\s+intern|vee\s+intern|vee\s+intrn|vee\s+internship|v\s+internship|be\s+intern|beintern|weinternship|weinterm|weintern|weintrn|weintarn|weinternn|weimterm|weintrm|vington|vingten|vinturn|winturn|wintern|wenitern|weinturm|weinturn|weentern|weentrn|weintearn|wigton|vinemtn|vinton)\b/gi,
    "weintern"
  );

  // 2. Hinglish/informal phrase-level normalizations
  const phraseMap = [
    // Employment & joining as employee intent
    [/\b(can\s+i\s+)?join\s+(weintern\s+|your\s+company\s+)?as\s+(an?\s+)?employee\b/gi, "join as employee"],
    [/\b(can\s+i|how\s+can\s+i|i\s+want\s+to)\s+work\s+(at|for|in)\s+weintern\b/gi, "work at weintern"],
    [/\bis\s+weintern\s+hiring\b/gi, "is weintern hiring"],
    [/\b(job|career|full\s*time)\s+(opportunity|opportunities|vacancies|openings|opening)\b/gi, "job opportunities"],
    [/\bhire\s+interns?\s+as\s+employees?\b/gi, "hire interns as employees"],
    [/\b(can\s+i\s+)?apply\s+for\s+a?\s*job\b/gi, "apply for job"],
    [/\bcan\s+i\s+join\s+your\s+company\b/gi, "join as employee"],
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
    "events",
    "employment",
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

  const isEventsOrWebinarsQuery =
    queryTokens.includes("webinar") ||
    queryTokens.includes("webinars") ||
    queryTokens.includes("workshop") ||
    queryTokens.includes("workshops") ||
    queryTokens.includes("seminar") ||
    queryTokens.includes("seminars") ||
    queryTokens.includes("event") ||
    queryTokens.includes("events") ||
    queryTokens.includes("hackathon") ||
    queryTokens.includes("hackathons") ||
    (queryTokens.includes("community") && !queryTokens.includes("doubt"));

  if (isEventsOrWebinarsQuery) {
    return "events";
  }

  const isFresherEligibilityQuery =
    (queryTokens.includes("fresher") || queryTokens.includes("freshers") || queryTokens.includes("beginner") || queryTokens.includes("beginners") || queryTokens.includes("experience")) &&
    (queryTokens.includes("join") || queryTokens.includes("eligible") || queryTokens.includes("eligibility") || queryTokens.includes("apply") || queryTokens.includes("enroll")) &&
    !queryTokens.includes("employee") &&
    !queryTokens.includes("hiring") &&
    !queryTokens.includes("fulltime") &&
    !queryTokens.includes("job") &&
    !queryTokens.includes("jobs");

  if (isFresherEligibilityQuery) {
    return "faq";
  }

  const isEmploymentQuery =
    !isFresherEligibilityQuery &&
    (queryTokens.includes("employee") ||
    queryTokens.includes("employment") ||
    queryTokens.includes("hiring") ||
    (queryTokens.includes("work") && (queryTokens.includes("weintern") || queryTokens.includes("company") || queryTokens.includes("here") || queryTokens.includes("want"))) ||
    (queryTokens.includes("job") && (queryTokens.includes("opportunities") || queryTokens.includes("opportunity") || queryTokens.includes("vacancy") || queryTokens.includes("opening") || queryTokens.includes("apply") || queryTokens.includes("weintern") || queryTokens.includes("fulltime"))) ||
    queryTokens.includes("fulltime") ||
    (queryTokens.includes("hire") && (queryTokens.includes("interns") || queryTokens.includes("fresher") || queryTokens.includes("freshers"))));

  if (isEmploymentQuery) {
    return "employment";
  }
  
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

// ── Course Domain & Aspect Intent Detection Engine ─────────────────────────────
function detectCourseDomain(rawQuery = "", queryTokens = []) {
  const lower = String(rawQuery).toLowerCase();
  const qStr = queryTokens.join(" ");

  if (/\b(ui\/ux|ui\s*ux|uiux|ui_ux|figma|adobe\s*xd|wirefram|prototyp)\b/i.test(lower) || qStr.includes("ui_ux") || (qStr.includes("ui") && qStr.includes("ux"))) {
    return "UI_UX";
  }
  if (/\b(data\s*science|datascience|data_science|data\s*analytics|pandas|tableau|power\s*bi|seaborn)\b/i.test(lower) || qStr.includes("data_science")) {
    return "DATA_SCIENCE";
  }
  if (/\b(full\s*stack|fullstack|full_stack|web\s*dev|web\s*development|react|node|express|mongodb|frontend|backend)\b/i.test(lower) || qStr.includes("full_stack")) {
    return "FULL_STACK";
  }
  if (/\b(mobile\s*app|mobile_app|flutter|dart|app\s*dev|app\s*development)\b/i.test(lower) || qStr.includes("mobile_app")) {
    return "MOBILE_APP";
  }
  if (/\b(ai\s*&\s*automation|ai\/ml|ai\s*ml|ai_automation|prompt\s*engineering|langchain|n8n|make\.com|llm|artificial\s*intelligence)\b/i.test(lower) || queryTokens.includes("ai_automation") || (queryTokens.includes("ai") && !lower.includes("detail") && !lower.includes("email"))) {
    return "AI_AUTOMATION";
  }
  if (/\b(python)\b/i.test(lower) && !/\b(data|ai|ml)\b/i.test(lower)) {
    return "PYTHON";
  }
  if (/\b(java)\b/i.test(lower) && !/\b(script|js)\b/i.test(lower)) {
    return "JAVA";
  }
  if (/\b(c\+\+|cpp|c\/c\+\+|c_cpp|cplusplus|c\s+programming|dsa|codeblocks)\b/i.test(lower) || qStr.includes("c_cpp")) {
    return "C_CPP";
  }
  if (/\b(cloud|cloud_devops|devops|aws|docker|kubernetes|terraform|ansible)\b/i.test(lower) || qStr.includes("cloud_devops")) {
    return "CLOUD_DEVOPS";
  }
  if (/\b(digital\s*marketing|digital_marketing|seo|google\s*ads|meta\s*ads|social\s*media\s*marketing)\b/i.test(lower) || qStr.includes("digital_marketing")) {
    return "DIGITAL_MARKETING";
  }

  return null;
}

function detectQueryAspect(rawQuery = "", queryTokens = []) {
  const lower = String(rawQuery).toLowerCase();
  const qStr = queryTokens.join(" ");

  // 1. Content / Include / Syllabus / Learn / Sikhate
  if (/\b(include|includes|included|including|syllabus|learn|sikhate|sikhte|sikhoge|cover|covered|content|curriculum|what\s+is\s+in|detail|details)\b/i.test(lower) || qStr.includes("include") || qStr.includes("syllabus")) {
    return "COURSE_CONTENT";
  }
  // 2. Benefits / Perks / Outcomes / Gain
  if (/\b(benefit|benefits|perk|perks|gain|advantage|advantages|outcome|outcomes|what\s+do\s+i\s+get|what\s+will\s+i\s+get)\b/i.test(lower) || qStr.includes("benefit") || qStr.includes("perk")) {
    return "COURSE_BENEFITS";
  }
  // 3. Duration / Time / Months / Weeks
  if (/\b(duration|how\s+long|month|months|week|weeks|mahine|mahina|time)\b/i.test(lower) || qStr.includes("duration")) {
    return "COURSE_DURATION";
  }
  // 4. Fees / Cost / Price / EMI
  if (/\b(fee|fees|price|cost|charge|charges|emi|installment|paisa|paise)\b/i.test(lower) || qStr.includes("fee") || qStr.includes("fees")) {
    return "COURSE_FEES";
  }
  // 5. Certificate / Certification / LOR
  if (/\b(certificate|certification|lor|recommendation\s+letter|letter\s+of\s+recommendation)\b/i.test(lower) || qStr.includes("certificate") || qStr.includes("lor")) {
    return "COURSE_CERTIFICATE";
  }
  // 6. Stipend
  if (/\b(stipend|earning|stipend\s+amount)\b/i.test(lower) || qStr.includes("stipend")) {
    return "INTERNSHIP_STIPEND";
  }
  // 7. Eligibility / Criteria / Stream
  if (/\b(eligible|eligibility|criteria|qualification|fresher|beginner|who\s+can\s+apply|stream)\b/i.test(lower) || qStr.includes("eligibility")) {
    return "INTERNSHIP_ELIGIBILITY";
  }

  return null;
}

function getEntryDomain(entry) {
  const normText = normalize(`${entry.question || ""} ${entry.answer || ""} ${entry.category || ""}`);

  if (normText.includes("ui ux") || normText.includes("ui/ux") || normText.includes("ui_ux") || normText.includes("figma")) {
    return "UI_UX";
  }
  if (normText.includes("data science") || normText.includes("data_science") || normText.includes("pandas")) {
    return "DATA_SCIENCE";
  }
  if (normText.includes("full stack") || normText.includes("full_stack")) {
    return "FULL_STACK";
  }
  if (normText.includes("mobile app") || normText.includes("mobile_app") || normText.includes("flutter")) {
    return "MOBILE_APP";
  }
  if (normText.includes("ai & automation") || normText.includes("ai automation") || normText.includes("ai_automation") || normText.includes("ai ml") || normText.includes("langchain") || normText.includes("prompt engineering")) {
    return "AI_AUTOMATION";
  }
  if (normText.includes("python programming") || normText.includes("python course") || normText.includes("learn python")) {
    return "PYTHON";
  }
  if (normText.includes("java programming") || normText.includes("java course") || normText.includes("learn java")) {
    return "JAVA";
  }
  if (normText.includes("c/c++") || normText.includes("c++") || normText.includes("c_cpp")) {
    return "C_CPP";
  }
  if (normText.includes("cloud computing") || normText.includes("cloud_devops") || normText.includes("devops")) {
    return "CLOUD_DEVOPS";
  }
  if (normText.includes("digital marketing") || normText.includes("digital_marketing") || normText.includes("seo")) {
    return "DIGITAL_MARKETING";
  }

  return null;
}

function isCoursesListQuery(rawQuery = "", queryTokens = []) {
  const lower = String(rawQuery).toLowerCase().trim();

  // Explicit phrase and regex matching for course list intents
  const hasCourseListKeywords =
    /\b(courses|programs|trainings|domains)\s+(available|provided|offered|list|details)\b/i.test(lower) ||
    /\b(available|provided|offered)\s+(courses|programs|trainings|domains)\b/i.test(lower) ||
    /\b(what|which|list|all|tell|show|available|provided|offered|have)\b.*\b(courses|programs|trainings|domains)\b/i.test(lower) ||
    /\b(courses|programs|trainings|domains)\b.*\b(available|provided|offered|provide|offer|have|list|exist)\b/i.test(lower) ||
    /\b(what\s+can\s+i\s+learn|which\s+courses\s+can\s+i\s+join|what\s+are\s+the\s+courses|courses\s+provided\s+by\s+weintern|list\s+of\s+courses|list\s+all\s+courses|what\s+are\s+all\s+available)\b/i.test(lower) ||
    /^(courses|all courses|course list|list courses|available courses|what courses|courses available|courses provided|courses offered)$/i.test(lower);

  // Check if a specific course domain is present in the query
  const hasSpecificCourse = /\b(ui|ux|ui\/ux|data\s*science|full\s*stack|mobile\s*app|flutter|python|java|c\+\+|cpp|cloud|devops|digital\s*marketing|ai|ml|automation)\b/i.test(lower);

  return hasCourseListKeywords && !hasSpecificCourse;
}

function scoreMatch(entry, queryTokens, categoryHints, strongCategory, rawQuery = "") {
  const entryText = normalize(`${entry.question || ""} ${entry.answer || ""} ${entry.category || ""}`);
  const entryTokens = entryText.split(" ").filter(Boolean);
  const querySet = new Set(queryTokens);

  let score = 0;

  // ── WEBINARS / EVENTS / WORKSHOPS / SEMINARS / COMMUNITY INTENT SCORING ─────
  const isEventsOrWebinarsQuery =
    queryTokens.includes("webinar") ||
    queryTokens.includes("webinars") ||
    queryTokens.includes("workshop") ||
    queryTokens.includes("workshops") ||
    queryTokens.includes("seminar") ||
    queryTokens.includes("seminars") ||
    queryTokens.includes("event") ||
    queryTokens.includes("events") ||
    queryTokens.includes("hackathon") ||
    queryTokens.includes("hackathons") ||
    (queryTokens.includes("community") && !queryTokens.includes("doubt"));

  if (isEventsOrWebinarsQuery) {
    const normQ = normalize(entry.question || "");
    const normA = normalize(entry.answer || "");
    const isEventEntry =
      entry.category === "events" ||
      normQ.includes("webinar") ||
      normQ.includes("workshop") ||
      normQ.includes("event") ||
      normQ.includes("seminar") ||
      normQ.includes("hackathon") ||
      normQ.includes("community") ||
      normA.includes("webinar") ||
      normA.includes("workshop") ||
      normA.includes("event") ||
      normA.includes("seminar") ||
      normA.includes("hackathon") ||
      normA.includes("community");

    if (isEventEntry) {
      score += 650; // Massive high-priority boost for matching event entries!
    } else {
      score -= 500; // Heavy penalty for unrelated address, contact, CEO, course, or fee entries!
    }
  } else {
    // Conversely, penalize event entries if the user is NOT asking about events/webinars
    const normQ = normalize(entry.question || "");
    if (entry.category === "events" || normQ.includes("webinar") || normQ.includes("workshop") || normQ.includes("seminar")) {
      score -= 200;
    }
  }

  // ── FRESHER ELIGIBILITY INTENT SCORING ──────────────────────────────────────
  const isFresherEligibilityQuery =
    (queryTokens.includes("fresher") || queryTokens.includes("freshers") || queryTokens.includes("beginner") || queryTokens.includes("beginners") || queryTokens.includes("experience")) &&
    (queryTokens.includes("join") || queryTokens.includes("eligible") || queryTokens.includes("eligibility") || queryTokens.includes("apply") || queryTokens.includes("enroll")) &&
    !queryTokens.includes("employee") &&
    !queryTokens.includes("hiring") &&
    !queryTokens.includes("fulltime") &&
    !queryTokens.includes("job") &&
    !queryTokens.includes("jobs");

  if (isFresherEligibilityQuery) {
    const isExpectedFresherAnswer = (entry.answer || "").includes("Yes. WeIntern programs are designed for students, beginners, and freshers.");
    const isGenericEmploymentFallback = (entry.answer || "").includes("The available information does not specify current employee or full-time job openings");

    if (isExpectedFresherAnswer) {
      score += 750; // Massive boost for exact expected answer!
    } else if (isGenericEmploymentFallback) {
      score -= 800; // Heavy penalty for generic employment fallback!
    } else if ((entry.question || "").toLowerCase().includes("fresher")) {
      score += 300;
    }
  }

  // ── EMPLOYMENT INTENT HIGH-PRIORITY SCORING ─────────────────────────────────
  const isEmploymentQuery =
    !isFresherEligibilityQuery &&
    (queryTokens.includes("employee") ||
    queryTokens.includes("employment") ||
    queryTokens.includes("hiring") ||
    (queryTokens.includes("work") && (queryTokens.includes("weintern") || queryTokens.includes("company") || queryTokens.includes("here") || queryTokens.includes("want"))) ||
    (queryTokens.includes("job") && (queryTokens.includes("opportunities") || queryTokens.includes("opportunity") || queryTokens.includes("vacancy") || queryTokens.includes("opening") || queryTokens.includes("apply") || queryTokens.includes("weintern") || queryTokens.includes("fulltime"))) ||
    queryTokens.includes("fulltime") ||
    (queryTokens.includes("hire") && (queryTokens.includes("interns") || queryTokens.includes("fresher") || queryTokens.includes("freshers"))));

  if (isEmploymentQuery) {
    if (entry.category === "employment") {
      score += 600;
    } else {
      score -= 450;
    }
  }

  // ── COURSES_LIST HIGH-PRIORITY SCORING ──────────────────────────────────────
  const isListQuery = isCoursesListQuery(rawQuery || queryTokens.join(" "), queryTokens);

  if (isListQuery) {
    const rawQText = String(entry.question || "").toLowerCase();
    const rawAText = String(entry.answer || "").toLowerCase();

    const isMasterCourseListEntry =
      rawQText.includes("what are the courses") ||
      rawQText.includes("what courses are available") ||
      rawQText.includes("which courses are available") ||
      rawQText.includes("all available internship domains") ||
      rawQText.includes("courses does weintern offer") ||
      rawQText.includes("what courses does weintern offer") ||
      (rawAText.includes("1. full stack") && rawAText.includes("2. mobile app") && rawAText.includes("3. ai"));

    if (isMasterCourseListEntry) {
      score += 650; // Massive high-priority booster for master course list!
    } else {
      // Heavy penalty for individual course entries, single course benefits, fees, CEO, company info
      if (entry.category === "courses" || entry.category === "domains" || entry.category === "fees" || entry.category === "benefits") {
        score -= 450;
      }
      if (entry.category === "company" && !rawQText.includes("what can i learn")) {
        score -= 450;
      }
      if (entry.category === "internship") {
        score -= 300;
      }
    }
  }

  // ── DOMAIN & ASPECT ROUTER SCORING ──────────────────────────────────────────
  const targetDomain = detectCourseDomain(rawQuery || queryTokens.join(" "), queryTokens);
  const targetAspect = detectQueryAspect(rawQuery || queryTokens.join(" "), queryTokens);
  const entryDomain = getEntryDomain(entry);

  if (targetDomain) {
    if (entryDomain === targetDomain) {
      score += 450; // Massive boost for matching the target domain!
    } else if (entryDomain && entryDomain !== targetDomain) {
      score -= 450; // Heavy penalty if entry belongs to a different domain!
    }

    // Heavy penalty for generic company/overview entries when asking about a specific domain
    if (entry.category === "company") {
      score -= 450;
    }
  }

  if (targetAspect) {
    const entryTextNorm = normalize(`${entry.question || ""} ${entry.answer || ""}`);

    if (targetAspect === "COURSE_CONTENT") {
      if (entryTextNorm.includes("include") || entryTextNorm.includes("syllabus") || entryTextNorm.includes("learn") || entryTextNorm.includes("covers") || entryTextNorm.includes("content") || entryTextNorm.includes("program priced") || entryTextNorm.includes("weeks") || entryTextNorm.includes("topics")) {
        score += 250;
      }
      if (entryTextNorm.includes("fee is") || entryTextNorm.includes("price is")) {
        score -= 100;
      }
    } else if (targetAspect === "COURSE_BENEFITS") {
      if (entry.category === "benefits" || entryTextNorm.includes("benefit") || entryTextNorm.includes("gain") || entryTextNorm.includes("perk") || entryTextNorm.includes("outcomes")) {
        score += 250;
      }
    } else if (targetAspect === "COURSE_FEES") {
      if (entry.category === "fees" || entryTextNorm.includes("fee") || entryTextNorm.includes("price") || entryTextNorm.includes("cost") || entryTextNorm.includes("₹")) {
        score += 250;
      }
    } else if (targetAspect === "COURSE_DURATION") {
      if (entry.category === "duration" || entryTextNorm.includes("duration") || entryTextNorm.includes("weeks") || entryTextNorm.includes("months")) {
        score += 250;
      }
    } else if (targetAspect === "COURSE_CERTIFICATE") {
      if (entry.category === "certificates" || entryTextNorm.includes("certificate") || entryTextNorm.includes("lor")) {
        score += 250;
      }
    }
  }

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

  // ── Negative penalty: Do NOT return company/CEO info for benefit/course/fee/internship queries ──
  const isBenefitOrOutcomeQuery = queryTokens.includes("benefit") || queryTokens.includes("benefits") || queryTokens.includes("perk") || queryTokens.includes("perks") || queryTokens.includes("outcome") || queryTokens.includes("outcomes") || queryTokens.includes("gain") || queryTokens.includes("receive") || queryTokens.includes("after");
  const isCourseOrInternshipQuery = queryTokens.includes("course") || queryTokens.includes("courses") || queryTokens.includes("internship") || queryTokens.includes("fee") || queryTokens.includes("fees") || queryTokens.includes("stipend") || isCertificateQuery;
  const isCompanyIdentityRequested = queryTokens.includes("ceo") || queryTokens.includes("founder") || queryTokens.includes("owner") || queryTokens.includes("ashwin") || queryTokens.includes("namita") || queryTokens.includes("address") || queryTokens.includes("location") || queryTokens.includes("office") || queryTokens.includes("founded") || queryTokens.includes("started");

  if ((isBenefitOrOutcomeQuery || isCourseOrInternshipQuery) && !isCompanyIdentityRequested) {
    if (entry.category === "company") {
      score -= 300; // Heavily penalise company/CEO entries when asking about benefits/courses/fees
    }
  }

  // ── Specific benefit queries boost ─────────────────────────────────────
  if (isBenefitOrOutcomeQuery && entry.category === "benefits") {
    score += 150;
  }

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

  if (hasAboutIntent && entry.category === "company" && !isCertificateQuery && !isBenefitOrOutcomeQuery && !isCourseOrInternshipQuery) {
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

  // Boost the specific "address" entry when address/office is asked
  const isAddressQuery = queryTokens.includes("address") || queryTokens.includes("office");
  if (isAddressQuery && entry.category === "company") {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("address") || normQ.includes("office") || normQ.includes("located")) {
      score += 120;
    }
  }

  // Boost the specific "ceo" entry when CEO is asked
  const isCeoQuery = queryTokens.includes("ceo");
  if (isCeoQuery && entry.category === "company") {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("ceo")) {
      score += 150;
    }
  }

  // Boost the specific "founder" entry when founder/owner/cofounder is asked
  const isFounderQuery = queryTokens.includes("founder") || queryTokens.includes("owner") || queryTokens.includes("cofounder");
  if (isFounderQuery && entry.category === "company") {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("founder") || normQ.includes("owner") || normQ.includes("cofounder")) {
      score += 120;
    }
  }

  // Boost the specific "what is weintern" entry for direct overview questions
  const isWhatIsWeInternQuery = (queryTokens.includes("what") || queryTokens.includes("tell") || queryTokens.includes("about") || queryTokens.includes("kya") || queryTokens.includes("who")) && queryTokens.includes("weintern") && !queryTokens.includes("address") && !queryTokens.includes("location") && !queryTokens.includes("ceo") && !queryTokens.includes("founder") && !queryTokens.includes("mission") && !queryTokens.includes("fee") && !queryTokens.includes("course") && !queryTokens.includes("domain") && !queryTokens.includes("certificate") && !queryTokens.includes("stipend") && !queryTokens.includes("placement") && !queryTokens.includes("data") && !queryTokens.includes("science");
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

  const isSpecificTopicAsked = queryTokens.includes("data") || queryTokens.includes("science") || queryTokens.includes("course") || queryTokens.includes("fee") || queryTokens.includes("domain") || queryTokens.includes("internship") || queryTokens.includes("certificate") || queryTokens.includes("placement") || queryTokens.includes("ceo") || queryTokens.includes("founder") || queryTokens.includes("address") || queryTokens.includes("location");

  if (
    hasAboutIntent &&
    entry.question &&
    normalize(entry.question).includes("what is weintern") &&
    queryTokens.includes("weintern") &&
    !isSpecificTopicAsked
  ) {
    score += 30;
  }

  // Domain Specificity Boosters:
  const isDataScienceQuery = queryTokens.includes("data") || queryTokens.includes("science") || queryTokens.includes("pandas") || queryTokens.includes("tableau");
  if (isDataScienceQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("data science")) {
      score += 200;
    } else if (entry.category === "company" && normQ.includes("what is weintern")) {
      score -= 150;
    }
  }

  const isFullStackQuery = queryTokens.includes("fullstack") || (queryTokens.includes("full") && queryTokens.includes("stack"));
  if (isFullStackQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("full stack")) {
      score += 200;
    } else if (entry.category === "company" && normQ.includes("what is weintern")) {
      score -= 150;
    }
  }

  const isUiUxQuery = queryTokens.includes("ui") || queryTokens.includes("ux") || queryTokens.includes("figma") || queryTokens.includes("design");
  if (isUiUxQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("ui") || normQ.includes("ux")) {
      score += 200;
    }
  }

  const isAiMlQuery = queryTokens.includes("ai") || queryTokens.includes("ml") || queryTokens.includes("automation") || queryTokens.includes("langchain") || queryTokens.includes("prompt");
  if (isAiMlQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("ai") || normQ.includes("automation")) {
      score += 200;
    }
  }

  const isDigitalMarketingQuery = queryTokens.includes("marketing") || queryTokens.includes("seo") || queryTokens.includes("digital");
  if (isDigitalMarketingQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("digital marketing") || normQ.includes("seo")) {
      score += 200;
    }
  }

  const isPythonQuery = queryTokens.includes("python");
  if (isPythonQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("python")) {
      score += 200;
    }
  }

  const isJavaQuery = queryTokens.includes("java") && !queryTokens.includes("javascript");
  if (isJavaQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("java")) {
      score += 200;
    }
  }

  // Specific course fee booster
  const isFeeQuery = queryTokens.includes("fee") || queryTokens.includes("fees") || queryTokens.includes("cost") || queryTokens.includes("price") || queryTokens.includes("structure");
  if (isFeeQuery && entry.category === "fees") {
    const normQ = normalize(entry.question || "");
    if (isDataScienceQuery && normQ.includes("data science")) score += 250;
    if (isFullStackQuery && normQ.includes("full stack")) score += 250;
    if (isUiUxQuery && normQ.includes("ui") && normQ.includes("ux")) score += 250;
    if (isAiMlQuery && normQ.includes("ai")) score += 250;
    if (isDigitalMarketingQuery && (normQ.includes("digital marketing") || normQ.includes("marketing"))) score += 250;
    if (isPythonQuery && normQ.includes("python")) score += 250;
    if (isJavaQuery && normQ.includes("java")) score += 250;
  }

  // ── IT Services & WeNexa PDF Q1-Q160 Boosters ──
  const isWeNexaQuery = queryTokens.includes("wenexa");
  if (isWeNexaQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("wenexa")) score += 300;
  }

  const isWebsiteServiceQuery = queryTokens.includes("website") || queryTokens.includes("websites") || queryTokens.includes("domain") || queryTokens.includes("hosting");
  if (isWebsiteServiceQuery && !isCourseQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("website") || normQ.includes("domain") || normQ.includes("hosting")) score += 180;
  }

  const isMobileAppServiceQuery = queryTokens.includes("flutter") || (queryTokens.includes("mobile") && queryTokens.includes("app")) || queryTokens.includes("playstore") || queryTokens.includes("play store") || queryTokens.includes("app store");
  if (isMobileAppServiceQuery && !isCourseQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("mobile app") || normQ.includes("flutter") || normQ.includes("play store") || normQ.includes("app store")) score += 180;
  }

  const isAiServiceQuery = queryTokens.includes("chatbot") || queryTokens.includes("chatbots") || (queryTokens.includes("ai") && queryTokens.includes("agent")) || queryTokens.includes("agents") || queryTokens.includes("rag");
  if (isAiServiceQuery && !isCourseQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("chatbot") || normQ.includes("agent") || normQ.includes("ai")) score += 180;
  }

  const isCustomSoftwareQuery = queryTokens.includes("crm") || queryTokens.includes("erp") || queryTokens.includes("hrms") || queryTokens.includes("inventory") || (queryTokens.includes("custom") && queryTokens.includes("software"));
  if (isCustomSoftwareQuery && !isCourseQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("software") || normQ.includes("crm") || normQ.includes("erp") || normQ.includes("hrms") || normQ.includes("custom")) score += 180;
  }

  const isNdaOrConsultationQuery = queryTokens.includes("nda") || queryTokens.includes("consultation") || queryTokens.includes("quote") || queryTokens.includes("quotation");
  if (isNdaOrConsultationQuery) {
    const normQ = normalize(entry.question || "");
    if (normQ.includes("nda") || normQ.includes("consultation") || normQ.includes("quote")) score += 250;
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

  const rawLower = message.toLowerCase();
  const hasPlanPrice = /7[,\s]?999/.test(rawLower) || (/\b999\b/.test(rawLower) && !/fees|fee|price|cost|how much/.test(rawLower));
  const hasCertContext = /plan|include|included|milega|milta|certificate|get|cert|lor/.test(rawLower);
  let strongCategory = detectStrongCategory(queryTokens);
  if (hasPlanPrice && hasCertContext && (strongCategory === null || strongCategory === "fees")) {
    strongCategory = "certificates";
  }

  // ── EXACT QUESTION MATCH SHORTCUT ────────────────────────────────────────
  const normalizedQuery = query.trim();

  // First priority: check exact match within the detected strong category
  if (strongCategory && knowledgeIndex[strongCategory]) {
    for (const entry of knowledgeIndex[strongCategory]) {
      const normEntryQ = normalize(entry.question || "").trim();
      if (normEntryQ === normalizedQuery) {
        const exactMatch = {
          category: strongCategory,
          question: entry.question || "",
          answer: entry.answer || "",
          score: 9999,
        };
        const contextText = `Category: ${strongCategory}. Question: ${entry.question}. Answer: ${entry.answer}`;
        console.log("EXACT MATCH SHORTCUT (Strong Category):", entry.question);
        return {
          query: normalizedQuery,
          matches: [exactMatch],
          topMatch: exactMatch,
          contextText,
          hasMatch: true,
        };
      }
    }
  }

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
          topMatch: exactMatch,
          contextText,
          hasMatch: true,
        };
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const isPlanCertQuery = hasPlanPrice && hasCertContext;
  const matches = [];

  Object.entries(knowledgeIndex).forEach(([category, entries]) => {
    entries.forEach((entry) => {
      let score = scoreMatch(entry, queryTokens, categoryHints, strongCategory, message);
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

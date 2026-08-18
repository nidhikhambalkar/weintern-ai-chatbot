const fs = require("fs");
const path = require("path");

const KB_DIR = path.join(__dirname, "..", "knowledge-base", "json");

// ── Stopwords for content-token extraction ──────────────────────────────────
const STOPWORDS = new Set([
  "do", "you", "provide", "what", "is", "the", "are", "can", "i", "get", "how", "does", "weintern",
  "for", "a", "an", "of", "in", "to", "on", "with", "by", "about", "tell", "me", "please", "will",
  "have", "my", "your", "any", "all", "kya", "hai", "h", "hain", "kaise", "batao", "jaana", "ko", "me",
  "par", "bhi", "hua", "karna", "karne", "chahiye", "chahie", "samjhao", "kaisa", "kitna", "kitne", "hindi",
  "kya", "hota", "hoti", "hote", "ke", "ki", "ka", "se", "naam", "bataiye", "batao"
]);

// ── Strict Typo & Synonym Map (NO destructive domain noun overrides!) ─────────
const TYPO_MAP = {
  // WeIntern brand typos
  weinterm: "weintern",
  weimterm: "weintern",
  weintarn: "weintern",
  weinternn: "weintern",
  weintrm: "weintern",
  weintrn: "weintern",
  wintern: "weintern",
  wenitern: "weintern",
  wigton: "weintern",
  vinturn: "weintern",
  vington: "weintern",
  vingten: "weintern",
  winturn: "weintern",
  weinturm: "weintern",
  weinturn: "weintern",
  weentern: "weintern",
  weentrn: "weintern",
  weintearn: "weintern",
  wee: "we",

  // Certificate typos
  certifcate: "certificate",
  certificat: "certificate",
  certficate: "certificate",
  certicate: "certificate",
  cretificate: "certificate",
  certiificate: "certificate",
  certifiate: "certificate",
  cerificate: "certificate",
  srtiphiket: "certificate",
  sartifiket: "certificate",

  // Registration typos
  regster: "register",
  resgister: "register",
  rgister: "register",
  registrtion: "registration",
  registation: "registration",
  resigtration: "registration",
  regsitration: "registration",

  // Internship typos
  internsip: "internship",
  internshp: "internship",
  intrnship: "internship",
  interniship: "internship",
  internshipe: "internship",
  internshipp: "internship",
  intenrship: "internship",

  // Placement typos
  placment: "placement",
  placemnt: "placement",
  palcement: "placement",
  plcement: "placement",
  placsment: "placement",

  // Stipend typos
  stipnd: "stipend",
  stpend: "stipend",
  stiend: "stipend",
  stipened: "stipend",
  stipent: "stipend",
  stepend: "stipend",
  stipond: "stipend",

  // Duration typos
  duraton: "duration",
  duartion: "duration",
  duraion: "duration",
  durtion: "duration",

  // Mentor typos
  mentr: "mentor",
  mntor: "mentor",
  metor: "mentor",

  // Domain typos
  doamin: "domain",
  domian: "domain",
  doman: "domain",

  // Course typos
  corse: "course",
  coure: "course",
  cource: "course",
  coures: "course",
  crouse: "course",

  // Fees typos
  feez: "fees",
  fes: "fees",
  phees: "fees",

  // Orientation & Syllabus typos
  orentation: "orientation",
  orientaton: "orientation",
  eligibilty: "eligibility",
  elgibility: "eligibility",
  elibility: "eligibility",
  eligibity: "eligibility",
  sylabus: "syllabus",
  syllbus: "syllabus",

  // Hinglish conversational terms
  chahiye: "want",
  chahie: "want",
  chiye: "want",
  batao: "tell",
  btao: "tell",
  bata: "tell",
  janna: "know",
  jaanta: "know",
  pata: "know",
  abhi: "now",
  dobara: "again",
  sab: "all",
  koi: "any",
  kuch: "some",
  vo: "that",
  woh: "that",
  mujhe: "me",
  meri: "my",
  mera: "my",
  smjhao: "explain",
  samjhao: "explain",
  kaise: "how",
  kya: "what",
  kab: "when",
  kyun: "why",
  kaun: "who",
  konsa: "which",
  konsi: "which",
  milta: "get",
  milte: "get",
  milega: "get"
};

// ── Clean and normalize string ────────────────────────────────────────────────
function cleanStr(text = "") {
  let t = String(text || "").toLowerCase().trim();

  // Handle multi-word WeIntern variants
  t = t.replace(
    /\b(v\s*intern|v-intern|w\s+intern|w-intern|wee\s+intern|wee\s+intrn|we\s+intern|we-intern|we\s+interne|we\s+interm|we\s+intrn|we\s+intrm|we\s+intent|way\s+intern|vee\s+intern|vee\s+intrn|vee\s+internship|v\s+internship|be\s+intern|beintern|weinternship|weinterm|weintern|weintrn|weintarn|weinternn|weimterm|weintrm|vington|vingten|vinturn|winturn|wintern|wenitern|weinturm|weinturn|weentern|weentrn|weintearn|wigton|vinton)\b/gi,
    "weintern"
  );

  // Clean non-alphanumeric (preserve +, #, /, Devanagari)
  t = t.replace(/[^a-z0-9+#\/\u0900-\u097F\s]/g, " ").replace(/\s+/g, " ").trim();

  if (!t) return "";

  // Apply TYPO_MAP substitutions token by token
  const tokens = t.split(" ").map((tok) => TYPO_MAP[tok] || tok);
  return tokens.join(" ").trim();
}

// ── Strip conversational question wrappers ────────────────────────────────────
function stripWrappers(text = "") {
  let t = cleanStr(text);
  t = t.replace(
    /^(can you explain|how does|i want to know about|kya|tell me about|what is|how to|does weintern|do you provide|do i get|can you tell me|what are|is there|are there|how can i|can i|give me|what|how|why|when|where|who)\s+/gi,
    ""
  );
  t = t.replace(
    /\s+(work|works|ke baare me jaana chahiye|ko hindi me samjhao|के बारे में बताओ|कैसे काम करता है|ke baare me batao|work work|karta hai|available|provided|included|details|info|information)\b/gi,
    ""
  );
  return t.trim();
}

// ── Extract Content Tokens (excluding Stopwords) ─────────────────────────────
function getContentTokens(text = "") {
  const cleaned = cleanStr(text);
  const words = cleaned.split(" ").filter(Boolean);
  return words.filter((w) => !STOPWORDS.has(w) && w.length > 1);
}

// ── Jaccard Token Similarity ──────────────────────────────────────────────────
function jaccardSimilarity(arr1 = [], arr2 = []) {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  if (set1.size === 0 || set2.size === 0) return 0;
  let intersection = 0;
  set1.forEach((w) => {
    if (set2.has(w)) intersection++;
  });
  const union = set1.size + set2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Levenshtein Distance for String Comparison ──────────────────────────────
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

function stringSimilarity(a = "", b = "") {
  const left = cleanStr(a);
  const right = cleanStr(b);
  if (left === right) return 1.0;
  const maxLen = Math.max(left.length, right.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(left, right);
  return 1 - dist / maxLen;
}

// ── Read JSON File Safely ─────────────────────────────────────────────────────
function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    if (!fileContent.trim()) return [];
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.entries)) return parsed.entries;
    return [];
  } catch (error) {
    return [];
  }
}

// ── Build Knowledge Index ──────────────────────────────────────────────────────
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

// Flattened list of all 1979 FAQ entries with precomputed tokens
const ALL_FAQ_ENTRIES = [];
Object.entries(knowledgeIndex).forEach(([category, entries]) => {
  entries.forEach((entry) => {
    const question = entry.question || entry.title || "";
    const answer = entry.answer || entry.description || "";
    ALL_FAQ_ENTRIES.push({
      category,
      question,
      answer,
      rawCleanQ: cleanStr(question),
      strippedQ: stripWrappers(question),
      contentTokens: getContentTokens(question),
      fullTokens: cleanStr(question).split(" ").filter(Boolean),
    });
  });
});

// Fast lookup map by exact clean question
const EXACT_RAW_MAP = new Map();
const EXACT_STRIPPED_MAP = new Map();

ALL_FAQ_ENTRIES.forEach((faq) => {
  if (faq.rawCleanQ && !EXACT_RAW_MAP.has(faq.rawCleanQ)) {
    EXACT_RAW_MAP.set(faq.rawCleanQ, faq);
  }
  if (faq.strippedQ && !EXACT_STRIPPED_MAP.has(faq.strippedQ)) {
    EXACT_STRIPPED_MAP.set(faq.strippedQ, faq);
  }
});

// ── Core Retrieval & Search Knowledge Base Engine ─────────────────────────────
function searchKnowledgeBase(message = "") {
  const rawQuery = String(message || "").trim();
  if (!rawQuery) {
    return { query: "", matches: [], contextText: "", hasMatch: false };
  }

  const queryClean = cleanStr(rawQuery);
  const queryStripped = stripWrappers(rawQuery);
  const queryContentTokens = getContentTokens(rawQuery);
  const queryFullTokens = queryClean.split(" ").filter(Boolean);

  // ── TIER 1: Exact Raw Clean Question Match (Score = 10,000) ───────────────
  if (EXACT_RAW_MAP.has(queryClean)) {
    const exactMatch = EXACT_RAW_MAP.get(queryClean);
    const resultItem = {
      category: exactMatch.category,
      question: exactMatch.question,
      answer: exactMatch.answer,
      score: 10000,
    };
    return {
      query: queryClean,
      matches: [resultItem],
      topMatch: resultItem,
      contextText: `Category: ${exactMatch.category}. Question: ${exactMatch.question}. Answer: ${exactMatch.answer}`,
      hasMatch: true,
    };
  }

  // ── TIER 2: Exact Stripped Question Match (Score = 9,999) ──────────────────
  if (queryStripped && EXACT_STRIPPED_MAP.has(queryStripped)) {
    const strippedMatch = EXACT_STRIPPED_MAP.get(queryStripped);
    const resultItem = {
      category: strippedMatch.category,
      question: strippedMatch.question,
      answer: strippedMatch.answer,
      score: 9999,
    };
    return {
      query: queryClean,
      matches: [resultItem],
      topMatch: resultItem,
      contextText: `Category: ${strippedMatch.category}. Question: ${strippedMatch.question}. Answer: ${strippedMatch.answer}`,
      hasMatch: true,
    };
  }

  // ── TIER 3: Content-Token Jaccard & String Similarity Matching ─────────────
  const scoredMatches = [];

  ALL_FAQ_ENTRIES.forEach((faq) => {
    let score = 0;

    // A. Full string similarity check
    const strSim = stringSimilarity(queryClean, faq.rawCleanQ);
    if (strSim >= 0.88) {
      score = 9500 + strSim * 400;
    } else {
      // B. Content token Jaccard similarity
      const contentJaccard = jaccardSimilarity(queryContentTokens, faq.contentTokens);
      // C. Full token Jaccard similarity
      const fullJaccard = jaccardSimilarity(queryFullTokens, faq.fullTokens);

      const combinedSim = contentJaccard * 0.7 + fullJaccard * 0.3;

      if (combinedSim >= 0.4) {
        score = 8000 + combinedSim * 1500;
      } else if (contentJaccard >= 0.5) {
        score = 7500 + contentJaccard * 1000;
      } else {
        // Topic keyword boosters
        let hitCount = 0;
        queryContentTokens.forEach((token) => {
          if (faq.contentTokens.includes(token)) {
            hitCount++;
          }
        });
        if (hitCount > 0 && faq.contentTokens.length > 0) {
          score = (hitCount / Math.max(queryContentTokens.length, 1)) * 50;
        }
      }
    }

    if (score >= 18) {
      scoredMatches.push({
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        score,
      });
    }
  });

  scoredMatches.sort((a, b) => b.score - a.score);

  if (scoredMatches.length > 0) {
    const topMatches = scoredMatches.slice(0, 4);
    const contextText = topMatches
      .map((match) => `Category: ${match.category}. Question: ${match.question}. Answer: ${match.answer}`)
      .join("\n");

    return {
      query: queryClean,
      matches: topMatches,
      topMatch: topMatches[0],
      contextText,
      hasMatch: true,
    };
  }

  return {
    query: queryClean,
    matches: [],
    contextText: "",
    hasMatch: false,
  };
}

module.exports = {
  searchKnowledgeBase,
  buildKnowledgeIndex,
};

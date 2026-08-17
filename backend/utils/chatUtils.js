function transliterateDevanagari(text) {
  if (!text) return "";
  const cleanText = text.replace(/्/g, "");
  const mapping = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ः': 'h',
    'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'ऑ': 'o', 'ऋ': 'ri'
  };
  
  let result = "";
  for (const char of cleanText) {
    result += mapping[char] || char;
  }
  return result;
}

function normalizeSpokenText(text) {
  if (!text) return "";
  let normalized = text;

  // Transliterate if Devanagari (Hindi/Marathi script) is detected
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) {
    normalized = transliterateDevanagari(text);
  }

  // 1. Normalize WeIntern name variations (case-insensitive)
  const weinternRegexes = [
    /\b(v\s*intern|v-intern|vinemtn|vinton|weimterm|weintarn|weintrn|weinternn|wee\s+intern|wee\s+intrn)\b/gi,
    /\b(be\s*intern|beintern|way\s*intern|we\s+intent|we\s+entered|vee\s+intern|vee\s+intrn|vee\s+internship|v\s+internship)\b/gi,
    /\b(we\s+entered\s+in|we\s+internship)\b/gi,
  ];
  weinternRegexes.forEach((regex) => {
    normalized = normalized.replace(regex, "WeIntern");
  });

  // 2. Normalize LOR variations
  const lorRegexes = [
    /\b(hello\s+r|hello\s+are|yellow\s+are|el\s+o\s+are|el\s+o\s+r|ell\s+o\s+are|elora|eller|alore|l\s+o\s+r)\b/gi,
    /\b(recommendation\s+letter|letter\s+of\s+recommendation)\b/gi,
  ];
  lorRegexes.forEach((regex) => {
    normalized = normalized.replace(regex, "LOR");
  });

  // 3. Normalize EMI variations
  const emiRegexes = [
    /\b(e\s+m\s+i|e\.m\.i\.|ami|emi)\b/gi,
  ];
  emiRegexes.forEach((regex) => {
    normalized = normalized.replace(regex, "EMI");
  });

  // 4. Normalize common typos and misspellings
  normalized = normalized.replace(/\b(internshp|internsip|intership|internhip|intermship|imtenshop)\b/gi, "internship");
  normalized = normalized.replace(/\b(benifits|benfits|benifit)\b/gi, "benefits");
  normalized = normalized.replace(/\b(datascience|data\s+scince|datascince|datasciense|datasince)\b/gi, "Data Science");
  normalized = normalized.replace(/\b(fullstak|full\s+stackk|fullstack|fullstam|fullstackkkk)\b/gi, "Full Stack");
  normalized = normalized.replace(/\b(certficate|certifcate|certicate)\b/gi, "certificate");
  normalized = normalized.replace(/\b(stipendd|stipand|stipond|stipent|stepend)\b/gi, "stipend");
  normalized = normalized.replace(/\b(coursee|cours|cource|corse)\b/gi, "course");
  normalized = normalized.replace(/\b(feess|fess|feez|phees)\b/gi, "fees");
  normalized = normalized.replace(/\bashin\s+gurao\b/gi, "Ashwin Gurao");

  // 5. Map common transliterated Hindi/Marathi words to standard English keywords
  normalized = normalized.replace(/\bsrtiphiket\b/gi, "certificate");
  normalized = normalized.replace(/\bsartifiket\b/gi, "certificate");
  normalized = normalized.replace(/\bintrn\b/gi, "internship");
  normalized = normalized.replace(/\b(kaam|kam)\b/gi, "work");

  return normalized;
}

function sanitizeMessage(input = "") {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return "";
  }

  const normalized = normalizeSpokenText(raw);
  return normalized.replace(/\s+/g, " ").slice(0, 500);
}

function shouldUseKbFastPath(context = {}) {
  const topMatch = context?.matches?.[0];
  if (!context?.hasMatch || !topMatch) {
    return false;
  }

  return Number(topMatch.score || 0) >= 18;
}

function buildKbFastPayload(message, context) {
  const topMatch = context?.matches?.[0];

  if (!topMatch) {
    return null;
  }

  return {
    success: true,
    reply: topMatch.answer,
    mode: "kb-fast",
    escalation: false,
    recommendedAction: "Continue with the guided answer.",
    knowledgeMatches: context.matches.slice(0, 4).map((match) => ({
      category: match.category,
      question: match.question,
      answer: match.answer,
    })),
  };
}

function buildErrorPayload(statusCode = 500, message = "Unable to process your request right now.") {
  return {
    success: false,
    error: message,
    statusCode,
  };
}

module.exports = {
  sanitizeMessage,
  shouldUseKbFastPath,
  buildKbFastPayload,
  buildErrorPayload,
};

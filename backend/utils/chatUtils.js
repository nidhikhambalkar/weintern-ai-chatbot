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

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalizeSpokenText(text) {
  if (!text) return "";
  let normalized = text;

  // Transliterate if Devanagari (Hindi/Marathi script) is detected
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) {
    normalized = transliterateDevanagari(text);
  }

  // 1. Normalize WeIntern name variations (case-insensitive comprehensive master regex)
  const weinternRegexes = [
    /\b(v\s*intern|v-intern|w\s+intern|w-intern|wee\s+intern|wee\s+intrn|we\s+intern|we-intern|we\s+interne|we\s+interm|we\s+intrn|we\s+intrm|we\s+intent|we\s+entered|we\s+entered\s+in|way\s+intern|vee\s+intern|vee\s+intrn|vee\s+internship|v\s+internship|be\s+intern|beintern|weinternship|weinterm|weintern|weintrn|weintarn|weinternn|weimterm|weintrm|vington|vingten|vinturn|winturn|wintern|wenitern|weinturm|weinturn|weentern|weentrn|weintearn|wigton|vinemtn|vinton)\b/gi,
  ];
  weinternRegexes.forEach((regex) => {
    normalized = normalized.replace(regex, "WeIntern");
  });

  // Fuzzy Levenshtein correction for 1 or 2 character typos/mishearings of WeIntern
  const words = normalized.split(/\s+/);
  const correctedWords = words.map((word) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    if (cleanWord.length >= 6 && cleanWord.length <= 11 && (cleanWord.startsWith("w") || cleanWord.startsWith("v"))) {
      if (levenshteinDistance(cleanWord, "weintern") <= 2) {
        return "WeIntern";
      }
    }
    return word;
  });
  normalized = correctedWords.join(" ");

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
  normalized = normalized.replace(/\b(jenyuin|jenuin|jenuine)\b/gi, "genuine");
  normalized = normalized.replace(/\b(kors|cource|corse)\b/gi, "course");
  normalized = normalized.replace(/\b(rikorded|rikॉrded|recoded)\b/gi, "recorded");
  normalized = normalized.replace(/\b(seshns|seshon|seshons)\b/gi, "sessions");

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

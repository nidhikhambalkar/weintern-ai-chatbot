function sanitizeMessage(input = "") {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return "";
  }

  return raw.replace(/\s+/g, " ").slice(0, 500);
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

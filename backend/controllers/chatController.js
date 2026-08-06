const { searchKnowledgeBase } = require("../services/knowledgeBaseService");
const { generateChatResponse } = require("../services/ollamaService");
const {
  sanitizeMessage,
  shouldUseKbFastPath,
  buildKbFastPayload,
  buildErrorPayload,
} = require("../utils/chatUtils");

function detectEscalation(message = "") {
  const lower = String(message).toLowerCase();
  const triggers = {
    refund: /refund|money back|charge|fee issue/i.test(lower),
    complaint: /complaint|issue|problem|not working|bad experience|disappointed/i.test(lower),
    escalation: /escalat|human|agent|support team|talk to person|representative/i.test(lower),
  };

  return Object.entries(triggers)
    .filter(([, value]) => value)
    .map(([key]) => key);
}

exports.chat = async (req, res) => {
  const startTime = Date.now();

try {
  const message = sanitizeMessage(req.body?.message);

  if (!message) {
    return res.status(400).json(buildErrorPayload(400, "message is required in request body"));
  }

  const greetingRegex = /^(hi|hello|hey|hii|hiii|hy|good morning|good afternoon|good evening)$/i;

  if (greetingRegex.test(message.trim())) {
    return res.json({
      success: true,
      reply:
        "Hello! 👋 Welcome to WeIntern.\nHow can I help you today regarding internships, courses or placement assistance?",
      mode: "greeting",
      escalation: false,
      recommendedAction: "Continue with the guided conversation.",
      knowledgeMatches: [],
      responseTimeMs: Date.now() - startTime,
    });
  }

  const knowledgeContext = searchKnowledgeBase(message);
  const escalation = detectEscalation(message);

  if (shouldUseKbFastPath(knowledgeContext)) {
    const kbFastReply = buildKbFastPayload(message, knowledgeContext);
    return res.json({
      ...kbFastReply,
      escalation: escalation.length > 0 ? escalation : false,
      recommendedAction:
        escalation.length > 0
          ? "Please contact support or raise a human escalation request."
          : "Continue with the guided answer.",
      responseTimeMs: Date.now() - startTime,
    });
  }


    const modelResult = await generateChatResponse({
      message,
      context: knowledgeContext,
    });

    return res.json({
      success: true,
      reply: modelResult.response,
      mode: modelResult.mode,
      escalation: escalation.length > 0 ? escalation : false,
      recommendedAction: escalation.length > 0 ? "Please contact support or raise a human escalation request." : "Continue with the guided answer.",
      knowledgeMatches: knowledgeContext.matches.map((match) => ({
        category: match.category,
        question: match.question,
        answer: match.answer,
      })),
      responseTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Chat controller error:", error);
    return res.status(500).json({
      ...buildErrorPayload(500, "Unable to process your request right now."),
      responseTimeMs: Date.now() - startTime,
    });
  }
};

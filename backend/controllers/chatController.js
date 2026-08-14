const { searchKnowledgeBase } = require("../services/knowledgeBaseService");
const { generateChatResponse } = require("../services/ollamaService");
const { detectIntent } = require("../services/intentService");
const { getCollection, getIsDbConnected, inMemoryDb } = require("../database/db");
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

async function saveMessageToHistory(sessionId, sender, messageText, source = "text", voiceMetadata = null) {
  if (!sessionId) return;
  try {
    if (getIsDbConnected()) {
      const sessionsCollection = getCollection("sessions");
      const messagesCollection = getCollection("messages");

      if (sessionsCollection) {
        await sessionsCollection.updateOne(
          { session_id: sessionId },
          { $setOnInsert: { session_id: sessionId, created_at: new Date() } },
          { upsert: true }
        );
      }

      if (messagesCollection) {
        await messagesCollection.insertOne({
          session_id: sessionId,
          sender,
          message: messageText,
          source,
          voice_metadata: voiceMetadata,
          timestamp: new Date(),
        });
      }
    } else {
      if (!inMemoryDb.sessions.some((s) => s.session_id === sessionId)) {
        inMemoryDb.sessions.push({ session_id: sessionId, created_at: new Date().toISOString() });
      }
      inMemoryDb.messages.push({
        id: inMemoryDb.autoId.messages++,
        session_id: sessionId,
        sender,
        message: messageText,
        source,
        voice_metadata: voiceMetadata,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to save message to history:", error.message);
  }
}

exports.chat = async (req, res) => {
  const startTime = Date.now();

  try {
    const message = sanitizeMessage(req.body?.message);
    const sessionId = req.body?.session_id || req.body?.sessionId;
    const source = req.body?.source || "text";
    const voiceMetadata = req.body?.voice_metadata || req.body?.voiceMetadata || null;

    console.log(`User Question: "${message}" [Source: ${source}, Session: ${sessionId}]`);

    if (!message) {
      return res.status(400).json(buildErrorPayload(400, "message is required in request body"));
    }

    // Save user's message to history
    if (sessionId) {
      await saveMessageToHistory(sessionId, "user", message, source, voiceMetadata);
    }

    const intent = detectIntent(message);

    if (intent.type !== "weintern") {
      const replyText = intent.response;
      if (sessionId) {
        await saveMessageToHistory(sessionId, "bot", replyText, "text", null);
      }
      return res.json({
        success: true,
        reply: replyText,
        mode: intent.type,
        escalation: false,
        recommendedAction:
          intent.type === "greeting"
            ? "Continue with the guided conversation."
            : "Please ask a WeIntern-related question.",
        knowledgeMatches: [],
        responseTimeMs: Date.now() - startTime,
      });
    }

    const knowledgeContext = searchKnowledgeBase(message);
    const escalation = detectEscalation(message);

    if (shouldUseKbFastPath(knowledgeContext)) {
      const kbFastReply = buildKbFastPayload(message, knowledgeContext);
      const replyText = kbFastReply.reply;
      if (sessionId) {
        await saveMessageToHistory(sessionId, "bot", replyText, "text", null);
      }
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

    const replyText = modelResult.response;
    if (sessionId) {
      await saveMessageToHistory(sessionId, "bot", replyText, "text", null);
    }

    return res.json({
      success: true,
      reply: replyText,
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
    console.error("========== CHAT CONTROLLER ERROR ==========");
    console.error(error);
    console.error(error.stack);
    console.error("===========================================");

    return res.status(500).json({
      ...buildErrorPayload(500, "Unable to process your request right now."),
      responseTimeMs: Date.now() - startTime,
    });
  }
};
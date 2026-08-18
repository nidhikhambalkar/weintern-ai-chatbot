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

// Session topic memory for resolving follow-up queries (pronouns like "its benefits", "how long is it")
const sessionTopicMap = new Map();

function extractTopicFromQuery(query = "", matchResult = null) {
  const q = query.toLowerCase();
  if (q.includes("data science")) return "Data Science";
  if (q.includes("full stack") || q.includes("fullstack")) return "Full Stack Web Development";
  if (q.includes("ui") || q.includes("ux") || q.includes("figma")) return "UI/UX Design";
  if (q.includes("ai") || q.includes("automation") || q.includes("ml")) return "AI & Automation";
  if (q.includes("digital marketing") || q.includes("seo")) return "Digital Marketing";
  if (q.includes("python")) return "Python Programming";
  if (q.includes("java") && !q.includes("javascript")) return "Java Programming";
  if (q.includes("c/c++") || q.includes("c++") || q.includes("cpp")) return "C/C++ Programming";
  if (q.includes("cloud")) return "Cloud Computing";
  if (q.includes("flutter") || q.includes("mobile app")) return "Mobile App Development";
  if (q.includes("6-month") || q.includes("6 month")) return "6-month internship";
  if (q.includes("3-month") || q.includes("3 month")) return "3-month internship";
  if (q.includes("internship")) return "internship";

  if (matchResult && matchResult.matches && matchResult.matches[0]) {
    const qText = matchResult.matches[0].question.toLowerCase();
    if (qText.includes("data science")) return "Data Science";
    if (qText.includes("full stack")) return "Full Stack Web Development";
    if (qText.includes("ui/ux")) return "UI/UX Design";
    if (qText.includes("ai")) return "AI & Automation";
    if (qText.includes("digital marketing")) return "Digital Marketing";
    if (qText.includes("python")) return "Python Programming";
    if (qText.includes("java")) return "Java Programming";
    if (qText.includes("c/c++")) return "C/C++ Programming";
    if (qText.includes("6-month") || qText.includes("6 month")) return "6-month internship";
    if (qText.includes("3-month") || qText.includes("3 month")) return "3-month internship";
  }

  return null;
}

function resolveFollowUpQuery(message, sessionId) {
  if (!sessionId || !sessionTopicMap.has(sessionId)) return message;
  const lastTopic = sessionTopicMap.get(sessionId);
  if (!lastTopic) return message;

  const lower = message.toLowerCase();
  const hasPronounFollowUp =
    /\b(its|it|itself|this|that)\b/.test(lower) ||
    /^(what are its|how long is|what is the fee for|fee for it|benefits of it|what do i get from it|tell me its)\b/.test(lower) ||
    (lower.includes("benefits") && !lower.includes("course") && !lower.includes("internship") && !lower.includes("weintern")) ||
    (lower.includes("duration") && !lower.includes("course") && !lower.includes("internship")) ||
    (lower.includes("fee") && !lower.includes("course") && !lower.includes("internship"));

  if (hasPronounFollowUp) {
    if (lower.includes("benefit") || lower.includes("perk")) {
      return `What are the benefits of ${lastTopic}?`;
    }
    if (lower.includes("duration") || lower.includes("how long") || lower.includes("time")) {
      return `What is the duration of ${lastTopic}?`;
    }
    if (lower.includes("fee") || lower.includes("cost") || lower.includes("price")) {
      return `What is the fee for ${lastTopic}?`;
    }
    return `${message} ${lastTopic}`;
  }

  return message;
}

exports.chat = async (req, res) => {
  const startTime = Date.now();

  try {
    const rawMessage = sanitizeMessage(req.body?.message);
    const sessionId = req.body?.session_id || req.body?.sessionId;
    const source = req.body?.source || "text";
    const voiceMetadata = req.body?.voice_metadata || req.body?.voiceMetadata || null;

    if (!rawMessage) {
      return res.status(400).json(buildErrorPayload(400, "message is required in request body"));
    }

    const message = resolveFollowUpQuery(rawMessage, sessionId);
    console.log(`User Question: "${rawMessage}" -> Resolved: "${message}" [Source: ${source}, Session: ${sessionId}]`);

    // Save user's message to history
    if (sessionId) {
      await saveMessageToHistory(sessionId, "user", rawMessage, source, voiceMetadata);
    }

    const knowledgeContext = searchKnowledgeBase(message);
    const escalation = detectEscalation(message);

    const detectedTopic = extractTopicFromQuery(message, knowledgeContext);
    if (sessionId && detectedTopic) {
      sessionTopicMap.set(sessionId, detectedTopic);
    }

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
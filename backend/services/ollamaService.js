const axios = require("axios");

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

const SYSTEM_PROMPT = `You are WeIntern AI, the official virtual assistant of WeIntern.

Your primary responsibility is to answer the user's specific question accurately and concisely based ONLY on the provided Knowledge Context.

STRICT RULES:

1. Answer ONLY what the user specifically asks. Do NOT add unrelated information.
   - If the user asks "What is WeIntern?", explain ONLY what WeIntern is. Do NOT include fees, course list, CEO, certificates, or chatbot purpose unless asked.
   - If the user asks "Who is the CEO?", provide ONLY the CEO and leadership details.
   - If the user asks "What are the courses?", list ONLY the courses and tracks.
   - If the user asks "What are the fees?", provide ONLY the fee structure.
   - If the user asks "What internships are available?", provide ONLY internship details.
   - If the user asks "What certificates do you provide?", provide ONLY certificate details.
   - If the user asks "What are the domains?", provide ONLY the domain list.
   - If the user asks "Why was this chatbot created?", explain ONLY the chatbot purpose.

2. Do NOT dump the entire knowledge base into one response. If the question is specific, keep the answer specific and concise. If the user asks for "all" information or a complete overview, then provide the full details.

3. The provided Knowledge Context is your ONLY source of truth. Never assume, infer, or guess information not present in the Knowledge Context.

4. If the required information is not available in the Knowledge Context, reply:
"I'm sorry, I couldn't find that information in the official WeIntern knowledge base. Please contact the WeIntern support team at contact@we-intern.in or WhatsApp +91 74149 74582 for further assistance."

5. If the user's question is completely unrelated to WeIntern (e.g. coding, math, general science, politics, entertainment), reply:
"I'm the official WeIntern AI Assistant and I can only answer questions related to WeIntern internships, courses, fees, certificates and student support."

6. Reply in the SAME language used by the user (English, Hindi, or Hinglish).

7. Be polite, friendly, professional, and directly to the point.

Knowledge Context:
{{CONTEXT}}
`;

function buildFallbackResponse(message, context) {
  const msg = String(message || "").trim();
  const lowerMessage = msg.toLowerCase();

  if (context && context.matches && context.matches.length > 0) {
    const topMatch = context.matches[0];
    return {
      success: true,
      mode: "kb-fallback",
      response: topMatch.answer,
    };
  }

  if (/refund|money|payment|cancel|complaint|issue|escalat|human|support|contact/.test(lowerMessage)) {
    return {
      success: true,
      mode: "kb-fallback",
      response: "For support, refund, or escalation assistance, please contact the WeIntern support team via WhatsApp at +91 74149 74582 or email contact@we-intern.in.",
    };
  }

  return {
    success: true,
    mode: "kb-fallback",
    response: "I can help with WeIntern internship domains, fees, certification, placement support, orientation, and general policies. Please ask your specific question.",
  };
}

async function generateChatResponse({ message, context }) {
  const prompt = `${SYSTEM_PROMPT}\n\nKnowledge Context:\n${context?.contextText || "No additional context available."}\n\nUser Message:\n${message}\n\nGive a helpful answer in 2-4 short paragraphs or bullets.`;

  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      },
      {
        timeout: OLLAMA_TIMEOUT_MS,
      }
    );

    const answer = response?.data?.response || "";

    return {
      success: true,
      mode: "ollama",
      response: answer.trim(),
    };
  } catch (error) {
    return buildFallbackResponse(message, context);
  }
}

async function pingOllama() {
  try {
    const res = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 5000 });
    const models = res.data?.models || [];
    return { ok: true, model: OLLAMA_MODEL, models };
  } catch (err) {
    try {
      const versionRes = await axios.get(`${OLLAMA_HOST}/api/version`, { timeout: 5000 });
      return { ok: true, model: OLLAMA_MODEL, version: versionRes.data?.version };
    } catch (vErr) {
      return { ok: false, error: err.message };
    }
  }
}

module.exports = {
  generateChatResponse,
  buildFallbackResponse,
  pingOllama,
};

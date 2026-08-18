const axios = require("axios");

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 5000);

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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

7. Be polite, friendly, professional, and directly to the point. Give complete, grammatically correct sentences.
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
  const startTime = Date.now();

  // 1. Try Groq API if configured (Ultra-fast cloud Llama 3 model)
  if (GROQ_API_KEY) {
    try {
      console.log(`[AI Service] Calling Groq API (${GROQ_MODEL}) for query: "${message.substring(0, 40)}..."`);
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT.replace("{{CONTEXT}}", context?.contextText || "") },
            { role: "user", content: message },
          ],
          temperature: 0.2,
        },
        {
          headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
          timeout: 8000,
        }
      );
      const answer = res.data?.choices?.[0]?.message?.content || "";
      if (answer.trim()) {
        console.log(`[AI Service] Groq LLM response generated in ${Date.now() - startTime}ms`);
        return { success: true, mode: "groq-llama3", response: answer.trim() };
      }
    } catch (err) {
      console.warn(`[AI Service] Groq API call failed (${err.message}). Trying fallbacks...`);
    }
  }

  // 2. Try OpenAI API if configured
  if (OPENAI_API_KEY) {
    try {
      console.log(`[AI Service] Calling OpenAI API (${OPENAI_MODEL}) for query: "${message.substring(0, 40)}..."`);
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT.replace("{{CONTEXT}}", context?.contextText || "") },
            { role: "user", content: message },
          ],
          temperature: 0.2,
        },
        {
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          timeout: 8000,
        }
      );
      const answer = res.data?.choices?.[0]?.message?.content || "";
      if (answer.trim()) {
        console.log(`[AI Service] OpenAI LLM response generated in ${Date.now() - startTime}ms`);
        return { success: true, mode: "openai", response: answer.trim() };
      }
    } catch (err) {
      console.warn(`[AI Service] OpenAI API call failed (${err.message}). Trying fallbacks...`);
    }
  }

  // 3. Try Gemini API if configured
  if (GEMINI_API_KEY) {
    try {
      console.log(`[AI Service] Calling Gemini API for query: "${message.substring(0, 40)}..."`);
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: `${SYSTEM_PROMPT.replace("{{CONTEXT}}", context?.contextText || "")}\n\nUser Question: ${message}` }],
            },
          ],
        },
        { timeout: 8000 }
      );
      const answer = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (answer.trim()) {
        console.log(`[AI Service] Gemini LLM response generated in ${Date.now() - startTime}ms`);
        return { success: true, mode: "gemini", response: answer.trim() };
      }
    } catch (err) {
      console.warn(`[AI Service] Gemini API call failed (${err.message}). Trying fallbacks...`);
    }
  }

  // 4. Try Ollama (local dev or remote host)
  const isLocalOllamaHost = OLLAMA_HOST.includes("localhost") || OLLAMA_HOST.includes("127.0.0.1");
  const isCloudProduction = process.env.NODE_ENV === "production" && isLocalOllamaHost;

  if (!isCloudProduction) {
    try {
      console.log(`[AI Service] Requesting Ollama (${OLLAMA_MODEL}) response for: "${message.substring(0, 40)}..."`);
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

      const duration = Date.now() - startTime;
      const answer = response?.data?.response || "";

      if (answer && answer.trim().length > 0) {
        console.log(`[AI Service] Ollama LLM generation completed successfully in ${duration}ms`);
        return {
          success: true,
          mode: "ollama",
          response: answer.trim(),
        };
      }
    } catch (error) {
      console.warn(`[AI Service] Ollama unavailable/failed (${error.message}). Utilizing Knowledge Base fallback.`);
    }
  }

  // 5. Intelligent Knowledge Base Synthesizer Fallback
  return buildFallbackResponse(message, context);
}

async function pingOllama() {
  if (GROQ_API_KEY) return { ok: true, provider: "groq", model: GROQ_MODEL };
  if (OPENAI_API_KEY) return { ok: true, provider: "openai", model: OPENAI_MODEL };
  if (GEMINI_API_KEY) return { ok: true, provider: "gemini", model: "gemini-1.5-flash" };

  try {
    const res = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 3000 });
    const models = res.data?.models || [];
    return { ok: true, provider: "ollama", model: OLLAMA_MODEL, models };
  } catch (err) {
    try {
      const versionRes = await axios.get(`${OLLAMA_HOST}/api/version`, { timeout: 3000 });
      return { ok: true, provider: "ollama", model: OLLAMA_MODEL, version: versionRes.data?.version };
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

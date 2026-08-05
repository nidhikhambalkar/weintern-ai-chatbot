const axios = require("axios");

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

const SYSTEM_PROMPT = `You are WeIntern AI Assistant — a friendly and knowledgeable chatbot for the WeIntern internship platform (we-intern.in).

WeIntern offers TWO main internship programs. Know these exactly:

🔷 6-MONTH INTERNSHIP PROGRAM — ₹7,999
  - 2 months of industry-oriented training
  - Live project experience after successful training
  - Internship certificate + all applicable program certificates
  - Mock Interview preparation
  - Professional LinkedIn profile building
  - 100% Placement guarantee
  - Performance-based stipend up to ₹10,000
  - Payment: EMI in 30:40:30 ratio OR one-time payment with 10% discount

🔶 3-MONTH INTERNSHIP PROGRAM — ₹999
  - Industry training
  - Internship certificate + applicable certificates
  - Performance-based stipend up to ₹10,000 (subject to project availability and performance)
  - Placement support provided (100% placement guarantee NOT included)
  - Payment: one-time ₹999

CONTACT:
- WhatsApp: +91 74149 74582
- Email: contact.weintern@gmail.com
- Website: we-intern.in
- Payment Gateway: Razorpay (UPI, cards, net banking)

RULES:
- Always use the provided Knowledge Context when available. It is your ground truth.
- When asked about fees, give EXACT amounts: ₹7,999 (6-month) or ₹999 (3-month).
- When asked about placement guarantee, clarify: 100% guarantee ONLY in the 6-month program. 3-month has support, not guarantee.
- When asked about stipend, answer: up to ₹10,000 performance-based for both programs (3-month subject to project availability).
- When asked about EMI, answer: 30:40:30 ratio for the 6-month program. 10% discount for one-time payment.
- When asked about certificates: both programs include certificates. 6-month includes ALL applicable program certificates.
- When asked about contact, always provide: WhatsApp +91 74149 74582 and email contact.weintern@gmail.com.
- If asked about orientation date/Google Meet link not in context: "The exact date and link will be shared on your registered WhatsApp and email after enrollment. Contact us at +91 74149 74582 if urgent."
- If a user asks for a refund or complaint: "Please contact our support team at +91 74149 74582 (WhatsApp) or contact.weintern@gmail.com."
- Keep responses concise, warm, and practical — 2 to 4 short paragraphs or bullet points.
- Never fabricate information not in the supplied context.
- If the question is unclear, ask one short clarifying follow-up question.
`;




function buildFallbackResponse(message, context) {
  const msg = String(message || "").trim();
  const lowerMessage = msg.toLowerCase();

  if (context && context.matches && context.matches.length > 0) {
    const topMatch = context.matches[0];
    return {
      success: true,
      mode: "kb-fallback",
      response: `${topMatch.answer}\n\nIf you want, I can also help with the next step: ${topMatch.question}`,
    };
  }

  if (/refund|money|payment|cancel|complaint|issue|escalat|human|support|contact/.test(lowerMessage)) {
    return {
      success: true,
      mode: "kb-fallback",
      response: "I’m not able to verify the exact policy from the local knowledge base right now. Please share your concern briefly, and I’ll guide you toward the right support channel or the nearest human escalation path.",
    };
  }

  return {
    success: true,
    mode: "kb-fallback",
    response: "I can help with WeIntern internship domains, fees, certification, placement support, orientation, and general policies. Please tell me which topic you want to know about.",
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

module.exports = {
  generateChatResponse,
  buildFallbackResponse,
};

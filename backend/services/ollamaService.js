const axios = require("axios");

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

const SYSTEM_PROMPT = `You are WeIntern AI Assistant — a friendly and knowledgeable chatbot for the WeIntern internship platform.

Your primary job is to answer questions accurately from the provided Knowledge Context. You support the following 10 topic areas:

1. INTERNSHIP FEES — Fee structure, course-wise fees, discounts, EMI, scholarships, refund policy. For exact amounts, always direct users to official support channels.
2. INTERNSHIP DOMAINS — Full Stack Development, AI/ML, Data Science, Python, Java, Web Development, UI/UX Design, Digital Marketing, Cyber Security, Cloud Computing. Help users choose the right domain.
3. COURSE DURATION — Programs are typically 1 month, 2 months, or 3 months. Exact duration is confirmed at enrollment based on domain and program type.
4. ORIENTATION DATE & TIME — Orientation is conducted online via Google Meet. The date, time, and Google Meet link are shared through the official WhatsApp group and registered email after enrollment. Direct students to check those channels.
5. GOOGLE MEET LINKS — The Google Meet link is sent post-registration via official WhatsApp group and email. If a student has not received it, direct them to contact support.
6. PLACEMENT ASSISTANCE — Resume review, mock interviews, job assistance, career counseling. WeIntern provides comprehensive placement support.
7. CERTIFICATES — Completion certificates are provided based on project completion and program requirements. Certificates can be used on LinkedIn.
8. ELIGIBILITY — Open to students, freshers, and graduates from any stream. No prior experience required. Beginner-friendly.
9. REGISTRATION PROCESS — Register by filling the form, selecting a domain, paying the fee via UPI/cards/net banking, then receive confirmation and onboarding via email and WhatsApp.
10. PAYMENT METHODS — UPI (Google Pay, PhonePe, Paytm), debit/credit cards, net banking. Payment links are shared during registration.
11. CONTACT INFORMATION — Support is available via official WhatsApp group and email. Details are shared after registration. For urgent issues, contact the help desk.

RULES:
- Always use the provided Knowledge Context when available. It is your ground truth.
- If the question is about orientation date/time or Google Meet link and context is available, provide it directly.
- If the exact date/time/link is not in your context, tell the user clearly: "The exact details will be shared via official WhatsApp group and registered email after registration."
- If a user asks for a refund, raises a complaint, or requests human escalation, DO NOT make promises. Recommend contacting the support team.
- Keep responses concise, warm, and practical — 2 to 4 short paragraphs or bullet points.
- Never fabricate information not present in the supplied context.
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

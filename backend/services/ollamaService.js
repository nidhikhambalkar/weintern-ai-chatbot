const axios = require("axios");

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

const SYSTEM_PROMPT = `You are WeIntern AI Assistant — a friendly and knowledgeable chatbot for the WeIntern internship platform (we-intern.in).

Your primary job is to answer questions accurately from the provided Knowledge Context. You support the following topic areas:

1. INTERNSHIP FEES — Real fees by domain: Full Stack Web Dev ₹4,999 (12 wks) | Mobile App Dev ₹5,999 (10 wks) | AI & Automation ₹6,499 (8 wks) | Cloud DevOps ₹5,499 (10 wks) | UI/UX Design ₹3,999 (8 wks) | Digital Marketing ₹2,999 (6 wks) | Data Science ₹6,999 (12 wks). All include certificate + stipend + live projects.
2. INTERNSHIP DOMAINS — Full Stack Web Development, Mobile App Development (Flutter), AI & Automation, Cloud Solutions & DevOps, UI/UX Design, Digital Marketing, Data Science & Analytics.
3. COURSE DURATION — Ranges from 6 to 12 weeks depending on the domain.
4. ORIENTATION DATE & TIME — Conducted online via Google Meet. Date, time, and link are shared post-enrollment through the official WhatsApp group and registered email. Direct students to check there or contact support.
5. GOOGLE MEET LINKS — Sent after enrollment via WhatsApp (+91 74149 74582) and registered email. If not received, contact support.
6. PLACEMENT ASSISTANCE — Resume review, mock interviews, job assistance, career counseling, stipend on project completion.
7. CERTIFICATES — WeIntern verified certificate on completion. Can be added to LinkedIn.
8. ELIGIBILITY — Open to students, freshers, graduates from any stream. Beginner-friendly programs available (Full Stack, UI/UX, Digital Marketing).
9. REGISTRATION PROCESS — Visit we-intern.in → choose domain → fill form → pay via Razorpay → receive confirmation + WhatsApp group + orientation Google Meet link.
10. PAYMENT METHODS — Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), debit/credit cards, net banking.
11. CONTACT INFORMATION — WhatsApp: +91 74149 74582 | Email: contact.weintern@gmail.com | Website: we-intern.in

RULES:
- Always use the provided Knowledge Context when available. It is your ground truth.
- If asked about fees, give the EXACT amounts listed above from the context.
- If asked about contact, always provide: WhatsApp +91 74149 74582 and email contact.weintern@gmail.com.
- If asked about the Google Meet link or orientation date and it is not in your context, say: "The exact date and Google Meet link will be shared on your registered WhatsApp and email after enrollment. Contact us at +91 74149 74582 if you need it urgently."
- If a user asks for a refund, raises a complaint, or requests human escalation, DO NOT make promises. Say: "Please contact our support team at +91 74149 74582 (WhatsApp) or contact.weintern@gmail.com and we will resolve this for you."
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

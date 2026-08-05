# WeIntern AI Chatbot

An AI-powered chatbot backend for the WeIntern internship platform. Built with **Node.js**, **Express.js**, **Ollama (Llama 3.2)**, and a local JSON Knowledge Base.

---

## 📁 Project Structure

```
weintern-ai-chatbot/
├── backend/
│   ├── app.js                          # Express server entry point
│   ├── .env                            # Environment variables
│   ├── package.json
│   ├── controllers/
│   │   └── chatController.js           # Chat endpoint logic, escalation detection
│   ├── routes/
│   │   └── chatRoutes.js               # POST /api/chat
│   ├── services/
│   │   ├── ollamaService.js            # Ollama Llama 3.2 integration + system prompt
│   │   └── knowledgeBaseService.js     # Fuzzy KB search with category scoring
│   ├── utils/
│   │   └── chatUtils.js                # sanitize, fastPath, error payload helpers
│   ├── scripts/
│   │   └── seedFaqKnowledgeBase.js     # Generates JSON KB from markdown chapter docs
│   └── knowledge-base/
│       ├── docs/                       # Markdown chapter source files
│       │   ├── Chapter-1-Company.md
│       │   ├── Chapter-2-Courses.md
│       │   ├── Chapter-3-Benefits.md
│       │   ├── Chapter-4-Internship.md
│       │   ├── Chapter-5-Certification.md
│       │   ├── Chapter-6-Placement.md
│       │   ├── Chapter-7-Fee.md
│       │   ├── Chapter-8-Support.md
│       │   └── Chapter-9-Policies.md
│       └── json/                       # Compiled FAQ JSON files (KB source)
│           ├── faq.json
│           ├── domains.json            # Domains + duration per domain
│           ├── orientation.json        # Orientation date/time/Google Meet guidance
│           ├── internship.json         # Registration, eligibility, duration, payment
│           ├── contact.json            # WhatsApp, email, office hours
│           ├── fees.json
│           ├── placement.json
│           ├── certificates.json
│           ├── certification.json
│           ├── courses.json
│           ├── benefits.json
│           ├── company.json
│           ├── support.json
│           └── policies.json
└── frontend/                           # (Frontend — separate scope)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Ollama](https://ollama.ai/) installed and running locally
- Llama 3.2 model pulled: `ollama pull llama3.2`

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create or update `backend/.env`:

```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_TIMEOUT_MS=60000
PORT=5000
```

### Run the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:5000`

### Seed / Regenerate the Knowledge Base

```bash
npm run seed:kb
```

This reads from `knowledge-base/docs/*.md` and regenerates the JSON files in `knowledge-base/json/`.

---

## 🤖 API Reference

### POST `/api/chat`

Send a user message to the AI chatbot.

**Request Body:**
```json
{
  "message": "What is the orientation date?"
}
```

**Response:**
```json
{
  "success": true,
  "reply": "The orientation date and Google Meet link are shared via the official WhatsApp group and registered email after enrollment...",
  "mode": "kb-fast",
  "escalation": false,
  "recommendedAction": "Continue with the guided answer.",
  "knowledgeMatches": [
    {
      "category": "orientation",
      "question": "What is the orientation date?",
      "answer": "..."
    }
  ],
  "responseTimeMs": 12
}
```

**Response Modes:**
| Mode | Description |
|---|---|
| `kb-fast` | Answered directly from Knowledge Base (score ≥ 18), no Ollama call needed |
| `ollama` | Answered by Llama 3.2 with KB context injected |
| `kb-fallback` | Ollama unavailable, KB top match returned as fallback |

**Escalation Triggers:**
- Refund / fee complaint → `escalation: ["refund"]`
- General complaint → `escalation: ["complaint"]`
- Human agent request → `escalation: ["escalation"]`

---

## 📚 Knowledge Base Topics

The chatbot covers these 10 topic areas:

| # | Topic | JSON File |
|---|---|---|
| 1 | Internship Fees | `fees.json` |
| 2 | Internship Domains | `domains.json` |
| 3 | Course Duration | `domains.json`, `internship.json` |
| 4 | Orientation Date & Time | `orientation.json` |
| 5 | Google Meet Links | `orientation.json` |
| 6 | Placement Assistance | `placement.json` |
| 7 | Certificates | `certificates.json`, `certification.json` |
| 8 | Eligibility | `internship.json` |
| 9 | Registration Process | `internship.json` |
| 10 | Payment Methods | `internship.json`, `fees.json` |
| 11 | Contact Information | `contact.json` |

---

## ⚙️ Architecture

```
POST /api/chat
    │
    ▼
chatController.js
    ├── sanitizeMessage()         — strip/limit input
    ├── searchKnowledgeBase()     — fuzzy + category scored KB lookup
    ├── detectEscalation()        — regex triggers for refund/human/complaint
    │
    ├── Score ≥ 18? → kb-fast reply (no Ollama call, < 50ms)
    │
    └── Score < 18? → generateChatResponse()
            ├── SYSTEM_PROMPT + KB context → Ollama /api/generate
            ├── On success → "ollama" mode response
            └── On Ollama error → buildFallbackResponse() → "kb-fallback"
```

---

## 🔧 Performance

- **Target**: < 3 seconds response time
- **KB Fast Path**: < 50ms (no AI model call)
- **Ollama Path**: Typically 1–3 seconds depending on hardware
- Every response includes `responseTimeMs` for monitoring

---

## 👥 Team Scope

| Scope | Owner |
|---|---|
| `POST /api/chat`, Ollama integration, KB search | **Backend Intern 1** ✅ |
| DB setup, `/api/leads`, `/api/history`, `/api/escalate`, `/api/admin/leads` | Backend Intern 2 |

---

## 📝 Notes

- **Orientation date/time & Google Meet link**: These are dynamically shared per batch. The KB instructs students to check their registered email and official WhatsApp group. Update `orientation.json` with the actual date/time/link once confirmed for each batch.
- **Contact details**: WhatsApp number and support email are shared post-registration. Update `contact.json` with actual values before going live.
- **Actual fee amounts**: Fees are confirmed via official channels. Update `fees.json` if specific amounts should be in the KB.
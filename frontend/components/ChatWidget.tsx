"use client";

import { useState, useRef, useEffect } from "react";
import { BsChatDotsFill, BsX, BsMicFill, BsMicMuteFill, BsVolumeUpFill, BsVolumeMuteFill, BsPlayFill, BsPauseFill, BsStopFill, BsCopy, BsPencilSquare, BsArrowClockwise, BsTrash, BsCheck2 } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { sendChat, saveLead, getHistory, clearHistory, createEscalation } from "@/services/chatApi";
import LeadForm from "@/components/LeadForm";

type ChatMessage = {
  sender: "user" | "bot";
  text: string;
  time: string;
};

// ── Devanagari to Hinglish Transliteration Helper ───────────────────────
function transliterateDevanagari(text: string): string {
  if (!text) return "";
  const cleanText = text.replace(/्/g, "");
  const mapping: { [key: string]: string } = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ः': 'h',
    'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'ऑ': 'o', 'ऋ': 'ri'
  };

  let result = "";
  for (const char of cleanText) {
    result += mapping[char] || char;
  }
  return result;
}

// ── Speech-to-Text Normalization Helper ─────────────────────────────────
function normalizeSpeechInput(text: string): string {
  if (!text) return "";
  let normalized = text;

  // Transliterate if Devanagari (Hindi/Marathi script) is detected
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) {
    normalized = transliterateDevanagari(text);
  }

  // ── 1. Normalize WeIntern name variations (comprehensive) ──────────────
  const weinternRegexes = [
    /\b(v\s*intern|v-intern|w\s+intern|w-intern|wee\s+intern|wee\s+intrn|we\s+intern|we-intern|we\s+interne|we\s+interm|we\s+intrn|we\s+intrm|we\s+intent|we\s+entered|we\s+entered\s+in|way\s+intern|vee\s+intern|vee\s+intrn|vee\s+internship|v\s+internship|be\s+intern|beintern|weinternship|weinterm|weintern|weintrn|weintarn|weinternn|weimterm|weintrm|vington|vingten|vinturn|winturn|wintern|wenitern|weinturm|weinturn|weentern|weentrn|weintearn|wigton|vinemtn|vinton)\b/gi,
  ];
  weinternRegexes.forEach((regex) => {
    normalized = normalized.replace(regex, "WeIntern");
  });

  // ── 2. Normalize LOR variations ─────────────────────────────────────────
  const lorRegexes = [
    /\b(hello\s+r|hello\s+are|yellow\s+are|el\s+o\s+are|el\s+o\s+r|ell\s+o\s+are|elora|eller|alore|l\s+o\s+r)\b/gi,
    /\b(recommendation\s+letter|letter\s+of\s+recommendation)\b/gi,
  ];
  lorRegexes.forEach((regex) => {
    normalized = normalized.replace(regex, "LOR");
  });

  // ── 3. Normalize EMI variations ──────────────────────────────────────────
  const emiRegexes = [
    /\b(e\s+m\s+i|e\.m\.i\.|ami|emi)\b/gi,
  ];
  emiRegexes.forEach((regex) => {
    normalized = normalized.replace(regex, "EMI");
  });

  // ── 4. Speech-to-text phonetic / mishearing corrections ─────────────────
  // Placement
  normalized = normalized.replace(/\bplace\s+ment\b/gi, "placement");
  normalized = normalized.replace(/\b(placment|placemnt|palcement)\b/gi, "placement");
  // Stipend
  normalized = normalized.replace(/\b(stipent|stepend|stipond|stipnd|stpend)\b/gi, "stipend");
  // Certificate
  normalized = normalized.replace(/\b(certifcate|certficate|certicate|certificat|srtiphiket|sartifiket|certifiate|cerificate)\b/gi, "certificate");
  // Registration
  normalized = normalized.replace(/\b(regster|resgister|registrtion|registation|resigtration)\b/gi, "registration");
  // Internship
  normalized = normalized.replace(/\b(internsip|internshp|intrnship|interniship|intenrship)\b/gi, "internship");
  // Fees
  normalized = normalized.replace(/\b(phees|feez|fes\b)/gi, "fees");
  // Duration
  normalized = normalized.replace(/\b(duraton|duartion|duraion|durtion)\b/gi, "duration");

  // ── 5. Hinglish keyword normalizations ──────────────────────────────────
  // Common Hinglish words → English equivalents so backend understands
  normalized = normalized.replace(/\b(kaam|kam)\b/gi, "work");
  normalized = normalized.replace(/\bintrn\b/gi, "internship");
  // "kitne month" → "how many months" (duration)
  normalized = normalized.replace(/\bkitne\s+month(s?)\b/gi, "how many months");
  normalized = normalized.replace(/\bkitna\s+month(s?)\b/gi, "how many months");
  // "fees kitna" / "kitna fees"
  normalized = normalized.replace(/\b(fees?)\s+kitna\b/gi, "fees how much");
  normalized = normalized.replace(/\bkitna\s+(fees?)\b/gi, "fees how much");
  normalized = normalized.replace(/\bcourse\s+ki\s+fees?\b/gi, "course fees");
  // "register karna" / "enroll karna"
  normalized = normalized.replace(/\b(register|enroll|apply)\s+karna\b/gi, "registration");
  // "certificate milega"
  normalized = normalized.replace(/\bcertif[a-z]*\s+milega\b/gi, "certificate");
  // "stipend milega"
  normalized = normalized.replace(/\bstipend\s+milega\b/gi, "stipend");
  // "kya h" → "what is"
  normalized = normalized.replace(/\bkya\s+h\b/gi, "what is");

  return normalized;
}

// ── Dedicated Text Sanitization Helper for TTS Engine ───────────────────
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return "";

  let cleaned = String(rawText);

  // 1. Convert Arrow Flows (e.g. "Learn → Build → Work → Earn" -> "Learn, Build, Work, and Earn")
  cleaned = cleaned.replace(/(\b[\w\s-]+)\s*(?:→|->|⇒|➜|➤|➔|➞|➡|►)\s*(\b[\w\s-]+)\s*(?:→|->|⇒|➜|➤|➔|➞|➡|►)\s*(\b[\w\s-]+)\s*(?:→|->|⇒|➜|➤|➔|➞|➡|►)\s*(\b[\w\s-]+)/gi, "$1, $2, $3, and $4");
  cleaned = cleaned.replace(/(\b[\w\s-]+)\s*(?:→|->|⇒|➜|➤|➔|➞|➡|►)\s*(\b[\w\s-]+)\s*(?:→|->|⇒|➜|➤|➔|➞|➡|►)\s*(\b[\w\s-]+)/gi, "$1, $2, and $3");
  cleaned = cleaned.replace(/\s*(?:→|->|⇒|➜|➤|➔|➞|➡|►)\s*/g, ", ");

  // 2. Remove Code blocks (```code```) and Inline Code (`code`)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  // 3. Remove HTML tags (<tag>...</tag> or <tag/>)
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // 4. Remove JSON syntax artifacts (e.g. {"key": "val"})
  cleaned = cleaned.replace(/\{[^{}]*\}/g, "");

  // 5. Remove Markdown links [Link Text](http://...) -> Link Text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  cleaned = cleaned.replace(/\[([^\]]+)\]/g, "$1");

  // 6. Remove URLs (http, https, www) and Email addresses
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, "");
  cleaned = cleaned.replace(/www\.[^\s]+/gi, "");
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, "");

  // 7. Remove standalone domain names (e.g. we-intern.in)
  cleaned = cleaned.replace(/\bwe-intern\.in\b/gi, "");

  // 8. Remove Markdown headings (#, ##, ### at start of line)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

  // 9. Remove Markdown formatting (bold, italics, strikethrough: **, *, __, _, ~~)
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, "$2");
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, "$2");
  cleaned = cleaned.replace(/~~(.*?)~~/g, "$1");

  // 10. Remove Markdown horizontal rules (---, ***, ___)
  cleaned = cleaned.replace(/^[\-\*_]{3,}\s*$/gm, "");

  // 11. Remove list/bullet prefix symbols at start of line (e.g. "1. ", "• ", "- ", "* ", "+ ")
  cleaned = cleaned.replace(/^[\s]*[•◦▪▫\-\*\+]\s+/gm, "");
  cleaned = cleaned.replace(/^[\s]*\d+[\.\)]\s+/gm, "");

  // 12. Convert "+" used as conjunction (e.g. "2-month training + live project" -> "2-month training and live project")
  cleaned = cleaned.replace(/(\b\w+)\s*\+\s*(\b\w+)/g, "$1 and $2");

  // 13. Remove Emojis & Pictographic Unicode ranges comprehensively
  cleaned = cleaned.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2B00}-\u{2BFF}]|[\u{2300}-\u{23FF}]|[\u{200D}]|[\u{FE00}-\u{FE0F}]|[\u{20E3}]/gu,
    ""
  );

  // 14. Remove decorative symbols, pipes, hashtags
  cleaned = cleaned.replace(/[📌📜✨🟢🚀📍📱📧⏰💳👤✍️💡🎓💼💰🏆👨‍🏫🎯⚡|~`#^]/g, "");

  // 15. Clean up dangling label artifacts (e.g. "Website:", "Email:" if URL/Email was stripped)
  cleaned = cleaned.replace(/\b(Website|Email|Link):\s*(?=[.!?]|$|\n)/gi, "");

  // 16. Brand & Technical Phonetic Pronunciation Normalization Layer (TTS only)
  cleaned = cleaned.replace(/\bwe[\-_]?intern's\b/gi, "We Intern's");
  cleaned = cleaned.replace(/\bwe[\-_]?interns\b/gi, "We Intern's");
  cleaned = cleaned.replace(/\bwe[\-_]?intern\b/gi, "We Intern");
  cleaned = cleaned.replace(/\bedtech\b/gi, "Ed Tech");
  cleaned = cleaned.replace(/\bui\/ux\b/gi, "UI UX");
  cleaned = cleaned.replace(/\bai\/ml\b/gi, "AI ML");
  cleaned = cleaned.replace(/\bci\/cd\b/gi, "CI CD");

  // 17. Normalize multi-line breaks into clean sentences
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(". ");

  // 18. Clean up punctuation artifacts (e.g. ":," -> ":", ":." -> ":", ". ." -> ".")
  cleaned = cleaned
    .replace(/:\s*[,.]/g, ":")
    .replace(/,\s*\./g, ".")
    .replace(/\s+([.,?!;])/g, "$1")
    .replace(/([.,?!;])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

// ── Sentence Boundary Buffering & Queue Splitter for TTS Engine ─────────────
export function splitTextIntoSentenceQueue(cleanText: string): string[] {
  if (!cleanText) return [];

  // Protect common abbreviations before sentence splitting so they are not incorrectly broken
  let protectedText = cleanText
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\./gi, "$1___DOT___")
    .replace(/\b(st|nd|rd|th)\./gi, "$1___DOT___");

  // Split on primary sentence-ending punctuation (. ! ? \n :)
  const rawSentences = protectedText.split(/(?<=[.?!:\n])\s+/);

  const finalSentences: string[] = [];

  for (const raw of rawSentences) {
    const sClean = raw.replace(/___DOT___/g, ".").trim();
    if (!sClean) continue;

    const words = sClean.split(/\s+/);
    if (words.length > 15 && sClean.includes(",")) {
      // Split long sentences on comma boundaries while keeping chunks naturally sized (6-14 words)
      const rawClauses = sClean.split(/(?<=,)\s+/);
      let currentBuffer = "";

      for (const clause of rawClauses) {
        if (!currentBuffer) {
          currentBuffer = clause;
        } else if ((currentBuffer.split(/\s+/).length + clause.split(/\s+/).length) <= 14) {
          currentBuffer += " " + clause;
        } else {
          finalSentences.push(currentBuffer.trim());
          currentBuffer = clause;
        }
      }
      if (currentBuffer.trim()) {
        finalSentences.push(currentBuffer.trim());
      }
    } else {
      finalSentences.push(sClean);
    }
  }

  return finalSentences.length > 0 ? finalSentences : [cleanText];
}

// ── Alternatives Picker Helper ──────────────────────────────────────────
function selectAndNormalizeTranscript(alternatives: string[]): string {
  if (!alternatives || alternatives.length === 0) return "";

  // Heuristic: Check each alternative for strong domain keywords and prefer it
  const patterns = [
    /\b(weintern|we\s+intern|v\s*intern|be\s*intern|wintern|wigton|weintrn)\b/i,
    /\b(lor|letter\s+of\s+recommendation|hello\s+r|hello\s+are|yellow\s+are)\b/i,
    /\b(emi|e\s+m\s+i|installment|installments)\b/i,
    /\b(certificate|certif|placement|stipend|internship|registration|fees?|duration|mentor|domain)\b/i,
  ];

  for (const pattern of patterns) {
    for (const alt of alternatives) {
      if (pattern.test(alt)) {
        return normalizeSpeechInput(alt);
      }
    }
  }

  return normalizeSpeechInput(alternatives[0]);
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadStep, setLeadStep] = useState(0);
  const [leadData, setLeadData] = useState({
    name: "",
    email: "",
    phone: "",
    domain: "",
  });

  const [sessionId, setSessionId] = useState<string>("");
  const [voiceMode, setVoiceMode] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<"IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING" | "PAUSED" | "ERROR">("IDLE");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [playbackState, setPlaybackState] = useState<"IDLE" | "PLAYING" | "PAUSED">("IDLE");
  const [detectedLang, setDetectedLang] = useState<string>("en-IN"); // tracks last detected speech language
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  // Dedicated interrupt-only recognition that runs concurrently with TTS
  const interruptRecRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isTtsSpeakingRef = useRef<boolean>(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeTextRef = useRef<string>("");
  const currentCharIndexRef = useRef<number>(0);
  const pausedCharIndexRef = useRef<number>(0);
  const sentenceQueueRef = useRef<string[]>([]);
  const currentSentenceIndexRef = useRef<number>(0);
  const sentenceCharOffsetRef = useRef<number>(0);
  const currentPausedTextRef = useRef<string>("");
  const currentSpeakCharIndexRef = useRef<number>(0);
  const isVoicePausedRef = useRef<boolean>(false);
  const isCancelledByCommandRef = useRef<boolean>(false);
  const pausedMessageIndexRef = useRef<number | null>(null);
  const isSpeakerMutedRef = useRef<boolean>(false);
  const voiceModeRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestInterimTranscriptRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // ── Pause/Resume position tracking (Chrome workaround) ──────────────────
  const boundaryCharIndexRef = useRef<number>(0);          // charIndex from last onboundary event
  const pausedTextRemainderRef = useRef<string>("");        // text substring saved on pause
  const pausedMessageIndexForResumeRef = useRef<number | null>(null); // msg index for resume
  const interruptListenerActiveRef = useRef<boolean>(false); // is interrupt listener running
  const speechAccumulatorRef = useRef<string>("");          // accumulates speech segments across continuous listening/pauses
  const isVoiceSessionActiveRef = useRef<boolean>(false);    // tracks if user is in an active recording session

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCopyMessage = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEditMessage = (index: number, text: string) => {
    setEditingIndex(index);
    setEditText(text);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText("");
  };

  const handleSaveEditedMessage = async (index: number) => {
    if (!editText.trim()) return;
    const updatedText = editText.trim();
    setEditingIndex(null);
    setEditText("");
    await processEditedMessage(index, updatedText);
  };

  const handleRefreshHistory = async () => {
    if (!sessionId) return;
    setIsTyping(true);
    try {
      const res = await getHistory(sessionId);
      if (res.success && res.data) {
        const welcomeMsg: ChatMessage = {
          sender: "bot",
          text: "👋 Hello! Welcome to WeIntern.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        if (res.data.length === 0) {
          setMessages([welcomeMsg]);
        } else {
          const loadedMsgs = res.data.map((msg: any) => ({
            sender: msg.sender === "bot" ? "bot" : "user",
            text: msg.message,
            time: new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

          const hasWelcome = loadedMsgs.length > 0 && loadedMsgs[0].text.includes("Welcome to WeIntern");
          setMessages(hasWelcome ? loadedMsgs : [welcomeMsg, ...loadedMsgs]);
        }
        setToastMessage("History refreshed");
        setTimeout(() => setToastMessage(null), 2000);
      }
    } catch (err) {
      console.error("Failed to refresh history:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    setShowClearConfirm(false);
    const previousSessionId = sessionId;

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("weintern_session_id", newSessionId);
    }

    setSessionId(newSessionId);
    setMessages([
      {
        sender: "bot",
        text: "👋 Hello! Welcome to WeIntern.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setShowLeadForm(false);
    setLeadStep(0);
    setLeadData({ name: "", email: "", phone: "", domain: "" });

    if (previousSessionId) {
      try {
        await clearHistory(previousSessionId);
      } catch (err) {
        console.error("Failed to clear history:", err);
      }
    }

    setToastMessage("Chat history cleared");
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleRetryMessage = async (userText: string) => {
    await processMessage(userText, "text");
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "👋 Hello! Welcome to WeIntern.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  // Deterministic single voice loader & locking strategy
  const initSpeechVoices = (): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const synth = window.speechSynthesis;
    synthesisRef.current = synth;

    const voices = synth.getVoices();
    if (!voices || voices.length === 0) return null;

    if (!selectedVoiceRef.current) {
      const preferred =
        voices.find((v) => (v.lang.startsWith("en") || v.lang.startsWith("en-IN") || v.lang.startsWith("en-US")) && /google/i.test(v.name) && /female|woman/i.test(v.name)) ||
        voices.find((v) => (v.lang.startsWith("en") || v.lang.startsWith("en-US")) && /zira|jenny|natural|samantha|aria/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en") && /google/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en") || v.lang.startsWith("en-US") || v.lang.startsWith("en-IN") || v.lang.startsWith("en-GB")) ||
        voices.find((v) => v.default) ||
        voices[0];

      if (preferred) {
        selectedVoiceRef.current = preferred;
        console.log("🔒 Selected Voice Locked for Session:", preferred.name, preferred.lang);
      }
    }

    return selectedVoiceRef.current;
  };

  // Initialize fresh session ID per page load & Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("weintern_session_id");
      const id = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      setSessionId(id);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = true;       // Allow continuous listening across pauses & multi-sentence speech
        rec.interimResults = true;
        rec.maxAlternatives = 5;
        rec.lang = "en-IN";
        recognitionRef.current = rec;

        // Separate instance for interrupt commands — runs concurrently with TTS
        const intRec = new SpeechRecognition();
        intRec.continuous = true;       // keep listening while TTS plays
        intRec.interimResults = true;   // fire on partial results for instant reaction
        intRec.maxAlternatives = 3;
        intRec.lang = "en-IN";
        interruptRecRef.current = intRec;
      }
      synthesisRef.current = window.speechSynthesis;
      if (synthesisRef.current) {
        initSpeechVoices();
        if (synthesisRef.current.onvoiceschanged !== undefined) {
          synthesisRef.current.onvoiceschanged = () => {
            initSpeechVoices();
          };
        }
      }
    }
  }, []);

  // Fetch chat history from PostgreSQL / In-Memory fallback on startup
  useEffect(() => {
    if (!sessionId) return;
    const fetchHistory = async () => {
      try {
        const res = await getHistory(sessionId);
        if (res.success && res.data && res.data.length > 0) {
          const welcomeMsg: ChatMessage = {
            sender: "bot",
            text: "👋 Hello! Welcome to WeIntern.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          const loadedMsgs = res.data.map((msg: any) => ({
            sender: msg.sender === "bot" ? "bot" : "user",
            text: msg.message,
            time: new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

          const hasWelcome = loadedMsgs.length > 0 && loadedMsgs[0].text.includes("Welcome to WeIntern");
          setMessages(hasWelcome ? loadedMsgs : [welcomeMsg, ...loadedMsgs]);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    fetchHistory();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping, interimTranscript]);

  const handleCloseLeadForm = () => {
    setShowLeadForm(false);
    setLeadStep(0);
    setLeadData({ name: "", email: "", phone: "", domain: "" });
  };

  const handleSkipLeadForm = () => {
    setShowLeadForm(false);
    setLeadStep(0);
    setLeadData({ name: "", email: "", phone: "", domain: "" });
    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: "Registration skipped. You can continue asking questions freely! If you want to register later, click Apply / Register.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const startLeadForm = () => {
    setShowLeadForm(true);
    setLeadStep(1);
    const text = "📝 Great! Let's get you registered for the WeIntern Internship.\n\nPlease enter your Full Name:";
    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setVoiceState("IDLE");
  };

  const quickReply = async (question: string) => {
    if (question.includes("Apply") || question.includes("Register")) {
      startLeadForm();
      return;
    }
    setMessage("");
    await processMessage(question, "text");
  };

  // ── Helper to fetch the last response spoken by WeIntern AI ─────────────
  const getLastBotResponse = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "bot") {
        return { index: i, text: messages[i].text };
      }
    }
    return null;
  };

  // ── Helper to clean and normalize input for command detection ───────────
  const cleanCommandText = (rawText: string): string => {
    if (!rawText) return "";
    let text = String(rawText).trim();
    text = text.replace(/^[\s.,!?;:।'"\-_()]+|[\s.,!?;:।'"\-_()]+$/g, "").trim();
    return text;
  };

  const normalizeCommandInput = (text: string): { raw: string; transliterated: string } => {
    const cleaned = cleanCommandText(text).toLowerCase();
    if (/[\u0900-\u097F]/.test(cleaned)) {
      const transliterated = transliterateDevanagari(cleaned).toLowerCase();
      return { raw: cleaned, transliterated };
    }
    return { raw: cleaned, transliterated: cleaned };
  };

  const QUESTION_KEYWORDS_REGEX = /\b(course|courses|internship|internships|certificate|certificates|certification|lor|fee|fees|price|cost|domain|domains|placement|stipend|eligibility|eligible|duration|month|months|week|weeks|syllabus|project|projects|register|registration|apply|admission|refund|emi|contact|email|phone|whatsapp|who|what|when|where|why|how|kya|kaise|kitna|kitne|kab|kaha|kahan|kaun)\b/i;

  const COMMAND_PATTERNS = {
    STOP: [
      /^(please\s+)?(stop|stop it|stop speaking|stop audio|stop voice|quiet|shut up)(\s+please)?$/i,
      /^(please\s+)?(ruko|ruk|roko|band karo|band karo ab|chup|chup ho jao|chup raho|bas|bas karo|bas karo ab|thamba|thamb|band kara)(\s+please)?$/i,
      /^(रुको|रुक|रोको|बंद करो|चुप|चुप हो जाओ|चुप रहो|बस|बस करो|थांबा|थांब)$/i
    ],
    PAUSE: [
      /^(please\s+)?(pause|pause it|pause speaking|pause audio|pause speech|pause please|wait|wait please|wait a minute|hold on|hold)(\s+please)?$/i,
      /^(please\s+)?(ruko thoda|thoda ruko|ek minute ruko|ek minute|hold karo|pause karo|jara thamba|thoda thamba)(\s+please)?$/i,
      /^(पॉज|पॉज़|रुको थोड़ा|थोड़ा रुको|एक मिनट|जरा थांबा)$/i
    ],
    RESUME: [
      /^(please\s+)?(continue|resume|continue please|resume please|go on|keep speaking|carry on|continue speaking|resume speaking|play|play speech|unpause)(\s+please)?$/i,
      /^(please\s+)?(chalu karo|chalu kijiye|phir se chalu karo|continue karo|resume karo|aage bolo|aage batao|bolo|aage badho|boliye|pudhe sanga|pudhe bola|chalu kara)(\s+please)?$/i,
      /^(कंटिन्यू|चालू करा|चालू करो|आगे बोलो|आगे बताओ|फिर से चालू करो|पुढे बोला)$/i
    ],
    REPEAT: [
      /^(please\s+)?(repeat|repeat it|repeat please|speak again|say again|tell me again|read again|read it again|replay|replay please)(\s+please)?$/i,
      /^(please\s+)?(dobara bolo|phir se bolo|wapas bolo|ek baar aur bolo|dobara batao|phir se batao|wapas batao|repeat karo|replay karo|punha sanga|parat sanga|punha bola)(\s+please)?$/i,
      /^(दोबारा बोलो|फिर से बोलो|वापस बोलो|एक बार और बोलो|पुन्हा बोला|परत सांगा)$/i
    ],
    START: [
      /^(please\s+)?(start|start again|start from beginning|start from the beginning|begin|start over)(\s+please)?$/i,
      /^(please\s+)?(shuru se|pehle se|shuru karo|shuru se bolo|shuru se batao|suru karo|suru se|starting se|starting se bolo|surwat pasun|suru pasun)(\s+please)?$/i,
      /^(शुरू से|शुरू करो|पहले से|सुरुवात करा|सुरुवातीपासून)$/i
    ],
    MUTE: [
      /^(please\s+)?(mute|mute it|mute voice|mute audio|turn off voice|turn off speech|turn off audio|silent|go silent|be silent)(\s+please)?$/i,
      /^(please\s+)?((awaaz|aawaz|awaz)\s+band(\s+(karo|kara|kijiye))?|mute karo|silent karo)(\s+please)?$/i,
      /^(आवाज बंद|आवाज बंद करा|म्यूट)$/i
    ],
    UNMUTE: [
      /^(please\s+)?(unmute|unmute it|unmute voice|unmute audio|turn on voice|turn on speech|turn on audio|speak up|voice on)(\s+please)?$/i,
      /^(please\s+)?((awaaz|aawaz|awaz)\s+(chalu|shuru|open)(\s+(karo|kara|kijiye))?|unmute karo|speak karo|voice on karo)(\s+please)?$/i,
      /^(आवाज चालू|आवाज चालू करा|अनम्यूट)$/i
    ]
  };

  const detectVoiceCommandType = (inputText: string): string | null => {
    const { raw, transliterated } = normalizeCommandInput(inputText);
    if (!raw) return null;

    const wordCount = raw.split(/\s+/).length;
    // Guard against normal questions containing keywords
    if (wordCount > 4 && QUESTION_KEYWORDS_REGEX.test(raw)) {
      return null;
    }

    for (const [cmdType, patterns] of Object.entries(COMMAND_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(raw) || pattern.test(transliterated)) {
          return cmdType;
        }
      }
    }
    return null;
  };

  const executeVoiceControlCommand = (command: "pause" | "continue" | "stop") => {
    if (command === "stop") {
      handleStopMessage();
      return;
    }

    if (command === "pause") {
      handlePauseMessage();
      return;
    }

    handleResumeOrContinueMessage();
  };

  // ── Voice playback action handlers ──────────────────────────────────────
  const handleMute = () => {
    setIsSpeakerMuted(true);
    isSpeakerMutedRef.current = true;
    if (synthesisRef.current) {
      try {
        synthesisRef.current.cancel();
      } catch (e) {}
    }
    isTtsSpeakingRef.current = false;
    if (voiceState === "SPEAKING") {
      setVoiceState("IDLE");
    }
  };

  const handleUnmute = () => {
    setIsSpeakerMuted(false);
    isSpeakerMutedRef.current = false;
  };

  // Handles natural voice command detection and execution (supports English, Hindi, and Marathi variations)
  const detectAndExecuteVoiceCommand = (text: string): boolean => {
    if (!text) return false;

    // 1. First check dedicated COMMAND_PATTERNS (handles Devanagari & transliteration)
    const cmdType = detectVoiceCommandType(text);
    if (cmdType) {
      if (cmdType === "STOP") {
        executeVoiceControlCommand("stop");
        return true;
      }
      if (cmdType === "PAUSE") {
        executeVoiceControlCommand("pause");
        return true;
      }
      if (cmdType === "RESUME") {
        executeVoiceControlCommand("continue");
        return true;
      }
      if (cmdType === "REPEAT" || cmdType === "START") {
        const lastBot = getLastBotResponse();
        if (lastBot) {
          handlePlayMessage(lastBot.index, lastBot.text);
        }
        return true;
      }
      if (cmdType === "MUTE") {
        handleMute();
        return true;
      }
      if (cmdType === "UNMUTE") {
        handleUnmute();
        return true;
      }
    }

    // 2. Secondary fallback matching for raw lower text
    const rawLower = text.toLowerCase().trim();

    const isStop =
      /^(stop|stop reading|stop speaking|stop talking|stop it|stop now|please stop|stop please|shut up|quiet|halt|cancel reading|cancel speech|band karo|बंद करो|thambva|thaambva|थांबवा|chup|chup ho jao|bas karo|rok do|band kar do|awaaz band|aawaz band)$/i.test(rawLower) ||
      /\b(stop reading|stop speaking|stop talking|stop it|please stop|stop please|shut up|band karo|बंद करो|thambva|thaambva|थांबवा|chup ho jao|bas karo|rok do|band kar do|awaaz band|aawaz band)\b/i.test(rawLower) ||
      /^(stop|band karo|बंद करो|thambva|thaambva|थांबवा)$/i.test(rawLower);

    if (isStop) {
      executeVoiceControlCommand("stop");
      return true;
    }

    const isPause =
      /^(pause|pause reading|pause speaking|pause talking|pause it|pause now|please pause|pause please|wait|hold on|pause speech|ruko|roko|thoda ruko|ruko thoda|thamba|thaamb|रुको|थांब|hold karo|thoda wait|rokna)$/i.test(rawLower) ||
      /\b(pause reading|pause speaking|pause talking|pause it|please pause|pause please|hold on|pause speech|ruko thoda|thoda ruko|thamba|thaamb|रुको|थांब|hold karo|thoda wait|thoda roko)\b/i.test(rawLower) ||
      /^(pause|wait|ruko|roko|thamba|thaamb|रुको|थांब)$/i.test(rawLower);

    if (isPause) {
      executeVoiceControlCommand("pause");
      return true;
    }

    const isResume =
      /^(continue|resume|go on|keep speaking|carry on|continue speaking|jari rakho|जारी रखो|punha suru|punha shuru|पुन्हा सुरू|chalu karo|phir se chalu karo|continue karo|resume karo|aage bolo)$/i.test(rawLower) ||
      /\b(continue karo|phir se chalu karo|resume karo|continue speaking|keep speaking|carry on|jari rakho|जारी रखो|punha suru|punha shuru|पुन्हा सुरू)\b/i.test(rawLower) ||
      /^(continue|resume|जारी रखो|पुन्हा सुरू)$/i.test(rawLower);

    if (isResume) {
      executeVoiceControlCommand("continue");
      return true;
    }

    return false;
  };



  const handleResumeOrContinueMessage = () => {
    const synth = synthesisRef.current || (typeof window !== "undefined" ? window.speechSynthesis : null);
    if (!synth) return;

    if (playbackState !== "PAUSED") {
      console.warn("[TTS RESUME ABORT] Not in PAUSED state.");
      return;
    }

    isVoicePausedRef.current = false;

    // ── Chrome Pause/Resume Workaround ──────────────────────────────────────
    // Chrome's speechSynthesis.pause()/resume() is unreliable (especially mobile).
    // handlePauseMessage cancels TTS and saves remaining text in pausedTextRemainderRef.
    // Here we re-create the utterance from that saved position and speak it fresh.
    const textToResume = pausedTextRemainderRef.current || activeTextRef.current;
    const resumeIndex = pausedMessageIndexForResumeRef.current ?? pausedMessageIndexRef.current;

    if (!textToResume) {
      console.warn("[TTS RESUME] No saved text remainder. Cannot resume.");
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      return;
    }

    console.log("[TTS RESUME] Re-speaking from saved position:", textToResume.substring(0, 40));

    const utterance = new SpeechSynthesisUtterance(textToResume);
    const activeVoice = selectedVoiceRef.current || initSpeechVoices();
    if (activeVoice) {
      utterance.voice = activeVoice;
      utterance.lang = activeVoice.lang;
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    activeUtteranceRef.current = utterance;
    activeTextRef.current = textToResume;
    if (resumeIndex !== null) pausedMessageIndexRef.current = resumeIndex;
    boundaryCharIndexRef.current = 0;

    utterance.onboundary = (e: any) => {
      if (activeUtteranceRef.current !== utterance) return;
      if (e.name === "word" || e.name === "sentence") {
        boundaryCharIndexRef.current = e.charIndex;
      }
    };

    utterance.onstart = () => {
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = true;
      setPlayingMessageIndex(resumeIndex);
      setPlaybackState("PLAYING");
      setVoiceState("SPEAKING");
    };

    utterance.onend = () => {
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      activeTextRef.current = "";
      pausedTextRemainderRef.current = "";
      pausedMessageIndexRef.current = null;
      pausedMessageIndexForResumeRef.current = null;
      setPlayingMessageIndex(null);
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      stopInterruptListener();
      if (voiceModeRef.current && !isSpeakerMutedRef.current) {
        setTimeout(() => { if (!isListeningRef.current) startSpeechRecognition(); }, 400);
      }
    };

    utterance.onerror = (e: any) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      isTtsSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      setPlayingMessageIndex(null);
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      stopInterruptListener();
    };

    if (typeof window !== "undefined") {
      (window as any).__activeTtsUtterance = utterance;
    }

    synth.speak(utterance);
    setTimeout(() => startInterruptListener(), 50);
  };

  // Speaks response using Web Speech Synthesis (TTS)
  const speakResponse = (text: string) => {
    if (isSpeakerMutedRef.current) {
      console.log("Speaker is muted. Skipping TTS output.");
      return;
    }
    if (isVoicePausedRef.current) {
      console.log("Voice reading paused by user.");
      return;
    }
    handlePlayMessage(-1, text);
  };

  const handlePlayMessage = (index: number, text: string) => {
    const synth = synthesisRef.current || (typeof window !== "undefined" ? window.speechSynthesis : null);
    if (!synth) return;

    isVoicePausedRef.current = false;
    stopInterruptListener();

    // Cancel any prior speech before starting a NEW message
    try { synth.cancel(); } catch (e) {}

    const cleanText = cleanTextForSpeech(text);
    // Save full text for pause/resume position tracking
    activeTextRef.current = cleanText;
    boundaryCharIndexRef.current = 0;
    pausedTextRemainderRef.current = "";
    pausedMessageIndexForResumeRef.current = index;

    console.log("[TTS PLAY]", { index, textPreview: cleanText.substring(0, 35) });

    if (!cleanText) {
      isTtsSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      pausedMessageIndexRef.current = null;
      setPlayingMessageIndex(null);
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      return;
    }

    if (isSpeakerMutedRef.current) {
      console.log("Speaker is muted. Skipping TTS output.");
      return;
    }

    const activeVoice = selectedVoiceRef.current || initSpeechVoices();
    // ONE consistent voice — always English (en-IN) via the locked voice
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (activeVoice) {
      utterance.voice = activeVoice;
      utterance.lang = activeVoice.lang;
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    activeUtteranceRef.current = utterance;
    pausedMessageIndexRef.current = index;

    // Track word boundaries for accurate pause/resume position
    utterance.onboundary = (e: any) => {
      if (activeUtteranceRef.current !== utterance) return;
      if (e.name === "word" || e.name === "sentence") {
        boundaryCharIndexRef.current = e.charIndex;
      }
    };

    utterance.onstart = () => {
      console.log("[TTS ONSTART]");
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = true;
      setPlayingMessageIndex(index);
      setPlaybackState("PLAYING");
      setVoiceState("SPEAKING");
      // Start concurrent interrupt listener so user can say "stop"/"pause" while TTS plays
      setTimeout(() => startInterruptListener(), 100);
    };

    utterance.onpause = () => {
      console.log("[TTS ONPAUSE]");
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = false;
      setPlaybackState("PAUSED");
      setVoiceState("PAUSED");
    };

    utterance.onresume = () => {
      console.log("[TTS ONRESUME]");
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = true;
      setPlaybackState("PLAYING");
      setVoiceState("SPEAKING");
    };

    utterance.onend = () => {
      console.log("[TTS ONEND]");
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      activeTextRef.current = "";
      pausedTextRemainderRef.current = "";
      pausedMessageIndexRef.current = null;
      pausedMessageIndexForResumeRef.current = null;
      setPlayingMessageIndex(null);
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      stopInterruptListener();
      // Auto-restart mic listening after bot finishes speaking (natural conversation loop)
      if (voiceModeRef.current && !isSpeakerMutedRef.current) {
        setTimeout(() => { if (!isListeningRef.current) startSpeechRecognition(); }, 400);
      }
    };

    utterance.onerror = (e: any) => {
      console.log("[TTS ONERROR]", e);
      if (e.error === "interrupted" || e.error === "canceled") return;
      isTtsSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      setPlayingMessageIndex(null);
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      stopInterruptListener();
    };

    // Attach utterance globally on window object to prevent Chrome GC bug in production
    if (typeof window !== "undefined") {
      (window as any).__activeTtsUtterance = utterance;
    }

    synth.speak(utterance);
  };

  const handlePauseMessage = () => {
    const synth = synthesisRef.current || (typeof window !== "undefined" ? window.speechSynthesis : null);
    console.log("[TTS PAUSE]", {
      pausedStateBefore: playbackState,
      activeUtteranceExists: !!activeUtteranceRef.current,
      boundaryCharIndex: boundaryCharIndexRef.current,
    });

    if (playbackState === "PAUSED") return;
    if (!synth || !activeUtteranceRef.current) return;

    // ── Chrome Pause Workaround ──────────────────────────────────────────────
    // Chrome's speechSynthesis.pause() is unreliable (often ignored on Android).
    // Instead: save the remaining text from the last word boundary, then cancel.
    // handleResumeOrContinueMessage will re-speak from the saved position.
    const fullText = activeTextRef.current;
    const charOffset = boundaryCharIndexRef.current;
    pausedTextRemainderRef.current = (charOffset > 0 && charOffset < fullText.length)
      ? fullText.substring(charOffset).trim()
      : fullText;
    pausedMessageIndexForResumeRef.current = pausedMessageIndexRef.current;

    isVoicePausedRef.current = true;
    isTtsSpeakingRef.current = false;

    // Cancel (not pause) — more reliable across Chrome, Firefox, Safari
    try { synth.cancel(); } catch (e) {}
    stopInterruptListener();

    setPlaybackState("PAUSED");
    setVoiceState("PAUSED");
  };

  const handleStopMessage = () => {
    console.log("[TTS STOP]");
    isVoicePausedRef.current = false;
    isTtsSpeakingRef.current = false;

    stopInterruptListener();

    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (e) {}
      abortControllerRef.current = null;
    }

    const synth = synthesisRef.current || (typeof window !== "undefined" ? window.speechSynthesis : null);
    if (synth) {
      try { synth.cancel(); } catch (e) {}
      if (typeof window !== "undefined") {
        delete (window as any).__activeUtterance;
        delete (window as any).__activeTtsUtterance;
      }
    }

    activeUtteranceRef.current = null;
    activeTextRef.current = "";
    pausedTextRemainderRef.current = "";
    pausedMessageIndexRef.current = null;
    pausedMessageIndexForResumeRef.current = null;
    setPlayingMessageIndex(null);
    setPlaybackState("IDLE");
    setVoiceState("IDLE");
    setIsTyping(false);
  };

  // ── Interrupt Listener — listens concurrently while TTS speaks ─────────────
  // Detects voice commands (stop/pause/continue) even while the bot is talking.
  const stopInterruptListener = () => {
    interruptListenerActiveRef.current = false;
    const intRec = interruptRecRef.current;
    if (!intRec) return;
    try { intRec.stop(); } catch (_) {}
  };

  const startInterruptListener = () => {
    if (interruptListenerActiveRef.current) return; // already running
    if (isListeningRef.current) return;            // main mic is active — no overlap
    const intRec = interruptRecRef.current;
    if (!intRec) return;

    intRec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0]?.transcript || "";
        const { raw } = normalizeCommandInput(transcript);
        if (detectAndExecuteVoiceCommand(raw)) {
          stopInterruptListener();
          return;
        }
      }
    };

    intRec.onerror = () => {
      interruptListenerActiveRef.current = false;
    };

    intRec.onend = () => {
      interruptListenerActiveRef.current = false;
      // Auto-restart while TTS is still speaking (keep listening continuously)
      if (isTtsSpeakingRef.current) {
        setTimeout(() => startInterruptListener(), 150);
      }
    };

    try {
      intRec.start();
      interruptListenerActiveRef.current = true;
    } catch (_) {
      interruptListenerActiveRef.current = false;
    }
  };

  // Helper function to finalize complete accumulated speech and send it to chat
  const finalizeSpeechAndProcess = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const fullText = (speechAccumulatorRef.current + " " + latestInterimTranscriptRef.current).replace(/\s+/g, " ").trim();
    isVoiceSessionActiveRef.current = false;
    isListeningRef.current = false;

    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch (_) {}
    }

    setInterimTranscript("");
    latestInterimTranscriptRef.current = "";
    speechAccumulatorRef.current = "";

    if (fullText && fullText.length > 1) {
      console.log("🎤 Finalizing complete speech request:", fullText);
      const normalizedMsg = selectAndNormalizeTranscript([fullText]);
      const isVoiceControlCommand = detectAndExecuteVoiceCommand(normalizedMsg);
      if (!isVoiceControlCommand) {
        processMessage(normalizedMsg, "voice");
      }
    } else {
      setVoiceState("IDLE");
    }
  };

  // Start Speech-to-Text (STT) Recognition
  const startSpeechRecognition = () => {
    // When starting STT, pause active TTS so microphone input is clean
    const synth = synthesisRef.current || (typeof window !== "undefined" ? window.speechSynthesis : null);
    if (synth && synth.speaking && !synth.paused) {
      try {
        synth.pause();
        setPlaybackState("PAUSED");
        setVoiceState("PAUSED");
      } catch (e) {}
    }

    // Prevent duplicate activation if already listening
    if (isListeningRef.current) {
      return;
    }

    const rec = recognitionRef.current;
    if (!rec) {
      setVoiceState("ERROR");
      setErrorMessage("Speech recognition not supported in this browser.");
      return;
    }

    isVoiceSessionActiveRef.current = true;
    setVoiceState("LISTENING");
    setErrorMessage("");

    rec.onstart = () => {
      isListeningRef.current = true;
      setVoiceState("LISTENING");
    };

    rec.onresult = (event: any) => {
      let newFinal = "";
      let interim = "";
      let alternatives: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinal += event.results[i][0].transcript + " ";
          for (let j = 0; j < event.results[i].length; j++) {
            if (event.results[i][j]?.transcript) {
              alternatives.push(event.results[i][j].transcript);
            }
          }
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (newFinal) {
        speechAccumulatorRef.current = (speechAccumulatorRef.current + " " + newFinal).replace(/\s+/g, " ").trim();
      }

      const currentDisplay = (speechAccumulatorRef.current + " " + interim).replace(/\s+/g, " ").trim();
      latestInterimTranscriptRef.current = interim;
      setInterimTranscript(currentDisplay);

      // Check for instant voice control commands (e.g. Stop, Pause, Resume)
      const isExecuted = detectAndExecuteVoiceCommand(currentDisplay);
      if (isExecuted) {
        isVoiceSessionActiveRef.current = false;
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        try { rec.stop(); } catch (_) {}
        setInterimTranscript("");
        latestInterimTranscriptRef.current = "";
        speechAccumulatorRef.current = "";
        return;
      }

      // Reset silence auto-finalizer timer on any speech activity.
      // Uses 2.2s of total continuous silence after user finishes speaking to allow natural pauses.
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      if (currentDisplay.length > 0) {
        silenceTimerRef.current = setTimeout(() => {
          console.log("⚡ Natural end of speech detected (2.2s silence). Finalizing complete sentence...");
          finalizeSpeechAndProcess();
        }, 2200);
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        // If voice session is still active (user didn't click stop), auto-restart listening
        if (isVoiceSessionActiveRef.current) {
          try {
            rec.start();
          } catch (_) {}
          return;
        }
        isListeningRef.current = false;
        setVoiceState("IDLE");
        return;
      }
      console.error("STT Error:", event.error);
      isListeningRef.current = false;
      isVoiceSessionActiveRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setVoiceState("ERROR");
      if (event.error === "not-allowed") {
        setErrorMessage("Mic permission denied. Please allow mic access.");
      } else {
        setErrorMessage(`Microphone error: ${event.error}`);
      }
      setTimeout(() => {
        setVoiceState((prev) => (prev === "ERROR" ? "IDLE" : prev));
      }, 1500);
    };

    rec.onend = () => {
      isListeningRef.current = false;
      // If voice session is still active (user didn't manually stop mic and silence timer hasn't triggered),
      // automatically restart listening to continue capturing speech seamlessly.
      if (isVoiceSessionActiveRef.current) {
        console.log("🔄 SpeechRecognition engine ended — auto-restarting to keep listening continuously...");
        try {
          rec.start();
          isListeningRef.current = true;
        } catch (e: any) {
          if (e?.name !== "InvalidStateError") {
            console.error("Auto-restart exception:", e);
          }
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        setVoiceState((prev) => (prev === "LISTENING" ? "IDLE" : prev));
      }
    };

    try {
      speechAccumulatorRef.current = "";
      rec.start();
      isListeningRef.current = true;
    } catch (e: any) {
      if (e?.name !== "InvalidStateError") {
        console.error("SpeechRecognition start exception:", e);
      }
    }
  };

  const stopSpeechRecognition = () => {
    isVoiceSessionActiveRef.current = false;
    isListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setVoiceState((prev) => (prev === "LISTENING" ? "IDLE" : prev));
  };

  const handleMicClick = () => {
    console.log("[TTS MIC]");
    if (isVoiceSessionActiveRef.current || voiceState === "LISTENING") {
      // Manually clicking mic while listening stops session and processes captured speech immediately
      finalizeSpeechAndProcess();
    } else {
      // Stop any active TTS immediately so mic can listen cleanly
      handleStopMessage();
      if (!voiceModeRef.current) {
        setVoiceMode(true);
        voiceModeRef.current = true;
      }
      startSpeechRecognition();
    }
  };

  // Main message processing function (shared by Text and Voice)
  const processMessage = async (userMessage: string, source: "text" | "voice" = "text") => {
    // Immediate voice control intercept (Stop / Pause speaking out loud)
    if (detectAndExecuteVoiceCommand(userMessage)) {
      setVoiceState("IDLE");
      return;
    }

    if (!showLeadForm) {
      const lowerMsg = userMessage.toLowerCase().trim();
      const explicitRegisterRegex = /^(apply|register|enroll|signup|apply\s+now|register\s+now|enroll\s+now|i\s+want\s+to\s+apply|i\s+want\s+to\s+register|i\s+want\s+to\s+enroll|enroll\s+me|register\s+me|start\s+registration|start\s+my\s+registration)$/i;
      if (explicitRegisterRegex.test(lowerMsg)) {
        startLeadForm();
        return;
      }
    }

    if (showLeadForm) {
      // STEP 1 - Name
      if (leadStep === 1) {
        setLeadData((prev) => ({
          ...prev,
          name: userMessage,
        }));
        setLeadStep(2);
        const botReply = "Please enter your Email Address.";

        setMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: userMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          {
            sender: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        // Bot MUST NOT AUTO-SPEAK on new answers. Remain silent until user clicks Play.
        setVoiceState("IDLE");
        return;
      }

      // STEP 2 - Email
      if (leadStep === 2) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userMessage.trim())) {
          const errorReply = "That doesn't look like a valid email. Please enter a valid email address.";
          setMessages((prev) => [
            ...prev,
            {
              sender: "user",
              text: userMessage,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
            {
              sender: "bot",
              text: errorReply,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          setVoiceState("IDLE");
          return;
        }

        setLeadData((prev) => ({
          ...prev,
          email: userMessage.trim(),
        }));
        setLeadStep(3);
        const botReply = "Please enter your Phone Number.";

        setMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: userMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          {
            sender: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        setVoiceState("IDLE");
        return;
      }

      // STEP 3 - Phone Number
      if (leadStep === 3) {
        // Basic phone validation (digits and optional plus, min 10 digits)
        const phoneDigits = userMessage.replace(/\D/g, "");
        if (phoneDigits.length < 10) {
          const errorReply = "That doesn't look like a valid phone number. Please enter at least 10 digits.";
          setMessages((prev) => [
            ...prev,
            {
              sender: "user",
              text: userMessage,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
            {
              sender: "bot",
              text: errorReply,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          setVoiceState("IDLE");
          return;
        }

        setLeadData((prev) => ({
          ...prev,
          phone: userMessage,
        }));
        setLeadStep(4);
        const botReply = "Please enter your Interested Domain.\n\nExample: Full Stack Development, Data Science, AI/ML, UI/UX Design, Digital Marketing";

        setMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: userMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          {
            sender: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        setVoiceState("IDLE");
        return;
      }

      // STEP 4 - Domain & Save to Database
      if (leadStep === 4) {
        setVoiceState("PROCESSING");
        try {
          const payload = {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            preferred_domain: userMessage,
          };

          const res = await saveLead(payload);
          if (!res.success) {
            throw new Error(res.error || "Failed to save lead");
          }

          const botReply = `Thank you for registering, ${leadData.name}! Your details have been submitted successfully. Our team will contact you soon.`;
          setMessages((prev) => [
            ...prev,
            {
              sender: "user",
              text: userMessage,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
            {
              sender: "bot",
              text: botReply,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);

          setShowLeadForm(false);
          setLeadStep(0);
          setLeadData({ name: "", email: "", phone: "", domain: "" });

          setVoiceState("IDLE");
        } catch (error) {
          console.error("Lead saving error:", error);
          const errorReply = "Sorry, there was an issue saving your application. Please try submitting again.";
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: errorReply,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          setVoiceState("IDLE");
        }
        return;
      }
    }

    // Normal chat message flow
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setIsTyping(true);
    setVoiceState("PROCESSING");

    try {
      const voiceMetadata = source === "voice" ? { duration: parseFloat((userMessage.length / 5).toFixed(1)), confidence: 0.95 } : null;
      const data = await sendChat(userMessage, source, sessionId, voiceMetadata);

      if (!data.success) {
        throw new Error(data.message || "Failed to get response");
      }

      const botReply = data.reply;

      // Handle escalation triggers if returned from backend
      if (data.escalation) {
        let escalationTicketId = "";
        try {
          const escalateData = await createEscalation(sessionId, `User requested human support. Trigger phrase: "${userMessage}"`);
          if (escalateData.success && escalateData.data) {
            escalationTicketId = escalateData.data.id || escalateData.data.session_id || "";
          }
        } catch (escalateErr) {
          console.warn("Escalation ticket creation warning:", escalateErr);
        }

        let escalationMessage = botReply;
        if (escalationTicketId) {
          escalationMessage += `\n\n[Escalation Support Ticket Created: #${escalationTicketId}]`;
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: escalationMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        // Auto-speak in voice mode; otherwise silent until user clicks Play
        if (source === "voice" && !isSpeakerMutedRef.current) {
          speakResponse(escalationMessage);
        } else {
          setVoiceState("IDLE");
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        // Auto-speak in voice mode; otherwise silent until user clicks Play
        if (source === "voice" && !isSpeakerMutedRef.current) {
          speakResponse(botReply);
        } else {
          setVoiceState("IDLE");
        }
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      const errorMessageText = error instanceof Error ? error.message : String(error);
      const errorReply = `Sorry, I'm unable to connect to the WeIntern AI right now. (${errorMessageText}) Please try again.`;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      setVoiceState("ERROR");
      setErrorMessage("Network issue. Reverted to text chat fallback.");
      setTimeout(() => setVoiceState("IDLE"), 4000);
    } finally {
      setIsTyping(false);
    }
  };

  const processEditedMessage = async (targetIdx: number, updatedText: string) => {
    handleStopMessage();

    const updatedUserMsg: ChatMessage = {
      sender: "user",
      text: updatedText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev.slice(0, targetIdx), updatedUserMsg]);

    setIsTyping(true);
    setVoiceState("PROCESSING");

    try {
      const data = await sendChat(updatedText, "text", sessionId, null);
      if (!data.success) {
        throw new Error(data.message || "Failed to get response");
      }

      const botReply = data.reply;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      if (voiceMode && !isSpeakerMuted) {
        speakResponse(botReply);
      } else {
        setVoiceState("IDLE");
      }
    } catch (error) {
      console.error("Chat Edit API Error:", error);
      const errorMessageText = error instanceof Error ? error.message : String(error);
      const errorReply = `Sorry, I'm unable to connect to the WeIntern AI right now. (${errorMessageText}) Please try again.`;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = message.trim();
    setMessage("");
    await processMessage(userMessage, "text");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition duration-300 z-50 flex items-center justify-center hover:scale-105 active:scale-95"
      >
        <BsChatDotsFill size={24} />
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-0 right-0 w-full h-[100dvh] sm:bottom-24 sm:right-6 sm:w-[380px] sm:h-[550px] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-150 z-50">

          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
            <div>
              <h2 className="font-bold flex items-center gap-1.5 text-sm md:text-base">
                🤖 WeIntern AI Assistant
              </h2>
              <p className="text-[10px] opacity-90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>
                Online {voiceMode && "• Voice Mode Active"}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              {/* Clear History */}
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Clear chat history"
                className="hover:text-red-200 transition-colors p-1"
              >
                <BsTrash size={18} />
              </button>

              {/* Speaker Output Toggle */}
              <button
                onClick={() => {
                  if (isSpeakerMuted) {
                    handleUnmute();
                  } else {
                    handleMute();
                  }
                }}
                title={isSpeakerMuted ? "Unmute bot output" : "Mute bot output"}
                className="hover:text-blue-200 transition-colors p-1"
              >
                {isSpeakerMuted ? <BsVolumeMuteFill size={20} /> : <BsVolumeUpFill size={20} />}
              </button>

              {/* Voice Mode (STT) Toggle */}
              <button
                onClick={() => {
                  const mode = !voiceMode;
                  setVoiceMode(mode);
                  voiceModeRef.current = mode;
                  if (mode) {
                    startSpeechRecognition();
                  } else {
                    stopSpeechRecognition();
                    if (synthesisRef.current) {
                      synthesisRef.current.cancel();
                    }
                    setVoiceState("IDLE");
                  }
                }}
                title={voiceMode ? "Disable Voice Mode" : "Enable Voice Mode"}
                className={`hover:text-blue-200 transition-colors p-1 ${voiceMode ? "text-yellow-300 font-bold" : "text-white"}`}
              >
                {voiceMode ? <BsMicFill size={20} /> : <BsMicMuteFill size={20} />}
              </button>

              <button onClick={() => setOpen(false)} className="hover:text-blue-200 transition-colors p-1">
                <BsX size={28} />
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg z-50 font-medium">
              {toastMessage}
            </div>
          )}

          {/* Clear History Confirmation Modal */}
          {showClearConfirm && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-[280px] w-full text-center space-y-3 border border-gray-100">
                <div className="w-11 h-11 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-lg">
                  <BsTrash />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Clear Chat History?</h3>
                  <p className="text-[11px] text-gray-500 mt-1">All saved messages for this session will be deleted.</p>
                </div>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium flex-1 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium flex-1 shadow transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Apply / Register Lead Form Modal Overlay */}
          {showLeadForm && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-50 p-2 sm:p-4 overflow-y-auto flex items-center justify-center animate-in fade-in duration-200">
              <div className="w-full max-w-sm my-auto">
                <LeadForm
                  onClose={handleCloseLeadForm}
                  onSkip={handleSkipLeadForm}
                  onSuccess={(applicantName) => {
                    setMessages((prev) => [
                      ...prev,
                      {
                        sender: "bot",
                        text: `🎉 Thank you for registering, ${applicantName}! Your details have been submitted successfully. Our team will contact you soon.`,
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ]);
                    setTimeout(() => {
                      handleCloseLeadForm();
                    }, 2000);
                  }}
                />
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {msg.sender === "bot" && (
                  <div className="mr-2 text-2xl self-end mb-1">🤖</div>
                )}

                <div
                  className={`p-3 rounded-xl shadow max-w-[75%] ${msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-900 border border-gray-100 rounded-bl-none"
                    }`}
                >
                  {editingIndex === index ? (
                    <div className="space-y-2 min-w-[200px]">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEditedMessage(index);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                        rows={Math.max(2, editText.split("\n").length)}
                        className="w-full bg-white text-gray-900 text-sm p-2 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                      <div className="flex justify-end gap-1.5 pt-0.5">
                        <button
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 text-[11px] rounded-md bg-blue-700/80 text-white hover:bg-blue-800 font-medium transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditedMessage(index)}
                          className="px-2.5 py-1 text-[11px] rounded-md bg-emerald-500 text-white hover:bg-emerald-600 font-semibold shadow transition cursor-pointer flex items-center gap-1"
                        >
                          <BsCheck2 className="w-3.5 h-3.5 font-bold" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</div>
                      {msg.sender === "bot" && (leadStep > 0 || showLeadForm) && (msg.text.includes("registered") || msg.text.includes("Please enter your")) && (
                        <div className="mt-2.5 pt-2 border-t border-gray-200 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleSkipLeadForm}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 text-xs transition flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            ⏩ Skip Registration / Continue without Registration
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseLeadForm}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 text-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            ✖ Close
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Bar & Footer */}
                  <div
                    className={`flex items-center justify-between gap-2 mt-2 pt-1.5 border-t text-[11px] ${
                      msg.sender === "user" ? "border-blue-500 text-blue-100" : "border-gray-100 text-gray-400"
                    }`}
                  >
                    {/* Action Buttons: Copy, Edit, Retry */}
                    <div className="flex items-center gap-2">
                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyMessage(index, msg.text)}
                        title="Copy text"
                        className="hover:opacity-80 transition duration-150 flex items-center gap-0.5 cursor-pointer"
                      >
                        {copiedIndex === index ? (
                          <>
                            <BsCheck2 className="w-3.5 h-3.5 text-green-400 font-bold" />
                            <span className="text-[10px] text-green-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <BsCopy className="w-3 h-3" />
                        )}
                      </button>

                      {/* Edit Button (User) */}
                      {msg.sender === "user" && (
                        <button
                          onClick={() => handleEditMessage(index, msg.text)}
                          title="Edit message"
                          className={`hover:opacity-80 transition duration-150 flex items-center gap-0.5 cursor-pointer ml-1 ${
                            editingIndex === index ? "text-yellow-300 font-bold" : ""
                          }`}
                        >
                          <BsPencilSquare className="w-3 h-3" />
                        </button>
                      )}

                      {/* Retry Button (Bot) */}
                      {msg.sender === "bot" && index > 0 && messages[index - 1]?.sender === "user" && (
                        <button
                          onClick={() => handleRetryMessage(messages[index - 1].text)}
                          title="Retry response"
                          className="hover:text-blue-600 transition duration-150 flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          <BsArrowClockwise className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Right side: TTS Controls (Bot) + Timestamp */}
                    <div className="flex items-center gap-2">
                      {msg.sender === "bot" && (
                        <div className="flex items-center gap-1.5">
                          {((playingMessageIndex === index || pausedMessageIndexRef.current === index) || ((playingMessageIndex === -1 || pausedMessageIndexRef.current === -1) && index === messages.length - 1)) ? (
                            <>
                              {playbackState === "PLAYING" ? (
                                <button
                                  onClick={handlePauseMessage}
                                  title="Pause response"
                                  className="hover:text-blue-600 transition duration-200 cursor-pointer"
                                >
                                  <BsPauseFill className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => playbackState === "PAUSED" ? handleResumeOrContinueMessage() : handlePlayMessage(index, msg.text)}
                                  title="Resume response"
                                  className="hover:text-blue-600 transition duration-200 cursor-pointer"
                                >
                                  <BsPlayFill className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={handleStopMessage}
                                title="Stop response"
                                className="hover:text-red-500 transition duration-200 cursor-pointer"
                              >
                                <BsStopFill className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handlePlayMessage(index, msg.text)}
                              title="Speak response"
                              className="hover:text-blue-600 transition duration-200 cursor-pointer"
                            >
                              <BsPlayFill className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                      <span className="text-[9px]">{msg.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Interim Transcript display for user speech */}
            {voiceState === "LISTENING" && interimTranscript && (
              <div className="flex justify-end">
                <div className="bg-gray-200 text-gray-700 p-3 rounded-xl shadow max-w-[75%] italic text-sm rounded-br-none">
                  🎤 {interimTranscript}...
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="mr-2 text-2xl self-end mb-1">🤖</div>
                <div className="bg-white text-gray-400 p-3 rounded-xl shadow border border-gray-100 rounded-bl-none text-sm italic flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>

          </div>

          {/* Voice State Information Panel — shown when voice mode is on OR when TTS is actively playing */}
          {(voiceMode || playbackState !== "IDLE") && (
            <div className="bg-white border-t px-4 py-2 flex flex-col gap-1.5">
              {/* Listening panel */}
              {voiceState === "LISTENING" && (
                <div className="flex justify-between items-center text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                  <span className="flex items-center gap-1.5 font-medium animate-pulse">
                    <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                    Listening... speak now
                  </span>
                  <button
                    onClick={stopSpeechRecognition}
                    className="text-[10px] text-gray-500 hover:text-gray-700 font-semibold underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Speaking panel */}
              {voiceState === "SPEAKING" && (
                <div className="flex justify-between items-center text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Bot is speaking...</span>
                    <div className="voice-wave-container">
                      <div className="voice-wave-bar"></div>
                      <div className="voice-wave-bar"></div>
                      <div className="voice-wave-bar"></div>
                      <div className="voice-wave-bar"></div>
                      <div className="voice-wave-bar"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePauseMessage}
                      className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition"
                    >
                      Pause
                    </button>
                    <button
                      onClick={handleStopMessage}
                      className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 font-semibold transition"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {/* Paused panel */}
              {voiceState === "PAUSED" && (
                <div className="flex justify-between items-center text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <span className="font-medium flex items-center gap-1">
                    ⏸️ Speech Paused
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResumeOrContinueMessage}
                      className="px-2 py-1 text-[10px] bg-amber-600 text-white rounded hover:bg-amber-700 font-semibold transition"
                    >
                      Continue
                    </button>
                    <button
                      onClick={handleStopMessage}
                      className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 font-semibold transition"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {/* Processing panel */}
              {voiceState === "PROCESSING" && (
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <span className="font-medium animate-pulse">Processing voice data...</span>
                </div>
              )}

              {/* Error panel */}
              {voiceState === "ERROR" && errorMessage && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 text-center font-semibold">
                  ⚠️ {errorMessage}
                </div>
              )}
            </div>
          )}

          {/* Registration Active Sticky Bar */}
          {(showLeadForm || leadStep > 0) && (
            <div className="bg-amber-50 border-t border-b border-amber-200 p-2.5 px-4 flex items-center justify-between gap-2 text-xs shadow-sm z-30">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                📝 Registration in progress (Step {leadStep || 1} of 4)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkipLeadForm}
                  className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold rounded-lg transition border border-amber-300 flex items-center gap-1 text-[11px] cursor-pointer shadow-sm"
                >
                  ⏩ Skip Registration
                </button>
                <button
                  type="button"
                  onClick={handleCloseLeadForm}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg transition border border-red-300 flex items-center gap-1 text-[11px] cursor-pointer shadow-sm"
                >
                  ✖ Close
                </button>
              </div>
            </div>
          )}

          {/* Quick Replies */}
          <div className="border-t p-3 flex overflow-x-auto gap-2 bg-white border-b border-gray-100 no-scrollbar scroll-smooth">

            <button
              onClick={() => quickReply("Apply / Register")}
              className="flex-shrink-0 border border-blue-600 bg-blue-50 text-blue-700 font-medium rounded-full px-3 py-1 text-xs hover:bg-blue-600 hover:text-white transition duration-200 touch-manipulation"
            >
              ✨ Apply / Register
            </button>

            <button
              onClick={() => quickReply("Fees & EMI")}
              className="flex-shrink-0 border border-gray-300 text-gray-600 rounded-full px-3 py-1 text-xs hover:border-blue-600 hover:text-blue-600 transition duration-200 touch-manipulation"
            >
              Fees & EMI
            </button>

            <button
              onClick={() => quickReply("Domains")}
              className="flex-shrink-0 border border-gray-300 text-gray-600 rounded-full px-3 py-1 text-xs hover:border-blue-600 hover:text-blue-600 transition duration-200 touch-manipulation"
            >
              Domains
            </button>

            <button
              onClick={() => quickReply("Certificates")}
              className="flex-shrink-0 border border-gray-300 text-gray-600 rounded-full px-3 py-1 text-xs hover:border-blue-600 hover:text-blue-600 transition duration-200 touch-manipulation"
            >
              Certificates
            </button>

            <button
              onClick={() => quickReply("Contact")}
              className="flex-shrink-0 border border-gray-300 text-gray-600 rounded-full px-3 py-1 text-xs hover:border-blue-600 hover:text-blue-600 transition duration-200 touch-manipulation"
            >
              Contact
            </button>

          </div>

          {/* Input Panel */}
          <div className="border-t p-3 flex gap-2 bg-white items-center">

            <input
              ref={inputRef}
              type="text"
              placeholder={voiceState === "LISTENING" ? "Listening to your voice..." : "Type your message..."}
              value={message}
              disabled={voiceState === "LISTENING"}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              className="flex-1 border border-gray-300 rounded-lg px-3.5 py-2.5 text-black text-base md:text-sm placeholder-gray-400 outline-none focus:border-blue-600 disabled:bg-gray-100 disabled:text-gray-500"
            />

            {/* Voice Input Mic Button — always visible when speech is supported */}
            {isSpeechSupported && (
              <button
                onClick={handleMicClick}
                title={voiceState === "LISTENING" ? "Stop recording" : "Tap to speak"}
                className={`p-3 rounded-lg text-white transition duration-200 touch-manipulation ${
                  voiceState === "LISTENING"
                    ? "bg-red-500 hover:bg-red-600 voice-listening-btn"
                    : voiceState === "SPEAKING"
                      ? "bg-orange-500 hover:bg-orange-600 animate-pulse"
                      : voiceMode
                        ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300"
                        : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {voiceState === "LISTENING" ? <BsMicMuteFill size={18} /> : <BsMicFill size={18} />}
              </button>
            )}

            <button
              onClick={sendMessage}
              disabled={voiceState === "LISTENING" || !message.trim()}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center justify-center touch-manipulation"
            >
              <IoSend size={18} />
            </button>

          </div>

        </div>
      )}
    </>
  );
}
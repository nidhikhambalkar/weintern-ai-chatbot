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
  const [voiceState, setVoiceState] = useState<"IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "PAUSED" | "ERROR">("IDLE");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [playbackState, setPlaybackState] = useState<"IDLE" | "PLAYING" | "PAUSED">("IDLE");
  const [detectedLang, setDetectedLang] = useState<string>("en-IN"); // tracks last detected speech language
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isCommandOnlyModeRef = useRef<boolean>(false); // when true, recognition only monitors for pause/resume/stop commands without sending to chat
  const synthesisRef = useRef<any>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isTtsSpeakingRef = useRef<boolean>(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeTextRef = useRef<string>("");
  const currentCharIndexRef = useRef<number>(0);
  const pausedCharIndexRef = useRef<number>(0);
  const isVoicePausedRef = useRef<boolean>(false);
  const isCancelledByCommandRef = useRef<boolean>(false);
  const pausedMessageIndexRef = useRef<number | null>(null);
  const isSpeakerMutedRef = useRef<boolean>(false);
  const voiceModeRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mobileSafetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestInterimTranscriptRef = useRef<string>("");
  const lastFinalChunkRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // ── Pause/Resume position tracking ──────────────────────────────────────
  const boundaryCharIndexRef = useRef<number>(0);          // charIndex from last onboundary event
  const pausedTextRemainderRef = useRef<string>("");        // text substring saved on pause
  const pausedMessageIndexForResumeRef = useRef<number | null>(null); // msg index for resume
  const speechAccumulatorRef = useRef<string>("");          // accumulates speech segments across continuous listening
  const isVoiceSessionActiveRef = useRef<boolean>(false);    // tracks if user is in an active recording session
  const playbackStateRef = useRef<"IDLE" | "PLAYING" | "PAUSED">("IDLE");
  const voiceStateRef = useRef<"IDLE" | "LISTENING" | "THINKING" | "PROCESSING" | "SPEAKING" | "PAUSED" | "ERROR">("IDLE");
  const lastExecutedCommandRef = useRef<{ command: string; time: number } | null>(null);
  const isProcessingRef = useRef<boolean>(false);           // mutex lock against concurrent request processing
  const lastProcessedTranscriptRef = useRef<{ text: string; time: number } | null>(null); // deduplicates duplicate input
  const hasFinalizedSpeechRef = useRef<boolean>(false);     // flag to ensure single finalization per turn

  const clearMobileSafetyTimeout = () => {
    if (mobileSafetyTimeoutRef.current) {
      clearTimeout(mobileSafetyTimeoutRef.current);
      mobileSafetyTimeoutRef.current = null;
    }
  };

  const startMobileSafetyTimeout = (seconds = 15) => {
    clearMobileSafetyTimeout();
    mobileSafetyTimeoutRef.current = setTimeout(() => {
      console.warn("⚠️ Mobile safety timeout reached. Resetting voice state.");
      stopSpeechRecognition();
      isProcessingRef.current = false;
      hasFinalizedSpeechRef.current = false;
      setIsTyping(false);
      if (voiceStateRef.current !== "SPEAKING" && playbackStateRef.current === "IDLE") {
        updateVoiceState("IDLE");
      }
    }, seconds * 1000);
  };

  const updatePlaybackState = (newState: "IDLE" | "PLAYING" | "PAUSED") => {
    playbackStateRef.current = newState;
    setPlaybackState(newState);
  };

  const updateVoiceState = (newState: "IDLE" | "LISTENING" | "THINKING" | "PROCESSING" | "SPEAKING" | "PAUSED" | "ERROR") => {
    voiceStateRef.current = newState;
    setVoiceState(newState as any);
  };

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

  const cleanupSpeechRecognition = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    clearMobileSafetyTimeout();

    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    isStartingRef.current = false;
  };

  const initSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }
    setIsSpeechSupported(true);

    cleanupSpeechRecognition();

    const rec = new SpeechRecognition();
    rec.continuous = false;       // Single-utterance per mic tap for 100% reliable cross-device performance (iOS Safari, Android Chrome, Edge)
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.lang = "en-IN";

    rec.onstart = () => {
      isStartingRef.current = false;
      isListeningRef.current = true;
      hasFinalizedSpeechRef.current = false;
      if (playbackStateRef.current === "IDLE" && voiceStateRef.current !== "THINKING") {
        updateVoiceState("LISTENING");
        startMobileSafetyTimeout(15);
      }
    };

    rec.onresult = (event: any) => {
      let newFinal = "";
      let interim = "";
      let alternatives: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i]?.[0]?.transcript) {
          for (let j = 0; j < event.results[i].length; j++) {
            if (event.results[i][j]?.transcript) {
              alternatives.push(event.results[i][j].transcript);
            }
          }
          if (event.results[i].isFinal) {
            const chunk = event.results[i][0].transcript.trim();
            if (chunk && chunk !== lastFinalChunkRef.current) {
              newFinal += chunk + " ";
              lastFinalChunkRef.current = chunk;
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
      }

      // Voice command intercept checks
      if (interim && detectAndExecuteVoiceCommand(interim, alternatives)) {
        return;
      }
      if (newFinal && detectAndExecuteVoiceCommand(newFinal, alternatives)) {
        return;
      }

      if (playbackStateRef.current !== "IDLE") {
        return;
      }

      if (newFinal) {
        speechAccumulatorRef.current = (speechAccumulatorRef.current + " " + newFinal).replace(/\s+/g, " ").trim();
      }

      const currentDisplay = (speechAccumulatorRef.current + " " + interim).replace(/\s+/g, " ").trim();
      latestInterimTranscriptRef.current = interim;

      if (currentDisplay && detectAndExecuteVoiceCommand(currentDisplay, alternatives)) {
        return;
      }

      setInterimTranscript(currentDisplay);

      if (playbackStateRef.current === "IDLE" && voiceStateRef.current !== "THINKING") {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (currentDisplay.length > 0) {
          const silenceDuration = interim ? 2500 : 1800;
          silenceTimerRef.current = setTimeout(() => {
            console.log("⚡ Silence timeout reached. Finalizing speech input...");
            finalizeSpeechAndProcess();
          }, silenceDuration);
        }
      }
    };

    rec.onerror = (event: any) => {
      console.warn("STT Error:", event.error);
      isStartingRef.current = false;
      isListeningRef.current = false;
      isVoiceSessionActiveRef.current = false;
      clearMobileSafetyTimeout();

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (event.error === "no-speech" || event.error === "aborted") {
        if (!hasFinalizedSpeechRef.current && (speechAccumulatorRef.current || latestInterimTranscriptRef.current)) {
          finalizeSpeechAndProcess();
          return;
        }
        setInterimTranscript("");
        latestInterimTranscriptRef.current = "";
        speechAccumulatorRef.current = "";
        lastFinalChunkRef.current = "";
        if (playbackStateRef.current === "IDLE") {
          updateVoiceState("IDLE");
        }
        return;
      }

      setInterimTranscript("");
      latestInterimTranscriptRef.current = "";
      speechAccumulatorRef.current = "";
      lastFinalChunkRef.current = "";

      updateVoiceState("ERROR");
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErrorMessage("Mic permission denied. Please allow mic access.");
      } else {
        setErrorMessage(`Microphone error: ${event.error}`);
      }
      setTimeout(() => {
        if (voiceStateRef.current === "ERROR") updateVoiceState("IDLE");
      }, 3000);
    };

    rec.onend = () => {
      isStartingRef.current = false;
      isListeningRef.current = false;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (!hasFinalizedSpeechRef.current && (speechAccumulatorRef.current || latestInterimTranscriptRef.current)) {
        finalizeSpeechAndProcess();
      } else {
        isVoiceSessionActiveRef.current = false;
        setInterimTranscript("");
        latestInterimTranscriptRef.current = "";
        speechAccumulatorRef.current = "";
        lastFinalChunkRef.current = "";
        if (playbackStateRef.current === "IDLE" && voiceStateRef.current === "LISTENING") {
          updateVoiceState("IDLE");
        }
      }
    };

    recognitionRef.current = rec;
  };

  // Initialize fresh session ID per page load & Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("weintern_session_id");
      const id = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      setSessionId(id);

      initSpeechRecognition();

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

    return () => {
      cleanupSpeechRecognition();
      if (synthesisRef.current) {
        try { synthesisRef.current.cancel(); } catch (e) {}
      }
    };
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

  const quickReply = async (actionType: string) => {
    if (actionType === "apply" || actionType.includes("Apply") || actionType.includes("Register")) {
      startLeadForm();
      return;
    }

    let queryText = actionType;
    if (actionType === "fees" || actionType.includes("Fees")) {
      queryText = "What are the internship fees, EMI options, and course prices?";
    } else if (actionType === "domains" || actionType.includes("Domains")) {
      queryText = "What internship domains are available at WeIntern?";
    } else if (actionType === "certificates" || actionType.includes("Certificates")) {
      queryText = "Will I receive a certificate after completing the internship?";
    } else if (actionType === "contact" || actionType.includes("Contact")) {
      queryText = "How can I contact your team?";
    }

    setMessage("");
    await processMessage(queryText, "text");
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
      /^(please\s+)?(stop|stop it|stop speaking|stop audio|stop voice|stop reading|stop talking|stop now|stop response|stop bot|quiet|shut up|halt|cancel)(\s+please)?$/i,
      /^(please\s+)?(ruko|ruk|roko|band karo|band karo ab|chup|chup ho jao|chup raho|bas|bas karo|bas karo ab|thamba|thamb|band kara|rok do|band kar do|awaaz band)(\s+please)?$/i,
      /^(रुको|रुक|रोको|बंद करो|चुप|चुप हो जाओ|चुप रहो|बस|बस करो|थांबा|थांब)$/i,
      /^\b(stop|quiet|shut up|band karo|thambva|thaambva|थांबवा|rok do|band kar do)\b/i
    ],
    PAUSE: [
      /^(please\s+)?(pause|paws|paus|pos|pause it|pause speaking|pause audio|pause speech|pause reading|pause talking|pause now|pause please|wait|wait please|wait a minute|hold on|hold)(\s+please)?$/i,
      /^(please\s+)?(ruko thoda|thoda ruko|ek minute ruko|ek minute|hold karo|pause karo|jara thamba|thoda thamba|roko|thamba|thaamb)(\s+please)?$/i,
      /^(पॉज|पॉज़|रुको थोड़ा|थोड़ा रुको|एक मिनट|जरा थांबा|रुको|थांब)$/i,
      /^\b(pause|paws|wait|ruko|roko|thamba|thaamb|रुको|थांब)\b/i
    ],
    RESUME: [
      /^(please\s+)?(continue|resume|unpause|continue please|resume please|go on|keep speaking|keep reading|carry on|continue speaking|continue reading|continue talking|continue now|resume speaking|resume reading|play|play speech)(\s+please)?$/i,
      /^(please\s+)?(chalu karo|chalu kijiye|phir se chalu karo|continue karo|resume karo|aage bolo|aage batao|bolo|aage badho|boliye|pudhe sanga|pudhe bola|chalu kara|jari rakho)(\s+please)?$/i,
      /^(कंटिन्यू|चालू करा|चालू करो|आगे बोलो|आगे बताओ|फिर से चालू करो|पुढे बोला|जारी रखो|पुन्हा सुरू)$/i,
      /^\b(continue|resume|unpause|chalu karo|jari rakho|aage bolo|जारी रखो|पुन्हा सुरू)\b/i
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

  // High-Priority Voice Command Detector Architecture:
  // Evaluates raw input, interim snippets, AND candidate substrings
  // to detect control words (pause, continue, resume, stop) instantly without waiting for sentence completion or final results.
  const detectVoiceCommandType = (inputText: string): "STOP" | "PAUSE" | "RESUME" | "REPEAT" | "START" | "MUTE" | "UNMUTE" | null => {
    if (!inputText) return null;

    const { raw, transliterated } = normalizeCommandInput(inputText);
    if (!raw) return null;

    // Check if input is a longer question with domain terms
    const isQuestion = QUESTION_KEYWORDS_REGEX.test(raw) || /\?$/.test(raw);
    const words = raw.split(/\s+/);
    if (isQuestion && words.length > 5) {
      return null;
    }

    const suffix3 = words.length > 3 ? words.slice(-3).join(" ") : raw;
    const suffix2 = words.length > 2 ? words.slice(-2).join(" ") : raw;
    const suffix1 = words.length > 1 ? words.slice(-1).join(" ") : raw;

    const candidates = Array.from(new Set([raw, transliterated, suffix3, suffix2, suffix1]));

    for (const cand of candidates) {
      if (!cand) continue;
      const cClean = cand.trim();

      // STOP checks
      if (/^(please\s+)?(stop|stop it|stop speaking|stop reading|stop talking|stop the bot|stop voice|stop audio|quiet|shut up|band karo|chup|chup ho jao|bas karo|rok do|awaaz band)(\s+please|\s+it)?$/i.test(cClean)) {
        return "STOP";
      }
      if (/\b(stop|stop speaking|stop reading|stop talking|stop the bot|please stop|shut up|band karo|chup ho jao|bas karo|awaaz band)\b/i.test(cClean) && cClean.split(/\s+/).length <= 4) {
        return "STOP";
      }

      // PAUSE checks
      if (/^(please\s+)?(pause|pause it|pause speaking|pause reading|pause talking|pause the bot|pause voice|pause audio|pause speech|wait|wait please|wait a minute|hold on|hold|ruko|roko|thoda ruko|ruko thoda|thamba|hold karo)(\s+please|\s+it|\s+bot)?$/i.test(cClean)) {
        return "PAUSE";
      }
      if (/\b(pause|pause speaking|pause reading|pause talking|pause the bot|please pause|hold on|ruko thoda|thoda ruko|hold karo|ruko|roko)\b/i.test(cClean) && cClean.split(/\s+/).length <= 4) {
        return "PAUSE";
      }

      // CONTINUE / RESUME checks
      if (/^(please\s+)?(continue|resume|continue speaking|resume speaking|continue reading|resume reading|go on|keep speaking|carry on|chalu karo|phir se chalu|continue karo|resume karo|aage bolo)(\s+please|\s+speaking|\s+reading)?$/i.test(cClean)) {
        return "RESUME";
      }
      if (/\b(continue|resume|continue speaking|resume speaking|continue reading|resume reading|go on|keep speaking|carry on|chalu karo|continue karo|resume karo)\b/i.test(cClean) && cClean.split(/\s+/).length <= 4) {
        return "RESUME";
      }

      // REPEAT / START checks
      if (/^(please\s+)?(repeat|repeat it|repeat please|speak again|say again|replay|shuru se|dobara bolo|phir se bolo)(\s+please)?$/i.test(cClean)) {
        return "REPEAT";
      }

      // MUTE checks
      if (/^(please\s+)?(mute|mute volume|turn off voice|silent|awaaz band)(\s+please)?$/i.test(cClean)) {
        return "MUTE";
      }

      // UNMUTE checks
      if (/^(please\s+)?(unmute|unmute volume|turn on voice|awaaz chalu)(\s+please)?$/i.test(cClean)) {
        return "UNMUTE";
      }
    }

    return null;
  };

  const executeVoiceControlCommand = (command: "pause" | "continue" | "stop") => {
    console.log(`⚡ Executing Priority Voice Command: [${command}]`);
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
    if (voiceStateRef.current === "SPEAKING") {
      updateVoiceState("IDLE");
    }
  };

  const handleUnmute = () => {
    setIsSpeakerMuted(false);
    isSpeakerMutedRef.current = false;
  };

  // Handles natural voice command detection and immediate execution from interim or final speech (supports English, Hindi, Marathi)
  const detectAndExecuteVoiceCommand = (text: string, alternatives?: string[]): boolean => {
    const listToCheck = Array.isArray(alternatives) && alternatives.length > 0 ? [text, ...alternatives] : [text];

    for (const rawItem of listToCheck) {
      if (!rawItem) continue;
      const cleanItem = String(rawItem).trim();
      if (!cleanItem) continue;

      const cmdType = detectVoiceCommandType(cleanItem);
      if (cmdType) {
        const now = Date.now();
        // Deduplication check across 1200ms for same command
        if (
          lastExecutedCommandRef.current &&
          lastExecutedCommandRef.current.command === cmdType &&
          now - lastExecutedCommandRef.current.time < 1200
        ) {
          setInterimTranscript("");
          latestInterimTranscriptRef.current = "";
          speechAccumulatorRef.current = "";
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          return true;
        }
        lastExecutedCommandRef.current = { command: cmdType, time: now };

        // Clear all transcript buffers immediately so control commands are never sent to AI
        setInterimTranscript("");
        latestInterimTranscriptRef.current = "";
        speechAccumulatorRef.current = "";
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        console.log(`⚡ Priority Voice Command Executed: [${cmdType}] from input: "${cleanItem}"`);

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

      // Secondary fallback matching for raw lower text
      const rawLower = cleanItem.toLowerCase().trim();

      const isStop =
        /^(stop|stop reading|stop speaking|stop talking|stop it|stop now|please stop|stop please|shut up|quiet|halt|cancel reading|cancel speech|band karo|बंद करो|thambva|thaambva|थांबवा|chup|chup ho jao|bas karo|rok do|band kar do|awaaz band|aawaz band)$/i.test(rawLower) ||
        /\b(stop reading|stop speaking|stop talking|stop it|please stop|stop please|shut up|band karo|बंद करो|thambva|thaambva|थांबवा|chup ho jao|bas karo|rok do|band kar do|awaaz band|aawaz band)\b/i.test(rawLower) ||
        /^(stop|band karo|बंद करो|thambva|thaambva|थांबवा)$/i.test(rawLower) ||
        (/^\b(stop|quiet|band karo|thambva|thaambva)\b/i.test(rawLower) && !/\b(non-stop|bus stop|one stop|stop by)\b/i.test(rawLower));

      if (isStop) {
        executeVoiceControlCommand("stop");
        return true;
      }

      const isPause =
        /^(pause|paws|paus|pos|pause reading|pause speaking|pause talking|pause it|pause now|please pause|pause please|wait|hold on|pause speech|ruko|roko|thoda ruko|ruko thoda|thamba|thaamb|रुको|थांब|hold karo|thoda wait|rokna)$/i.test(rawLower) ||
        /\b(pause reading|pause speaking|pause talking|pause it|please pause|pause please|hold on|pause speech|ruko thoda|thoda ruko|thamba|thaamb|रुको|थांब|hold karo|thoda wait|thoda roko)\b/i.test(rawLower) ||
        /^(pause|paws|wait|ruko|roko|thamba|thaamb|रुको|थांब)$/i.test(rawLower) ||
        /^\b(pause|paws|wait|ruko|roko|thamba|thaamb|रुको|थांब)\b/i.test(rawLower);

      if (isPause) {
        executeVoiceControlCommand("pause");
        return true;
      }

      const isResume =
        /^(continue|resume|unpause|go on|keep speaking|carry on|continue speaking|jari rakho|जारी रखो|punha suru|punha shuru|पुन्हा सुरू|chalu karo|phir se chalu karo|continue karo|resume karo|aage bolo)$/i.test(rawLower) ||
        /\b(continue karo|phir se chalu karo|resume karo|continue speaking|keep speaking|carry on|jari rakho|जारी रखो|punha suru|punha shuru|पुन्हा सुरू)\b/i.test(rawLower) ||
        /^(continue|resume|unpause|जारी रखो|पुन्हा सुरू)$/i.test(rawLower) ||
        /^\b(continue|resume|unpause|chalu karo|jari rakho|aage bolo)\b/i.test(rawLower);

      if (isResume) {
        executeVoiceControlCommand("continue");
        return true;
      }
    }

    return false;
  };

  const handleResumeOrContinueMessage = () => {
    const synth = synthesisRef.current || (typeof window !== "undefined" ? window.speechSynthesis : null);
    if (!synth) return;

    if (playbackStateRef.current !== "PAUSED" && playbackState !== "PAUSED") {
      console.warn("[TTS RESUME ABORT] Not in PAUSED state. Current state:", playbackStateRef.current);
      return;
    }

    isVoicePausedRef.current = false;

    const textToResume = pausedTextRemainderRef.current || activeTextRef.current || (pausedMessageIndexRef.current !== null && messages[pausedMessageIndexRef.current]?.text ? cleanTextForSpeech(messages[pausedMessageIndexRef.current].text) : "");
    const resumeIndex = pausedMessageIndexForResumeRef.current ?? pausedMessageIndexRef.current;

    if (!textToResume) {
      console.warn("[TTS RESUME] No saved text remainder. Cannot resume.");
      updatePlaybackState("IDLE");
      updateVoiceState("IDLE");
      return;
    }

    console.log("[TTS RESUME] Re-speaking from saved position:", textToResume.substring(0, 40));

    try { synth.cancel(); } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(textToResume);
    const activeVoice = selectedVoiceRef.current || initSpeechVoices();
    if (activeVoice) {
      utterance.voice = activeVoice;
      utterance.lang = activeVoice.lang;
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    activeUtteranceRef.current = utterance;
    activeTextRef.current = textToResume;
    if (resumeIndex !== null) pausedMessageIndexRef.current = resumeIndex;
    boundaryCharIndexRef.current = 0;

    utterance.onboundary = (e: any) => {
      if (activeUtteranceRef.current !== utterance) return;
      if (e.name === "word" || e.name === "sentence" || typeof e.charIndex === "number") {
        boundaryCharIndexRef.current = e.charIndex;
        currentCharIndexRef.current = e.charIndex;
      }
    };

    utterance.onstart = () => {
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = true;
      setPlayingMessageIndex(resumeIndex);
      updatePlaybackState("PLAYING");
      updateVoiceState("SPEAKING");
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
      updatePlaybackState("IDLE");
      updateVoiceState("IDLE");
    };

    utterance.onerror = (e: any) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      isTtsSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      setPlayingMessageIndex(null);
      updatePlaybackState("IDLE");
      updateVoiceState("IDLE");
    };

    if (typeof window !== "undefined") {
      (window as any).__activeTtsUtterance = utterance;
    }

    synth.speak(utterance);
  };

  const handlePlayMessage = (index: number, text: string) => {
    const synth = synthesisRef.current || (typeof window !== "undefined" ? window.speechSynthesis : null);
    if (!synth) return;

    isVoicePausedRef.current = false;

    // Cancel any prior speech before starting a message
    try { synth.cancel(); } catch (e) {}

    const cleanText = cleanTextForSpeech(text);
    activeTextRef.current = cleanText;
    boundaryCharIndexRef.current = 0;
    pausedTextRemainderRef.current = "";
    pausedMessageIndexForResumeRef.current = index;

    console.log("[TTS PLAY EXPLICIT]", { index, textPreview: cleanText.substring(0, 35) });

    if (!cleanText) {
      isTtsSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      pausedMessageIndexRef.current = null;
      setPlayingMessageIndex(null);
      updatePlaybackState("IDLE");
      updateVoiceState("IDLE");
      return;
    }

    if (isSpeakerMutedRef.current) {
      console.log("Speaker is muted. Skipping TTS output.");
      return;
    }

    const activeVoice = selectedVoiceRef.current || initSpeechVoices();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (activeVoice) {
      utterance.voice = activeVoice;
      utterance.lang = activeVoice.lang;
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    activeUtteranceRef.current = utterance;
    activeTextRef.current = cleanText;
    currentCharIndexRef.current = 0;
    pausedMessageIndexRef.current = index;

    utterance.onboundary = (e: any) => {
      if (activeUtteranceRef.current !== utterance) return;
      if (typeof e.charIndex === "number") {
        currentCharIndexRef.current = e.charIndex;
      }
      if (e.name === "word" || e.name === "sentence") {
        boundaryCharIndexRef.current = e.charIndex;
      }
    };

    utterance.onstart = () => {
      console.log("[TTS ONSTART]");
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = true;
      setPlayingMessageIndex(index);
      updatePlaybackState("PLAYING");
      updateVoiceState("SPEAKING");
    };

    utterance.onpause = () => {
      console.log("[TTS ONPAUSE]");
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = false;
      updatePlaybackState("PAUSED");
      updateVoiceState("PAUSED");
    };

    utterance.onresume = () => {
      console.log("[TTS ONRESUME]");
      if (activeUtteranceRef.current !== utterance) return;
      isTtsSpeakingRef.current = true;
      updatePlaybackState("PLAYING");
      updateVoiceState("SPEAKING");
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
      updatePlaybackState("IDLE");
      updateVoiceState("IDLE");
    };

    utterance.onerror = (e: any) => {
      console.log("[TTS ONERROR]", e);
      if (e.error === "interrupted" || e.error === "canceled") return;
      isTtsSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      setPlayingMessageIndex(null);
      updatePlaybackState("IDLE");
      updateVoiceState("IDLE");
    };

    if (typeof window !== "undefined") {
      (window as any).__activeTtsUtterance = utterance;
    }

    synth.speak(utterance);
  };

  const handlePauseMessage = () => {
    const synth = synthesisRef.current || (typeof window !== "undefined" ? window.speechSynthesis : null);
    console.log("[TTS PAUSE]", {
      playbackState: playbackStateRef.current,
      activeUtteranceExists: !!activeUtteranceRef.current,
      boundaryCharIndex: boundaryCharIndexRef.current,
    });

    if (playbackStateRef.current === "PAUSED") return;
    if (!synth) return;

    const fullText = activeTextRef.current;
    const charOffset = boundaryCharIndexRef.current;
    pausedTextRemainderRef.current = (charOffset > 0 && charOffset < fullText.length)
      ? fullText.substring(charOffset).trim()
      : fullText;
    pausedMessageIndexForResumeRef.current = pausedMessageIndexRef.current;

    isVoicePausedRef.current = true;
    isTtsSpeakingRef.current = false;
    pausedCharIndexRef.current = currentCharIndexRef.current || 0;

    if (playingMessageIndex !== null) {
      pausedMessageIndexRef.current = playingMessageIndex;
    } else if (pausedMessageIndexRef.current === null && messages.length > 0) {
      const lastBotIndex = messages.findLastIndex((m) => m.sender === "bot");
      if (lastBotIndex >= 0) {
        pausedMessageIndexRef.current = lastBotIndex;
      }
    }

    try { synth.cancel(); } catch (e) {}

    updatePlaybackState("PAUSED");
    updateVoiceState("PAUSED");
  };

  const handleStopMessage = () => {
    console.log("[TTS STOP]");
    isVoicePausedRef.current = false;
    isTtsSpeakingRef.current = false;

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
    updatePlaybackState("IDLE");
    updateVoiceState("IDLE");
    setIsTyping(false);
    isCommandOnlyModeRef.current = false;
  };

  // Helper function to finalize complete accumulated speech and send it to chat
  const finalizeSpeechAndProcess = () => {
    if (hasFinalizedSpeechRef.current || isProcessingRef.current) {
      return;
    }
    hasFinalizedSpeechRef.current = true;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isVoiceSessionActiveRef.current = false;
    isListeningRef.current = false;
    isStartingRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const fullText = (speechAccumulatorRef.current + " " + latestInterimTranscriptRef.current).replace(/\s+/g, " ").trim();

    setInterimTranscript("");
    latestInterimTranscriptRef.current = "";
    speechAccumulatorRef.current = "";
    lastFinalChunkRef.current = "";

    if (fullText && fullText.length > 1) {
      console.log("🎤 Finalizing complete speech request:", fullText);
      const normalizedMsg = selectAndNormalizeTranscript([fullText]);
      const isVoiceControlCommand = detectAndExecuteVoiceCommand(normalizedMsg);
      if (!isVoiceControlCommand) {
        processMessage(normalizedMsg, "voice");
      }
    } else {
      if (playbackStateRef.current === "IDLE") {
        updateVoiceState("IDLE");
      }
    }
  };

  // Start Speech-to-Text (STT) Recognition
  const startSpeechRecognition = () => {
    if (isListeningRef.current || isStartingRef.current) {
      console.log("[STT START SKIPPED] Already listening or starting.");
      return;
    }
    if (isProcessingRef.current) {
      console.warn("[STT START ABORT] Request is currently processing.");
      return;
    }

    if (!recognitionRef.current) {
      initSpeechRecognition();
    }

    const rec = recognitionRef.current;
    if (!rec) {
      updateVoiceState("ERROR");
      setErrorMessage("Speech recognition not supported on this browser/device.");
      return;
    }

    // Stop TTS if it was playing or paused
    if (playbackStateRef.current !== "IDLE" || isTtsSpeakingRef.current) {
      handleStopMessage();
    }

    isVoiceSessionActiveRef.current = true;
    hasFinalizedSpeechRef.current = false;
    speechAccumulatorRef.current = "";
    latestInterimTranscriptRef.current = "";
    lastFinalChunkRef.current = "";
    setInterimTranscript("");
    setErrorMessage("");

    try {
      isStartingRef.current = true;
      rec.start();
    } catch (e: any) {
      isStartingRef.current = false;
      if (e?.name !== "InvalidStateError") {
        console.error("SpeechRecognition start exception:", e);
      }
    }
  };

  const stopSpeechRecognition = () => {
    isVoiceSessionActiveRef.current = false;
    isListeningRef.current = false;
    isStartingRef.current = false;
    hasFinalizedSpeechRef.current = true;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    clearMobileSafetyTimeout();

    setInterimTranscript("");
    latestInterimTranscriptRef.current = "";
    speechAccumulatorRef.current = "";
    lastFinalChunkRef.current = "";

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (playbackStateRef.current === "IDLE" && voiceStateRef.current !== "THINKING") {
      updateVoiceState("IDLE");
    }
  };

  const handleMicClick = () => {
    console.log("[TTS MIC CLICK]");
    // If bot is currently speaking or paused, clicking mic interrupts TTS and starts listening for user speech
    if (playbackStateRef.current !== "IDLE" || isTtsSpeakingRef.current) {
      handleStopMessage();
      startSpeechRecognition();
      return;
    }

    // If currently recording user's speech, toggle off or finalize
    if (isListeningRef.current) {
      if (speechAccumulatorRef.current || latestInterimTranscriptRef.current) {
        finalizeSpeechAndProcess();
      } else {
        stopSpeechRecognition();
      }
    } else {
      // Turn microphone ON for user query input
      startSpeechRecognition();
    }
  };

  // Main message processing function (shared by Text and Voice)
  const processMessage = async (userMessage: string, source: "text" | "voice" = "text") => {
    if (!userMessage || !userMessage.trim()) return;
    const cleanMsg = userMessage.trim();

    // Prevent concurrent duplicate processing
    if (isProcessingRef.current) {
      console.warn("[processMessage ABORT] Request already in-flight. Dropping concurrent call.");
      return;
    }

    // Deduplication check: drop identical transcript sent within 3000ms
    const now = Date.now();
    if (
      lastProcessedTranscriptRef.current &&
      lastProcessedTranscriptRef.current.text === cleanMsg &&
      now - lastProcessedTranscriptRef.current.time < 3000
    ) {
      console.warn("[processMessage DEDUP] Identical message submitted within 3s. Dropping duplicate:", cleanMsg);
      isProcessingRef.current = false;
      hasFinalizedSpeechRef.current = false;
      if (playbackStateRef.current === "IDLE") updateVoiceState("IDLE");
      return;
    }

    // Immediate voice control intercept (Stop / Pause speaking out loud)
    if (detectAndExecuteVoiceCommand(cleanMsg)) {
      updateVoiceState("IDLE");
      return;
    }

    isProcessingRef.current = true;
    lastProcessedTranscriptRef.current = { text: cleanMsg, time: now };
    const requestId = "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    // Ensure mic recording is disabled while server is processing
    stopSpeechRecognition();
    setIsTyping(true);
    updateVoiceState("THINKING");
    startMobileSafetyTimeout(20);

    try {
      if (!showLeadForm) {
        const lowerMsg = cleanMsg.toLowerCase().trim();
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
            name: cleanMsg,
          }));
          setLeadStep(2);
          const botReply = "Please enter your Email Address.";

          setMessages((prev) => [
            ...prev,
            {
              sender: "user",
              text: cleanMsg,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
            {
              sender: "bot",
              text: botReply,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);

          updateVoiceState("IDLE");
          return;
        }

        // STEP 2 - Email
        if (leadStep === 2) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(cleanMsg)) {
            const errorReply = "That doesn't look like a valid email. Please enter a valid email address.";
            setMessages((prev) => [
              ...prev,
              {
                sender: "user",
                text: cleanMsg,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
              {
                sender: "bot",
                text: errorReply,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
            updateVoiceState("IDLE");
            return;
          }

          setLeadData((prev) => ({
            ...prev,
            email: cleanMsg,
          }));
          setLeadStep(3);
          const botReply = "Please enter your Phone Number.";

          setMessages((prev) => [
            ...prev,
            {
              sender: "user",
              text: cleanMsg,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
            {
              sender: "bot",
              text: botReply,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);

          updateVoiceState("IDLE");
          return;
        }

        // STEP 3 - Phone Number
        if (leadStep === 3) {
          const phoneDigits = cleanMsg.replace(/\D/g, "");
          if (phoneDigits.length < 10) {
            const errorReply = "That doesn't look like a valid phone number. Please enter at least 10 digits.";
            setMessages((prev) => [
              ...prev,
              {
                sender: "user",
                text: cleanMsg,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
              {
                sender: "bot",
                text: errorReply,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
            updateVoiceState("IDLE");
            return;
          }

          setLeadData((prev) => ({
            ...prev,
            phone: cleanMsg,
          }));
          setLeadStep(4);
          const botReply = "Please enter your Interested Domain.\n\nExample: Full Stack Development, Data Science, AI/ML, UI/UX Design, Digital Marketing";

          setMessages((prev) => [
            ...prev,
            {
              sender: "user",
              text: cleanMsg,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
            {
              sender: "bot",
              text: botReply,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);

          updateVoiceState("IDLE");
          return;
        }

        // STEP 4 - Domain & Save to Database
        if (leadStep === 4) {
          updateVoiceState("THINKING");
          try {
            const payload = {
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone,
              preferred_domain: cleanMsg,
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
                text: cleanMsg,
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

            updateVoiceState("IDLE");
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
            updateVoiceState("IDLE");
          }
          return;
        }
      }

      // Normal chat message flow
      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: cleanMsg,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      const voiceMetadata = source === "voice" ? { duration: parseFloat((cleanMsg.length / 5).toFixed(1)), confidence: 0.95 } : null;
      const data = await sendChat(cleanMsg, source, sessionId, voiceMetadata, requestId);

      if (!data.success) {
        throw new Error(data.message || "Failed to get response");
      }

      const botReply = data.reply;

      // Handle escalation triggers if returned from backend
      if (data.escalation) {
        let escalationTicketId = "";
        try {
          const escalateData = await createEscalation(sessionId, `User requested human support. Trigger phrase: "${cleanMsg}"`);
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

        updateVoiceState("IDLE");
        updatePlaybackState("IDLE");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        updateVoiceState("IDLE");
        updatePlaybackState("IDLE");
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

      updateVoiceState("ERROR");
      setErrorMessage("Network issue. Reverted to text chat fallback.");
      setTimeout(() => {
        if (voiceStateRef.current === "ERROR") updateVoiceState("IDLE");
      }, 3000);
    } finally {
      setIsTyping(false);
      isProcessingRef.current = false;
      hasFinalizedSpeechRef.current = false;
      clearMobileSafetyTimeout();
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
    updateVoiceState("THINKING");

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

      updateVoiceState("IDLE");
      updatePlaybackState("IDLE");
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
      updateVoiceState("IDLE");
    } finally {
      setIsTyping(false);
      isProcessingRef.current = false;
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = message.trim();
    setMessage("");
    await processMessage(userMessage, "text");
  };

/* =========================================================
   AI BOY AVATAR
========================================================= */

function AIBoyAvatar({
  size = "small",
}: {
  size?: "small" | "header" | "launcher";
}) {
  const sizes = {
    small: "h-9 w-9",
    header: "h-12 w-12",
    launcher: "h-[68px] w-[68px]",
  };

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${sizes[size]}`}
    >
      <div className="absolute inset-0 rounded-full bg-sky-200/50" />
      <img
        src="/weintern_avatar.png"
        alt="WeIntern AI Assistant"
        draggable={false}
        className={
          size === "small"
            ? "absolute left-[-42%] top-[-3%] h-[132%] w-[184%] max-w-none object-contain"
            : size === "header"
              ? "absolute left-[-40%] top-[-3%] h-[132%] w-[180%] max-w-none object-contain"
              : "absolute left-[-39%] top-[-3%] h-[132%] w-[180%] max-w-none object-contain"
        }
      />
    </div>
  );
}

/* =========================================================
   STUDENT AVATAR
========================================================= */

function StudentAvatar() {
  return (
    <div className="student-pop flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-sm">
      <span className="text-[21px]" aria-hidden="true">
        👩🏻‍🎓
      </span>
    </div>
  );
}

  return (
    <>
      <style jsx global>{`
        @keyframes boyFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }
        @keyframes boyFloatBig {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-1deg); }
        }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulseOnline {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.75; }
        }
        @keyframes studentPop {
          from { transform: scale(0.75); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .boy-launcher { animation: boyFloat 3s ease-in-out infinite; }
        .boy-outside { animation: boyFloatBig 3.2s ease-in-out infinite; }
        .ask-bubble { animation: bubbleFloat 3s ease-in-out infinite; }
        .online-dot { animation: pulseOnline 2s ease-in-out infinite; }
        .student-pop { animation: studentPop 0.25s ease-out; }
        .sparkle { animation: sparkle 2s ease-in-out infinite; }
        .chat-scroll::-webkit-scrollbar { width: 5px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
      `}</style>

      {/* CLOSED LAUNCHER STATE */}
      {!open && (
        <>
          {/* ASK ME ANYTHING BUBBLE */}
          <div className="ask-bubble fixed bottom-[105px] right-5 z-[9998]">
            <div className="relative rounded-2xl border border-blue-100 bg-white px-4 py-2.5 shadow-[0_12px_35px_rgba(15,23,42,0.15)]">
              <div className="text-[12px] font-bold text-slate-700">
                💡 Ask me anything!
              </div>
              <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-r border-b border-blue-100 bg-white" />
            </div>
          </div>

          {/* LAUNCHER BUTTON */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open WeIntern AI Assistant"
            className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-[9999] cursor-pointer touch-manipulation"
          >
            <div className="boy-launcher relative flex h-16 w-16 sm:h-[76px] sm:w-[76px] items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-sky-400 via-blue-500 to-blue-800 shadow-[0_12px_40px_rgba(14,116,244,0.4)]">
              <AIBoyAvatar size="launcher" />
              <span className="online-dot absolute bottom-0 right-0 h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 sm:border-[3px] border-white bg-green-500" />
            </div>
          </button>
        </>
      )}

      {/* OPEN CHAT STATE */}
      {open && (
        <>
          {/* FULL BODY BOY MASCOT OUTSIDE CHAT */}
          <div className="boy-outside pointer-events-none fixed bottom-5 right-[430px] z-[9997] hidden lg:block">
            <div className="relative h-[440px] w-[270px]">
              <div className="absolute bottom-0 left-1/2 h-24 w-36 -translate-x-1/2 rounded-full bg-sky-300/30 blur-2xl" />
              <img
                src="/weintern_mascot.png"
                alt="WeIntern AI Assistant"
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain filter drop-shadow-[0_25px_30px_rgba(15,23,42,0.25)]"
              />
              <span className="sparkle absolute right-2 top-8 text-2xl">✨</span>
              <span className="sparkle absolute left-0 top-28 text-xl" style={{ animationDelay: "0.5s" }}>✨</span>
            </div>
          </div>

          {/* CHAT WINDOW CONTAINER */}
          <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-[9999] flex h-[100dvh] sm:h-[min(720px,calc(100vh-40px))] w-full sm:w-[410px] max-w-full sm:max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-none sm:rounded-[28px] border-0 sm:border border-slate-200 bg-white shadow-2xl sm:shadow-[0_25px_90px_rgba(15,23,42,0.30)]">

            {/* HEADER */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0784dc] via-[#087fce] to-[#0759a5] px-3.5 sm:px-5 py-3.5 sm:py-4 text-white">
              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 bottom-[-80px] h-44 w-44 rounded-full bg-cyan-200/10 blur-3xl pointer-events-none" />

              <div className="relative flex items-center justify-between gap-2">
                {/* LEFT */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-lg">
                    <img
                      src="/weintern_avatar.png"
                      alt="WeIntern AI Assistant"
                      draggable={false}
                      className="absolute left-[-40%] top-[-3%] h-[132%] w-[180%] max-w-none object-contain"
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-[16px] font-bold tracking-tight text-white truncate">
                      WeIntern AI Assistant ✨
                    </h2>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-white/85 truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-300 shrink-0" />
                      <span className="truncate">Here to help 24/7 {voiceMode && "• Voice Mode"}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT HEADER CONTROLS */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {/* Clear History */}
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    title="Clear chat history"
                    aria-label="Clear chat history"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 cursor-pointer min-h-[32px] min-w-[32px]"
                  >
                    <BsTrash size={14} />
                  </button>

                  {/* Speaker Output Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeakerMuted) {
                        handleUnmute();
                      } else {
                        handleMute();
                      }
                    }}
                    title={isSpeakerMuted ? "Unmute bot output" : "Mute bot output"}
                    aria-label={isSpeakerMuted ? "Unmute bot output" : "Mute bot output"}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 cursor-pointer min-h-[32px] min-w-[32px]"
                  >
                    {isSpeakerMuted ? <BsVolumeMuteFill size={15} /> : <BsVolumeUpFill size={15} />}
                  </button>

                  {/* Voice Mode Toggle */}
                  <button
                    type="button"
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
                    aria-label={voiceMode ? "Disable Voice Mode" : "Enable Voice Mode"}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer min-h-[32px] min-w-[32px] ${
                      voiceMode ? "bg-amber-400 text-gray-900 font-bold shadow-md" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {voiceMode ? <BsMicFill size={15} /> : <BsMicMuteFill size={15} />}
                  </button>

                  {/* CLOSE */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close chat window"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 cursor-pointer ml-0.5 min-h-[32px] min-w-[32px]"
                  >
                    <BsX size={22} />
                  </button>
                </div>
              </div>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg z-50 font-medium">
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
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium flex-1 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium flex-1 shadow transition cursor-pointer"
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

            {/* CHAT BODY */}
            <div className="chat-scroll flex-1 overflow-y-auto bg-[#f7faff] px-4 py-4 space-y-3">

              {/* WELCOME CARD & QUICK ACTION GRID */}
              {messages.length <= 2 && (
                <div className="mb-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AIBoyAvatar size="small" />
                    <div className="max-w-[82%] rounded-2xl rounded-tl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[13px] font-semibold leading-5 text-slate-700">
                        Hi there! 👋
                      </p>
                      <p className="mt-1 text-[12px] leading-5 text-slate-500">
                        I'm your WeIntern AI Assistant. Ask me anything about internships, courses, certificates, fees or placement.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pl-11">
                    <button
                      type="button"
                      onClick={() => quickReply("domains")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md cursor-pointer"
                    >
                      <div className="text-base">📚</div>
                      <div className="mt-1 text-[11px] font-bold text-slate-700">Internship</div>
                      <div className="text-[10px] text-slate-400">Programs</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickReply("fees")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md cursor-pointer"
                    >
                      <div className="text-base">💰</div>
                      <div className="mt-1 text-[11px] font-bold text-slate-700">Fees & Payment</div>
                      <div className="text-[10px] text-slate-400">Pricing info</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickReply("certificates")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md cursor-pointer"
                    >
                      <div className="text-base">📜</div>
                      <div className="mt-1 text-[11px] font-bold text-slate-700">Certificates</div>
                      <div className="text-[10px] text-slate-400">Learn more</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickReply("contact")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md cursor-pointer"
                    >
                      <div className="text-base">🎯</div>
                      <div className="mt-1 text-[11px] font-bold text-slate-700">Placement</div>
                      <div className="text-[10px] text-slate-400">Support</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickReply("apply")}
                      className="col-span-2 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-lg shadow-sm text-white">
                          🚀
                        </div>
                        <div>
                          <div className="text-[12px] font-bold text-blue-700">Apply / Register</div>
                          <div className="text-[10px] text-slate-400">Start your WeIntern journey</div>
                        </div>
                        <div className="ml-auto text-blue-600 font-bold text-sm">→</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* MESSAGES LIST */}
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-end gap-2 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender === "bot" && <AIBoyAvatar size="small" />}
                    {msg.sender === "user" && (
                      <div className="order-2">
                        <StudentAvatar />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[78%] px-3.5 py-2.5 shadow-sm break-words-anywhere ${
                        msg.sender === "user"
                          ? "order-1 rounded-2xl rounded-br-md bg-gradient-to-r from-[#168de2] to-[#087fce] text-white"
                          : "rounded-2xl rounded-bl-md border border-slate-100 bg-white text-slate-700"
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
                          <div className={`whitespace-pre-line text-[13px] leading-5 ${msg.sender === "user" ? "text-white" : "text-slate-700"}`}>
                            {msg.text}
                          </div>
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
                        className={`flex items-center justify-between gap-2 mt-2 pt-1.5 border-t text-[10px] ${
                          msg.sender === "user" ? "border-white/20 text-blue-100" : "border-slate-100 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyMessage(index, msg.text)}
                            title="Copy text"
                            className="hover:opacity-80 transition duration-150 flex items-center gap-0.5 cursor-pointer"
                          >
                            {copiedIndex === index ? (
                              <>
                                <BsCheck2 className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                                <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <BsCopy className="w-3 h-3" />
                            )}
                          </button>

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
                  <div className="flex justify-end items-end gap-2">
                    <StudentAvatar />
                    <div className="bg-gray-200 text-gray-700 p-3 rounded-2xl rounded-br-md shadow-sm max-w-[76%] italic text-[13px]">
                      🎤 {interimTranscript}...
                    </div>
                  </div>
                )}

                {/* TYPING INDICATOR */}
                {isTyping && (
                  <div className="flex items-end gap-2">
                    <AIBoyAvatar size="small" />
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Voice State Information Panel */}
            {(voiceMode || playbackState !== "IDLE") && (
              <div className="bg-white border-t border-slate-200 px-4 py-2 flex flex-col gap-1.5">
                {voiceState === "LISTENING" && (
                  <div className="flex justify-between items-center text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                    <span className="flex items-center gap-1.5 font-medium animate-pulse">
                      <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                      Listening... speak now
                    </span>
                    <button
                      onClick={stopSpeechRecognition}
                      className="text-[10px] text-gray-500 hover:text-gray-700 font-semibold underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

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
                        className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition cursor-pointer"
                      >
                        Pause
                      </button>
                      <button
                        onClick={handleStopMessage}
                        className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 font-semibold transition cursor-pointer"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                )}

                {voiceState === "PAUSED" && (
                  <div className="flex justify-between items-center text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <span className="font-medium flex items-center gap-1">
                      ⏸️ Speech Paused
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResumeOrContinueMessage}
                        className="px-2 py-1 text-[10px] bg-amber-600 text-white rounded hover:bg-amber-700 font-semibold transition cursor-pointer"
                      >
                        Continue
                      </button>
                      <button
                        onClick={handleStopMessage}
                        className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 font-semibold transition cursor-pointer"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                )}

                {voiceState === "THINKING" && (
                  <div className="flex items-center text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <span className="font-medium animate-pulse">Thinking...</span>
                  </div>
                )}

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

            {/* QUICK BUTTONS */}
            <div className="border-t border-slate-200 bg-white px-3 py-2.5">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => quickReply("apply")}
                  className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white cursor-pointer"
                >
                  🚀 Apply
                </button>

                <button
                  type="button"
                  onClick={() => quickReply("fees")}
                  className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 transition hover:bg-blue-600 hover:text-white cursor-pointer"
                >
                  💰 Fees
                </button>

                <button
                  type="button"
                  onClick={() => quickReply("domains")}
                  className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 transition hover:bg-blue-600 hover:text-white cursor-pointer"
                >
                  💻 Domains
                </button>

                <button
                  type="button"
                  onClick={() => quickReply("certificates")}
                  className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 transition hover:bg-amber-500 hover:text-white cursor-pointer"
                >
                  📜 Certificates
                </button>

                <button
                  type="button"
                  onClick={() => quickReply("contact")}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-600 hover:text-white cursor-pointer"
                >
                  🎯 Contact
                </button>
              </div>
            </div>

            {/* INPUT PANEL */}
            <div className="border-t border-slate-200 bg-white px-3 py-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-sm">
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
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-gray-100 disabled:text-gray-500"
                />

                {/* Voice Input Mic Button */}
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    title={voiceState === "LISTENING" ? "Stop recording" : "Tap to speak"}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition cursor-pointer ${
                      voiceState === "LISTENING"
                        ? "text-red-500 bg-red-50 voice-listening-btn"
                        : voiceState === "SPEAKING"
                          ? "text-orange-500 bg-orange-50 animate-pulse"
                          : voiceMode
                            ? "text-blue-600 bg-blue-100/80 font-bold"
                            : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {voiceState === "LISTENING" ? <BsMicMuteFill size={18} /> : <BsMicFill size={18} />}
                  </button>
                )}

                {/* Send Button */}
                <button
                  type="button"
                  disabled={voiceState === "LISTENING" || !message.trim()}
                  onClick={sendMessage}
                  aria-label="Send message"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition cursor-pointer ${
                    voiceState === "LISTENING" || !message.trim()
                      ? "cursor-not-allowed bg-slate-300"
                      : "bg-gradient-to-br from-sky-400 to-blue-700 hover:scale-105 hover:shadow-md"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[18px] w-[18px]"
                    fill="currentColor"
                  >
                    <path d="M3.4 20.4 21.3 12 3.4 3.6l-.1 6.5 12.8 1.9-12.8 1.9.1 6.5.1 6.5Z" />
                  </svg>
                </button>
              </div>

              {/* FOOTER */}
              <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-slate-400">
                <span className="font-black text-blue-600">W</span>
                <span>Powered by WeIntern AI</span>
              </div>
            </div>

          </div>
        </>
      )}
    </>
  );
}
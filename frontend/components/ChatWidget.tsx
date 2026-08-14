"use client";

import { useState, useRef, useEffect } from "react";
import { BsChatDotsFill, BsX, BsMicFill, BsMicMuteFill, BsVolumeUpFill, BsVolumeMuteFill, BsPlayFill, BsPauseFill, BsStopFill, BsCopy, BsPencilSquare, BsArrowClockwise, BsTrash, BsCheck2 } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { sendChat, saveLead, getHistory, clearHistory } from "@/services/chatApi";

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
    // Multi-word variants with spacing/hyphen
    /\b(v\s*intern|v-intern)\b/gi,
    /\b(w\s+intern|w-intern)\b/gi,
    /\b(wee\s+intern|wee\s+intrn|wee\s+internship)\b/gi,
    /\b(we\s+intern|we-intern|we\s+interne|we\s+internship)\b/gi,
    /\b(we\s+inter\b)/gi,
    /\b(we\s+in\s+turn|we\s+inturn)\b/gi,
    // Single-word phonetic / speech-to-text mistakes
    /\b(weintrn|weinturn|wintern|wenitern|weinturm|weentern|weintearn)\b/gi,
    /\b(wigton|vinturn|winturn|weintern)\b/gi,           // also ensures casing
    /\b(way\s+intern|vee\s+intern|be\s+intern|beintern)\b/gi,
    /\b(we\s+entered|we\s+entered\s+in)\b/gi,
    /\b(we\s+intent|we\s+interns)\b/gi,
    /\b(vee\s+internship|v\s+internship|weinternship)\b/gi,
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
  const [voiceState, setVoiceState] = useState<"IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING" | "ERROR">("IDLE");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [playbackState, setPlaybackState] = useState<"IDLE" | "PLAYING" | "PAUSED">("IDLE");
  const [detectedLang, setDetectedLang] = useState<string>("en-IN"); // tracks last detected speech language

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  // Dedicated interrupt-only recognition that runs concurrently with TTS
  const interruptRecRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);
  const currentPausedTextRef = useRef<string>("");
  const currentSpeakCharIndexRef = useRef<number>(0);
  // Tracks whether TTS was stopped by a voice command (vs finished naturally)
  const isCancelledByCommandRef = useRef<boolean>(false);
  // Tracks the message index that is currently saved for resume
  const pausedMessageIndexRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCopyMessage = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEditMessage = (text: string) => {
    setMessage(text);
    inputRef.current?.focus();
  };

  const handleRefreshHistory = async () => {
    if (!sessionId) return;
    setIsTyping(true);
    try {
      const res = await getHistory(sessionId);
      if (res.success && res.data) {
        if (res.data.length === 0) {
          setMessages([
            {
              sender: "bot",
              text: "👋 Hello! Welcome to WeIntern.",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } else {
          setMessages(
            res.data.map((msg: any) => ({
              sender: msg.sender === "bot" ? "bot" : "user",
              text: msg.message,
              time: new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))
          );
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
    if (!sessionId) return;
    try {
      await clearHistory(sessionId);
      setMessages([
        {
          sender: "bot",
          text: "👋 Hello! Welcome to WeIntern.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setToastMessage("Chat history cleared");
      setTimeout(() => setToastMessage(null), 2000);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
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

  // Generate or load session ID & Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("weintern_session_id");
      if (!id) {
        id = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("weintern_session_id", id);
      }
      setSessionId(id);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
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
    }
  }, []);

  // Fetch chat history from PostgreSQL / In-Memory fallback on startup
  useEffect(() => {
    if (!sessionId) return;
    const fetchHistory = async () => {
      try {
        const res = await getHistory(sessionId);
        if (res.success && res.data && res.data.length > 0) {
          setMessages(
            res.data.map((msg: any) => ({
              sender: msg.sender === "bot" ? "bot" : "user",
              text: msg.message,
              time: new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))
          );
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

    if (voiceMode && !isSpeakerMuted) {
      speakResponse(text);
    }
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

  // ── Voice playback action handlers ──────────────────────────────────────
  const handleStopAtPosition = () => {
    if (!synthesisRef.current) return;
    isCancelledByCommandRef.current = true; // guard onend from wiping saved position
    synthesisRef.current.cancel();
    setPlaybackState("PAUSED");
    setVoiceState("IDLE");
    stopInterruptListener();
  };

  const handlePauseMessage = () => {
    handleStopAtPosition();
  };

  const handleResumeOrContinueMessage = () => {
    if (!synthesisRef.current) return;

    // If we have a saved position from a commanded stop/pause, resume from exact position
    if (currentPausedTextRef.current && currentSpeakCharIndexRef.current >= 0) {
      const fullText = currentPausedTextRef.current;
      const offset = currentSpeakCharIndexRef.current;
      const msgIdx = pausedMessageIndexRef.current ?? playingMessageIndex ?? -1;
      handlePlayMessage(msgIdx, fullText, offset);
      return;
    }

    // Fall back: browser resume
    if (synthesisRef.current.paused) {
      synthesisRef.current.resume();
      setPlaybackState("PLAYING");
      setVoiceState("SPEAKING");
      return;
    }

    // Fall back: replay last bot message from start
    const lastBot = getLastBotResponse();
    if (lastBot) {
      handlePlayMessage(lastBot.index, lastBot.text, 0);
    }
  };

  const handleRepeatMessage = () => {
    if (!synthesisRef.current) return;
    const lastBot = getLastBotResponse();
    if (lastBot) {
      handlePlayMessage(lastBot.index, lastBot.text, 0);
    }
  };

  const handleStartMessage = () => {
    if (!synthesisRef.current) return;
    const lastBot = getLastBotResponse();
    if (lastBot) {
      handlePlayMessage(lastBot.index, lastBot.text, 0);
    }
  };

  const handleMuteMessage = () => {
    setIsSpeakerMuted(true);
    handleStopMessage();
  };

  const handleUnmuteMessage = () => {
    setIsSpeakerMuted(false);
  };

  const handleStopMessage = () => {
    if (synthesisRef.current) {
      isCancelledByCommandRef.current = false;
      synthesisRef.current.cancel();
      setPlayingMessageIndex(null);
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      currentPausedTextRef.current = "";
      currentSpeakCharIndexRef.current = 0;
      pausedMessageIndexRef.current = null;
      stopInterruptListener();
    }
  };

  // ── Unified command executor ────────────────────────────────────────────
  const detectAndExecuteVoiceCommand = (text: string): boolean => {
    const cmd = detectVoiceCommandType(text);
    if (!cmd) return false;

    switch (cmd) {
      case "STOP":
        handleStopAtPosition();
        return true;
      case "PAUSE":
        handlePauseMessage();
        return true;
      case "RESUME":
        handleResumeOrContinueMessage();
        return true;
      case "REPEAT":
        handleRepeatMessage();
        return true;
      case "START":
        handleStartMessage();
        return true;
      case "MUTE":
        handleMuteMessage();
        return true;
      case "UNMUTE":
        handleUnmuteMessage();
        return true;
      default:
        return false;
    }
  };

  // Speaks response using Web Speech Synthesis (TTS)
  const speakResponse = (text: string) => {
    handlePlayMessage(-1, text, 0);
  };

  const handlePlayMessage = (index: number, text: string, charOffset: number = 0) => {
    if (!synthesisRef.current) return;

    const isCurrentPlaying = playingMessageIndex === index || (playingMessageIndex === -1 && index === messages.length - 1);

    if (isCurrentPlaying && playbackState === "PAUSED" && synthesisRef.current.paused) {
      synthesisRef.current.resume();
      setPlaybackState("PLAYING");
      setVoiceState("SPEAKING");
      return;
    }

    synthesisRef.current.cancel();

    const cleanText = text
      .replace(/👋|🤖|📝|🎉|✨|🟢|🚀|#\d+/g, "")
      .replace(/\*\*|__/g, "")
      .replace(/\*|_/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .trim();

    if (!cleanText) {
      setVoiceState("IDLE");
      return;
    }

    const textToSpeak = charOffset > 0 ? cleanText.slice(charOffset) : cleanText;
    if (!textToSpeak.trim()) {
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      return;
    }

    const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const marathiWords = /(?:^|\s)(आहे|आहेत|आहेस|आहोत|मी|तुम्हाला|मला|आपल्या|करू|सांगू|शकेन|शकतो|शकते|काही|बद्दल|आणि|बरं|कशी|कसे|कसा|पण|तर|काय)(?:\s|$|[.,?!;])/i;
    const hasMahratti = /[\u0900-\u097F]/.test(cleanText) && (marathiWords.test(cleanText) || /[\u0967-\u096F]/.test(cleanText));
    const hindiWords = /\b(kya|hai|hain|mein|ko|se|karne|karta|karte|milta|milega|milegi|hoga|hogi|kiya|gaya|rha|raha|rahe|he|tha|thi|the|hu|hoon|aur|ya|par)\b/i;
    const isHinglish = hindiWords.test(cleanText);
    const speakLang = hasMahratti ? "mr-IN" : (hasDevanagari || isHinglish || detectedLang === "hi-IN" ? "hi-IN" : "en-IN");

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speakLang;

    const allVoices = synthesisRef.current.getVoices();
    const preferredVoice = (() => {
      const patterns = [
        (v: SpeechSynthesisVoice) => v.lang === speakLang && /google/i.test(v.name) && /female|woman/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang === speakLang && /google/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang === speakLang && /neerja|heera|ravi|kalpana|hemant/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang === speakLang,
        (v: SpeechSynthesisVoice) => v.lang === "en-IN" && /google/i.test(v.name),
        (v: SpeechSynthesisVoice) => v.lang === "en-IN",
      ];
      for (const pattern of patterns) {
        const match = allVoices.find(pattern);
        if (match) return match;
      }
      return null;
    })();

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = speakLang === "en-IN" ? 1.0 : 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    utterance.onboundary = (event: any) => {
      if (event.charIndex !== undefined) {
        currentSpeakCharIndexRef.current = charOffset + event.charIndex;
      }
    };

    utterance.onstart = () => {
      setPlayingMessageIndex(index);
      setPlaybackState("PLAYING");
      setVoiceState("SPEAKING");
      currentPausedTextRef.current = cleanText;
      pausedMessageIndexRef.current = index;
      isCancelledByCommandRef.current = false;
      if (charOffset === 0) {
        currentSpeakCharIndexRef.current = 0;
      }
      // Start the concurrent interrupt listener when TTS begins
      startInterruptListener();
    };

    utterance.onend = () => {
      stopInterruptListener();
      setPlayingMessageIndex(null);
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
      // Only clear saved position if speech ended naturally
      if (!isCancelledByCommandRef.current) {
        currentPausedTextRef.current = "";
        currentSpeakCharIndexRef.current = 0;
        pausedMessageIndexRef.current = null;
      }
      isCancelledByCommandRef.current = false;
    };

    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setPlayingMessageIndex(null);
      setPlaybackState("IDLE");
      setVoiceState("IDLE");
    };

    synthesisRef.current.speak(utterance);
  };

  // ── Concurrent interrupt listener: starts when TTS plays, listens for voice commands ──
  const startInterruptListener = () => {
    const intRec = interruptRecRef.current;
    if (!intRec) return;
    try { intRec.stop(); } catch (_) {}

    intRec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = (event.results[i][0]?.transcript || "").trim();
        // Execute voice command directly on interim/final results
        const isExecuted = detectAndExecuteVoiceCommand(transcript);
        if (isExecuted) {
          try { intRec.stop(); } catch (_) {}
          return;
        }
      }
    };

    intRec.onerror = () => {
      try {
        intRec.stop();
        setTimeout(() => {
          if (synthesisRef.current?.speaking) startInterruptListener();
        }, 300);
      } catch (_) {}
    };

    intRec.onend = () => {
      if (synthesisRef.current?.speaking) {
        setTimeout(() => startInterruptListener(), 100);
      }
    };

    try {
      intRec.start();
    } catch (_) {}
  };

  const stopInterruptListener = () => {
    try { interruptRecRef.current?.stop(); } catch (_) {}
  };

  // Start Speech-to-Text (STT) Recognition (main mic — does NOT cancel TTS)
  const startSpeechRecognition = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      setVoiceState("ERROR");
      setErrorMessage("Speech recognition not supported in this browser.");
      return;
    }

    // Do NOT cancel TTS here — the interrupt listener handles concurrent stop commands
    // If TTS is NOT playing (IDLE), cancel any residual synthesis
    if (synthesisRef.current && !synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }

    setVoiceState("LISTENING");
    setInterimTranscript("");
    setErrorMessage("");

    rec.onstart = () => {
      setVoiceState("LISTENING");
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      let alternatives: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          for (let j = 0; j < event.results[i].length; j++) {
            if (event.results[i][j]?.transcript) {
              alternatives.push(event.results[i][j].transcript);
            }
          }
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
          // ── Intercept stop/continue commands from INTERIM results ───────
          // ── Intercept voice commands from INTERIM results for instant responsiveness ───────
          const isExecuted = detectAndExecuteVoiceCommand(interim);
          if (isExecuted) {
            try { rec.stop(); } catch (_) {}
            setInterimTranscript("");
            setVoiceState("IDLE");
            return;
          }
        }
      }
      if (interim) {
        setInterimTranscript(interim);
      }
      if (final) {
        setInterimTranscript("");
        rec.stop();

        // ── Language detection heuristic from raw final text ─────────────────
        const devanagariRatio = (final.match(/[\u0900-\u097F]/g) || []).length / Math.max(final.length, 1);
        const marathiWords = /(?:^|\s)(आहे|आहेत|आहेस|आहोत|मी|तुम्हाला|मला|आपल्या|करू|सांगू|शकेन|शकतो|शकते|काही|बद्दल|आणि|बरं|कशी|कसे|कसा|पण|तर|काय)(?:\s|$|[.,?!;])/i;
        const marathiMarkers = marathiWords.test(final) || /[\u0963\u094D\u0902\u0919\u091C\u091E\u0967-\u096F]/.test(final);
        let lang = "en-IN";
        if (devanagariRatio > 0.3) {
          lang = marathiMarkers ? "mr-IN" : "hi-IN";
        }
        setDetectedLang(lang);
        recognitionRef.current.lang = lang === "mr-IN" ? "mr-IN" : lang === "hi-IN" ? "hi-IN" : "en-IN";
        // ────────────────────────────────────────────────────────────────────

        // Select the best alternative (in case of homophone spelling errors) and normalize
        const normalizedMsg = selectAndNormalizeTranscript(alternatives.length > 0 ? alternatives : [final]);

        // Voice-command controls intercept
        const isVoiceControlCommand = detectAndExecuteVoiceCommand(normalizedMsg);
        if (isVoiceControlCommand) {
          setVoiceState("IDLE");
          return;
        }

        processMessage(normalizedMsg, "voice");
      }
    };

    rec.onerror = (event: any) => {
      console.error("STT Error:", event.error);
      setVoiceState("ERROR");
      if (event.error === "no-speech") {
        setErrorMessage("No speech detected. Please speak clearly.");
      } else if (event.error === "not-allowed") {
        setErrorMessage("Mic permission denied. Please allow mic access.");
      } else {
        setErrorMessage(`Microphone error: ${event.error}`);
      }
      setTimeout(() => {
        setVoiceState("IDLE");
      }, 4000);
    };

    rec.onend = () => {
      setVoiceState((prev) => (prev === "LISTENING" ? "IDLE" : prev));
    };

    try {
      rec.start();
    } catch (e) {
      console.error("SpeechRecognition start exception:", e);
      setVoiceState("ERROR");
      setErrorMessage("Microphone is already listening.");
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState("IDLE");
  };

  const handleMicClick = () => {
    if (voiceState === "LISTENING") {
      stopSpeechRecognition();
    } else if (voiceState === "SPEAKING") {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      setVoiceState("IDLE");
    } else {
      startSpeechRecognition();
    }
  };

  // Main message processing function (shared by Text and Voice)
  const processMessage = async (userMessage: string, source: "text" | "voice" = "text") => {
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

        if (source === "voice" && !isSpeakerMuted) {
          speakResponse(botReply);
        }
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
          if (source === "voice" && !isSpeakerMuted) {
            speakResponse(errorReply);
          }
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

        if (source === "voice" && !isSpeakerMuted) {
          speakResponse(botReply);
        }
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
          if (source === "voice" && !isSpeakerMuted) {
            speakResponse(errorReply);
          }
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

        if (source === "voice" && !isSpeakerMuted) {
          speakResponse(botReply);
        }
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

          if (source === "voice" && !isSpeakerMuted) {
            speakResponse(botReply);
          } else {
            setVoiceState("IDLE");
          }
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
          if (source === "voice" && !isSpeakerMuted) {
            speakResponse(errorReply);
          } else {
            setVoiceState("IDLE");
          }
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
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        const escalateRes = await fetch(`${apiBase}/api/escalate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, issue: `User requested human support. Trigger phrase: "${userMessage}"` })
        });
        const escalateData = await escalateRes.json();

        let escalationMessage = botReply;
        if (escalateData.success) {
          escalationMessage += `\n\n[Escalation Support Ticket Created: #${escalateData.data.id || escalateData.data.session_id}]`;
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: escalationMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        if (source === "voice" && !isSpeakerMuted) {
          speakResponse(botReply); // speak original text, exclude system ticket tags
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

        if (source === "voice" && !isSpeakerMuted) {
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

      if (source === "voice" && !isSpeakerMuted) {
        speakResponse("I had trouble connecting to the server. Please try again.");
      } else {
        setVoiceState("ERROR");
        setErrorMessage("Network issue. Reverted to text chat fallback.");
        setTimeout(() => setVoiceState("IDLE"), 4000);
      }
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
              {/* Refresh History */}
              <button
                onClick={handleRefreshHistory}
                title="Refresh chat history"
                className="hover:text-blue-200 transition-colors p-1"
              >
                <BsArrowClockwise size={18} />
              </button>

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
                  const val = !isSpeakerMuted;
                  setIsSpeakerMuted(val);
                  if (val && synthesisRef.current) {
                    synthesisRef.current.cancel();
                    if (voiceState === "SPEAKING") {
                      setVoiceState("IDLE");
                    }
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
                  if (!mode) {
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
                  <div className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</div>

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
                          onClick={() => handleEditMessage(msg.text)}
                          title="Edit message"
                          className="hover:opacity-80 transition duration-150 flex items-center gap-0.5 cursor-pointer ml-1"
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
                          {((playingMessageIndex === index) || (playingMessageIndex === -1 && index === messages.length - 1)) ? (
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
                                  onClick={() => handlePlayMessage(index, msg.text)}
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

          {/* Voice State Information Panel */}
          {voiceMode && (
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
                    <span className="font-medium">Bot is speaking</span>
                    <div className="voice-wave-container">
                      <div className="voice-wave-bar"></div>
                      <div className="voice-wave-bar"></div>
                      <div className="voice-wave-bar"></div>
                      <div className="voice-wave-bar"></div>
                      <div className="voice-wave-bar"></div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (synthesisRef.current) synthesisRef.current.cancel();
                      setVoiceState("IDLE");
                    }}
                    className="text-[10px] text-red-500 hover:text-red-700 font-semibold underline"
                  >
                    Stop
                  </button>
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

            {/* Voice Input Mic Button */}
            {voiceMode && recognitionRef.current && (
              <button
                onClick={handleMicClick}
                title={voiceState === "LISTENING" ? "Stop recording" : "Record voice message"}
                className={`p-3 rounded-lg text-white transition duration-200 touch-manipulation ${voiceState === "LISTENING"
                    ? "bg-red-500 hover:bg-red-600 voice-listening-btn"
                    : voiceState === "SPEAKING"
                      ? "bg-orange-500 hover:bg-orange-600 animate-pulse"
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
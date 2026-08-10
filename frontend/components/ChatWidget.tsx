"use client";

import { useState, useRef, useEffect } from "react";
import { BsChatDotsFill, BsX } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { sendChat, saveLead, saveHistory, createEscalation } from "@/services/chatApi";

type ChatMessage = {
  sender: "user" | "bot";
  text: string;
  time: string;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadStep, setLeadStep] = useState(0);

  const [sessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("weintern_session_id");
      if (saved) return saved;
      const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem("weintern_session_id", newId);
      return newId;
    }
    return `sess_${Date.now()}`;
  });

  const [leadData, setLeadData] = useState({
    name: "",
    email: "",
    phone: "",
    domain: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "👋 Hello! Welcome to WeIntern.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      sender: "bot",
      text: "Ask me anything about internships, domains, certificates or registration.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const startLeadForm = () => {
    setShowLeadForm(true);
    setLeadStep(1);
    const promptText = "📝 Great! Let's get you registered for the WeIntern Internship.\n\nPlease enter your Full Name:";
    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: promptText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    saveHistory(sessionId, "bot", promptText).catch(console.error);
  };

  const quickReply = (question: string) => {
    if (question.includes("Apply") || question.includes("Register")) {
      startLeadForm();
      return;
    }
    setMessage(question);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");

    // Asynchronously log user message to PostgreSQL messages table
    saveHistory(sessionId, "user", userMessage).catch(console.error);

    // Lead Form Logic
    if (showLeadForm) {

      // STEP 1 - Name
      if (leadStep === 1) {
        setLeadData((prev) => ({ ...prev, name: userMessage }));
        setLeadStep(2);

        const botPrompt = "Please enter your Email Address.";
        setMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: userMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          {
            sender: "bot",
            text: botPrompt,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        saveHistory(sessionId, "bot", botPrompt).catch(console.error);
        return;
      }

      // STEP 2 - Email
      if (leadStep === 2) {
        setLeadData((prev) => ({ ...prev, email: userMessage }));
        setLeadStep(3);

        const botPrompt = "Please enter your Phone Number.";
        setMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: userMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          {
            sender: "bot",
            text: botPrompt,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        saveHistory(sessionId, "bot", botPrompt).catch(console.error);
        return;
      }

      // STEP 3 - Phone Number
      if (leadStep === 3) {
        setLeadData((prev) => ({ ...prev, phone: userMessage }));
        setLeadStep(4);

        const botPrompt = "Please enter your Interested Domain.\n\nExample: Full Stack Development, Data Science, AI/ML, UI/UX Design, Digital Marketing";
        setMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: userMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          {
            sender: "bot",
            text: botPrompt,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        saveHistory(sessionId, "bot", botPrompt).catch(console.error);
        return;
      }

      // STEP 4 - Domain & Save to Leads Database
      if (leadStep === 4) {
        const payload = {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          preferred_domain: userMessage,
        };

        setMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: userMessage,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        setIsTyping(true);

        try {
          const res = await saveLead(payload);
          if (!res.success) {
            throw new Error(res.error || res.message || "Failed to save lead.");
          }

          const botResponse = `🎉 Thank you for registering, ${payload.name}!\n\nYour details have been submitted and saved successfully in our database.\nOur team will contact you soon.`;
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: botResponse,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          saveHistory(sessionId, "bot", botResponse).catch(console.error);
        } catch (err: unknown) {
          console.error("Error saving lead:", err);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errResponse = `⚠️ Could not submit your registration (${errorMessage}). Please try again later.`;
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: errResponse,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          saveHistory(sessionId, "bot", errResponse).catch(console.error);
        } finally {
          setIsTyping(false);
          setShowLeadForm(false);
          setLeadStep(0);
          setLeadData({ name: "", email: "", phone: "", domain: "" });
        }
        return;
      }
    }

    // Check if user is asking to apply/register
    if (/apply|register|enroll|registration|fill form|lead/i.test(userMessage)) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: userMessage,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      startLeadForm();
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setIsTyping(true);

    try {
      const data = await sendChat(userMessage);

      if (!data.success) {
        throw new Error(data.message || "Failed to get response");
      }

      // Check if response triggered human escalation (e.g. refund / complaint / human callback)
      if (data.escalation && Array.isArray(data.escalation) && data.escalation.length > 0) {
        createEscalation(sessionId, `User issue: "${userMessage}" (${data.escalation.join(", ")})`).catch(console.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      saveHistory(sessionId, "bot", data.reply).catch(console.error);

    } catch (error) {
      console.error("Chat API Error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errReply = `Sorry, I'm unable to connect to the WeIntern AI right now. (${errorMessage}) Please try again.`;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      saveHistory(sessionId, "bot", errReply).catch(console.error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition"
      >
        <BsChatDotsFill size={24} />
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold">🤖 WeIntern AI Assistant</h2>
              <p className="text-xs">🟢 Online</p>
            </div>

            <button onClick={() => setOpen(false)}>
              <BsX size={28} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="mr-2 text-2xl">🤖</div>
                )}

                <div
                  className={`p-3 rounded-xl shadow max-w-[75%] ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  <p
                    className={`text-[10px] mt-1 ${
                      msg.sender === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="mr-2 text-2xl">🤖</div>

                <div className="bg-blue-100 text-gray-900 p-3 rounded-xl shadow">
                  Typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>

          </div>

          {/* Quick Replies */}
          <div className="border-t p-3 flex flex-wrap gap-2 bg-white">

            <button
              onClick={() => quickReply("Apply / Register")}
              className="border border-blue-600 bg-blue-50 text-blue-700 font-medium rounded-full px-3 py-1 text-sm hover:bg-blue-600 hover:text-white transition"
            >
              ✨ Apply / Register
            </button>

            <button
              onClick={() => quickReply("Internship Fees")}
              className="border border-blue-600 text-blue-700 rounded-full px-3 py-1 text-sm hover:bg-blue-600 hover:text-white transition"
            >
              Internship Fees
            </button>

            <button
              onClick={() => quickReply("Domains")}
              className="border border-blue-600 text-blue-700 rounded-full px-3 py-1 text-sm hover:bg-blue-600 hover:text-white transition"
            >
              Domains
            </button>

            <button
              onClick={() => quickReply("Certificates")}
              className="border border-blue-600 text-blue-700 rounded-full px-3 py-1 text-sm hover:bg-blue-600 hover:text-white transition"
            >
              Certificates
            </button>

            <button
              onClick={() => quickReply("Contact")}
              className="border border-blue-600 text-blue-700 rounded-full px-3 py-1 text-sm hover:bg-blue-600 hover:text-white transition"
            >
              Contact
            </button>

          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">

            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600"
            />

            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
            >
              <IoSend />
            </button>

          </div>

        </div>
      )}
    </>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";
import { BsChatDotsFill, BsX } from "react-icons/bs";
import { IoSend } from "react-icons/io5";

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

  const quickReply = (question: string, answer: string) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: question,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        sender: "bot",
        text: answer,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    let botReply = "Sorry, I don't have information about that yet.";
// Lead Form Logic
if (showLeadForm) {

  // STEP 1 - Name
  if (leadStep === 1) {
    setLeadData((prev) => ({
      ...prev,
      name: userMessage,
    }));

    setLeadStep(2);

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        sender: "bot",
        text: "Please enter your Email Address.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
    return;
  }

  // STEP 2 - Email
  if (leadStep === 2) {
    setLeadData((prev) => ({
      ...prev,
      email: userMessage,
    }));

    setLeadStep(3);

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        sender: "bot",
        text: "Please enter your Phone Number.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
    return;
  }

  // STEP 3 - Phone Number
  if (leadStep === 3) {
    setLeadData((prev) => ({
      ...prev,
      phone: userMessage,
    }));

    setLeadStep(4);

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        sender: "bot",
        text: "Please enter your Interested Domain.\n\nExample: Full Stack Development, Data Science, AI/ML, UI/UX Design, Digital Marketing",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
    return;
  }

  // STEP 4 - Domain
  if (leadStep === 4) {
    setLeadData((prev) => ({
      ...prev,
      domain: userMessage,
    }));

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        sender: "bot",
        text: "🎉 Thank you for registering!\n\nYour details have been submitted successfully.\nOur team will contact you soon.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setShowLeadForm(false);
    setLeadStep(0);

    setLeadData({
      name: "",
      email: "",
      phone: "",
      domain: "",
    });

    setMessage("");
    return;
  }

}


    const lower = userMessage.toLowerCase();

   const registrationKeywords = [
  "apply",
  "register",
  "registration",
  "enroll",
  "enrol",
  "join now",
  "i want to join",
  "i want to register",
  "admission"
];

if (registrationKeywords.some(keyword => lower.includes(keyword))) { {
  setShowLeadForm(true);
  setLeadStep(1);

  setMessages((prev) => [
    ...prev,
    {
      sender: "user",
      text: userMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      sender: "bot",
      text: "Great! Let's get you registered.\n\nPlease enter your Full Name.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  setMessage("");
  return;
}

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botReply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

     setIsTyping(false);
    }, 1000);
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
                  <div>{msg.text}</div>

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
              onClick={() =>
                quickReply(
                  "Internship Fees",
                  "Our internship fee depends on the selected program. Please visit the official WeIntern website for the latest details."
                )
              }
              className="border border-blue-600 text-blue-700 rounded-full px-3 py-1 text-sm hover:bg-blue-600 hover:text-white transition"
            >
              Internship Fees
            </button>

            <button
              onClick={() =>
                quickReply(
                  "Domains",
                  "We offer Full Stack Development, Data Science, AI/ML, UI/UX Design and Digital Marketing."
                )
              }
              className="border border-blue-600 text-blue-700 rounded-full px-3 py-1 text-sm hover:bg-blue-600 hover:text-white transition"
            >
              Domains
            </button>

            <button
              onClick={() =>
                quickReply(
                  "Certificates",
                  "Certificates are awarded after successfully completing the internship."
                )
              }
              className="border border-blue-600 text-blue-700 rounded-full px-3 py-1 text-sm hover:bg-blue-600 hover:text-white transition"
            >
              Certificates
            </button>

            <button
              onClick={() =>
                quickReply(
                  "Contact",
                  "You can contact the WeIntern support team through the Contact Us page on the official website."
                )
              }
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
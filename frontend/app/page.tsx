import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-100">

      <h1 className="text-5xl font-bold text-blue-700">
        WeIntern AI Chatbot
      </h1>

      <p className="mt-4 text-gray-600">
        Smart AI Assistant for WeIntern
      </p>

      <Link href="/chat">
        <button className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
          Open Chatbot
        </button>
      </Link>

      {/* Chat Widget */}
      <ChatWidget />

    </main>
  );
}
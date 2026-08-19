import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-x-hidden">
      <div className="max-w-3xl w-full bg-white p-6 sm:p-12 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          24/7 AI-Powered Career Assistant
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Welcome to <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">WeIntern</span> AI Chatbot
        </h1>

        <p className="text-slate-600 text-xs sm:text-base max-w-xl mx-auto leading-relaxed">
          Ask questions about our 10+ internship programs, course details, certificates, fees, and placement support with instant AI answers & voice support.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/chat">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 sm:px-8 py-3 rounded-2xl transition shadow-lg hover:shadow-xl hover:scale-105 text-xs sm:text-sm cursor-pointer min-h-[44px]">
              🚀 Open Full Chat Interface
            </button>
          </Link>
          <Link href="/register">
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-6 py-3 rounded-2xl transition border border-slate-300 text-xs sm:text-sm cursor-pointer min-h-[44px]">
              📝 Apply for Internship
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-5 py-3 rounded-2xl transition border border-emerald-200 text-xs sm:text-sm cursor-pointer min-h-[44px]">
              📊 Leads Dashboard
            </button>
          </Link>
        </div>
      </div>

      <ChatWidget />
    </main>
  );
}
import ChatWidget from "@/components/ChatWidget";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <ChatWidget />
    </main>
  );
}
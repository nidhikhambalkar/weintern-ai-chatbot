import Link from "next/link";

export const dynamic = "force-dynamic";

async function fetchFaqs() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const response = await fetch(`${apiBase}/api/faq`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load FAQ: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("FAQ fetch error:", error);
    return null;
  }
}

export default async function FaqPage() {
  const faqs = await fetchFaqs();

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">WeIntern FAQ</h1>
            <p className="mt-2 text-slate-600">
              Frequently asked questions from the WeIntern knowledge base.
            </p>
          </div>
          <Link href="/" className="rounded-full bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
            Home
          </Link>
        </div>

        {faqs === null ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            Unable to load FAQ data. Please make sure the backend is running and reachable.
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((item: any, index: number) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">{item.question}</h2>
                <p className="mt-2 text-slate-700 whitespace-pre-line">{item.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

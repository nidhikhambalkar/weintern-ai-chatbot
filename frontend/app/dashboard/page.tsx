"use client";

import { useEffect, useState } from "react";
import { getLeads } from "@/services/chatApi";

interface Lead {
  id?: number;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  preferred_domain: string;
  created_at?: string;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeadsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeads();
      if (res.success && Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        setError(res.error || "Failed to load lead applications.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              📊 WeIntern Application Leads Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              View and manage all student internship applications submitted through the Apply / Register form.
            </p>
          </div>
          <button
            onClick={fetchLeadsData}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
          >
            🔄 Refresh Leads
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{leads.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Status</p>
            <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span> Online & Operational
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Domains</p>
            <p className="text-xl font-bold text-slate-800 mt-1">10+ Verified Domains</p>
          </div>
        </div>

        {/* Lead Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Student Registration Applications ({leads.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              ⏳ Loading registration leads...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 bg-red-50 text-sm font-medium">
              ⚠️ {error}
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No registration leads found yet. Submit an application via the Lead Form to see it here!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-3.5">#</th>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Contact Details</th>
                    <th className="px-6 py-3.5">Selected Domain</th>
                    <th className="px-6 py-3.5">Duration</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Payment Status</th>
                    <th className="px-6 py-3.5">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead: any, idx) => (
                    <tr key={lead._id || lead.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{lead.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <div>{lead.email}</div>
                        <div className="text-slate-400 font-mono mt-0.5">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          🎯 {lead.preferred_domain}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                        {lead.internship_duration || "3 Months"}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 text-xs">
                        ₹{lead.amount ? lead.amount : (lead.internship_duration === "6 Months" ? "6,599" : "999")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            lead.payment_status === "PAID"
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : lead.payment_status === "FAILED"
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {lead.payment_status || "PENDING"}
                        </span>
                        {lead.payment_id && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1">ID: {lead.payment_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {lead.created_at ? new Date(lead.created_at).toLocaleString() : "Just now"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

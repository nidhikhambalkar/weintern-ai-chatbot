"use client";

import { useState } from "react";
import { saveLead } from "@/services/chatApi";
import { BsX } from "react-icons/bs";

interface LeadFormProps {
  onClose?: () => void;
  onSuccess?: (name: string) => void;
  onSkip?: () => void;
}

export default function LeadForm({ onClose, onSuccess, onSkip }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_domain: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formData.name || !formData.email || !formData.phone || !formData.preferred_domain) {
      setStatusMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await saveLead(formData);
      if (res.success) {
        const submittedName = formData.name;
        setStatusMessage({
          type: "success",
          text: `🎉 Thank you, ${submittedName}! Your application has been saved successfully in our database.`,
        });
        if (onSuccess) {
          onSuccess(submittedName);
        }
        setFormData({
          name: "",
          email: "",
          phone: "",
          preferred_domain: "",
        });
      } else {
        throw new Error(res.error || res.message || "Failed to submit lead.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: "error",
        text: `Error submitting application: ${errorMessage}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClick = () => {
    if (onSkip) {
      onSkip();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="relative max-w-md w-full mx-auto bg-white p-5 sm:p-7 rounded-2xl shadow-2xl border border-gray-100">
      {/* Top-Right X / Close Button */}
      <button
        type="button"
        onClick={handleSkipClick}
        title="Close registration form"
        aria-label="Close registration form"
        className="absolute top-3.5 right-3.5 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition cursor-pointer z-10 shadow-sm border border-gray-200"
      >
        <BsX size={18} />
        <span>Close</span>
      </button>

      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 pr-16">
        Apply for WeIntern Internship 🚀
      </h2>
      <p className="text-gray-600 text-xs sm:text-sm mb-5">
        Fill in your details below to register for our internship programs.
      </p>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl mb-4 text-xs sm:text-sm ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="+91 9876543210"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Preferred Domain <span className="text-red-500">*</span>
          </label>
          <select
            name="preferred_domain"
            value={formData.preferred_domain}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none transition"
          >
            <option value="">Select a domain...</option>
            <option value="Full Stack Development">Full Stack Development</option>
            <option value="Data Science">Data Science</option>
            <option value="Artificial Intelligence & Machine Learning">AI & Machine Learning</option>
            <option value="UI/UX Design">UI/UX Design</option>
            <option value="Digital Marketing">Digital Marketing</option>
            <option value="Cyber Security">Cyber Security</option>
          </select>
        </div>

        <div className="space-y-2 pt-1">
          {/* Option 1: Submit Application / Register */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            {loading ? "Submitting..." : "🚀 Submit Application"}
          </button>

          {/* Option 2: Skip Registration / Continue Without Registration */}
          <button
            type="button"
            onClick={handleSkipClick}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition border border-slate-300 text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            ⏩ Skip Registration / Continue without Registration
          </button>
        </div>
      </form>
    </div>
  );
}

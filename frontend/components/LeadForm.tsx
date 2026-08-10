"use client";

import { useState } from "react";
import { saveLead } from "@/services/chatApi";

export default function LeadForm() {
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
        setStatusMessage({
          type: "success",
          text: `🎉 Thank you, ${formData.name}! Your application has been saved successfully in our database.`,
        });
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

  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Apply for WeIntern Internship 🚀
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Fill in your details below to register for our internship programs.
      </p>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="+91 9876543210"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Domain <span className="text-red-500">*</span>
          </label>
          <select
            name="preferred_domain"
            value={formData.preferred_domain}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none transition"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow-md disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createPaymentOrder, verifyPayment } from "@/services/chatApi";
import { BsX, BsCheckCircleFill, BsShieldCheck } from "react-icons/bs";

interface LeadFormProps {
  onClose?: () => void;
  onSuccess?: (name: string) => void;
  onSkip?: () => void;
}

const PRICING_DETAILS: Record<string, { price: number; desc: string; highlights: string[] }> = {
  "3 Months": {
    price: 999,
    desc: "3-Month Internship Program",
    highlights: [
      "Industry-oriented training",
      "Hands-on Live Project experience",
      "Official Internship Certificate",
      "Letter of Recommendation (LOR)",
      "Performance Stipend up to ₹10,000"
    ]
  },
  "6 Months": {
    price: 6599,
    desc: "6-Month Premium Internship Program",
    highlights: [
      "2 Months Training + Live Project Work",
      "100% Placement Guarantee & Job Assistance",
      "Verified Internship & Training Certificates",
      "Letter of Recommendation (LOR)",
      "Mock Interviews & Resume Preparation",
      "Performance Stipend up to ₹10,000"
    ]
  }
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function LeadForm({ onClose, onSuccess, onSkip }: LeadFormProps) {
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_domain: "",
    internship_duration: "3 Months"
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<any>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formData.name || !formData.email || !formData.phone || !formData.preferred_domain || !formData.internship_duration) {
      setStatusMessage({
        type: "error",
        text: "Please fill in all required fields: Name, Email, Phone, Domain, and Internship Duration.",
      });
      return;
    }

    setStep("payment");
  };

  const handlePayNow = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Create Server-Side Order
      const orderRes = await createPaymentOrder(formData);
      if (!orderRes.success) {
        throw new Error(orderRes.error || "Failed to create payment order.");
      }

      const orderData = orderRes.data;
      const isScriptLoaded = await loadRazorpayScript();

      if (isScriptLoaded && orderData.key_id && orderData.key_id !== "rzp_test_simulated" && typeof (window as any).Razorpay !== "undefined") {
        // Open Real Razorpay Checkout Modal
        const options = {
          key: orderData.key_id,
          amount: orderData.amount * 100,
          currency: orderData.currency,
          name: "WeIntern EdTech",
          description: `${formData.preferred_domain} (${formData.internship_duration})`,
          order_id: orderData.order_id,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#2563eb",
          },
          handler: async function (response: any) {
            await completeServerSideVerification({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email: formData.email,
              phone: formData.phone
            });
          },
          modal: {
            ondismiss: async function () {
              setLoading(false);
              setStatusMessage({
                type: "error",
                text: "Payment was cancelled. Enrollment remains unpaid.",
              });
              await verifyPayment({
                email: formData.email,
                phone: formData.phone,
                payment_status: "CANCELLED"
              });
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Simulated / Direct Test Verification Flow
        console.log("[Payment Gateway] Executing server-side test verification...");
        await completeServerSideVerification({
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          email: formData.email,
          phone: formData.phone
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: "error",
        text: `Payment processing error: ${errorMessage}`,
      });
      setLoading(false);
    }
  };

  const completeServerSideVerification = async (verifyPayload: any) => {
    try {
      const verifyRes = await verifyPayment(verifyPayload);
      if (verifyRes.success) {
        setPaymentReceipt(verifyRes.data);
        setStep("success");
        if (onSuccess) {
          onSuccess(formData.name);
        }
      } else {
        throw new Error(verifyRes.error || "Server-side payment verification failed.");
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `❌ Verification Failed: ${err.message}`,
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

  const selectedPlan = PRICING_DETAILS[formData.internship_duration] || PRICING_DETAILS["3 Months"];

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

      {/* STEP 1: LEAD DETAILS & INTERNSHIP DURATION */}
      {step === "details" && (
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 pr-16">
            Apply for WeIntern Internship 🚀
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mb-5">
            Fill in your details and select your internship duration to proceed.
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

          <form onSubmit={handleProceedToPayment} className="space-y-3 sm:space-y-4">
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
                <option value="Full Stack Web Development">Full Stack Web Development</option>
                <option value="Mobile App Development">Mobile App Development</option>
                <option value="AI & Automation">AI & Automation</option>
                <option value="Data Science & Analytics">Data Science & Analytics</option>
                <option value="Python Programming">Python Programming</option>
                <option value="Java Programming">Java Programming</option>
                <option value="C/C++ Programming">C/C++ Programming</option>
                <option value="Cloud Computing & DevOps">Cloud Computing & DevOps</option>
                <option value="DevOps Engineering">DevOps Engineering</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
                <option value="Video Editing & Content Creation">Video Editing & Content Creation</option>
              </select>
            </div>

            {/* INTERNSHIP DURATION SELECTOR */}
            {formData.preferred_domain && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-800 mb-2">
                  Select Internship Duration <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      formData.internship_duration === "3 Months"
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="internship_duration"
                        value="3 Months"
                        checked={formData.internship_duration === "3 Months"}
                        onChange={handleChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-gray-900 text-sm">3 Months</span>
                    </div>
                    <div className="text-xs text-blue-700 font-extrabold mt-1">₹999 (Full Pay)</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Live Project + LOR</div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      formData.internship_duration === "6 Months"
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="internship_duration"
                        value="6 Months"
                        checked={formData.internship_duration === "6 Months"}
                        onChange={handleChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-gray-900 text-sm">6 Months</span>
                    </div>
                    <div className="text-xs text-blue-700 font-extrabold mt-1">₹6,599 (Placement)</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">100% Placement Guarantee</div>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                Proceed to Payment Summary 💳
              </button>

              <button
                type="button"
                onClick={handleSkipClick}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-xl transition border border-slate-300 text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                ⏩ Skip Registration / Continue without Registration
              </button>
            </div>
          </form>
        </>
      )}

      {/* STEP 2: PAYMENT SUMMARY */}
      {step === "payment" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 pr-12">
            Payment Summary 💳
          </h2>
          <p className="text-xs text-gray-600">
            Review your enrollment details before proceeding to payment.
          </p>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs ${
                statusMessage.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-800">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Student Name:</span>
              <span className="font-bold text-slate-900">{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Email:</span>
              <span className="text-slate-900">{formData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Selected Domain:</span>
              <span className="font-bold text-blue-600">{formData.preferred_domain}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-500">Internship Duration:</span>
              <span className="font-bold text-slate-900">{formData.internship_duration}</span>
            </div>

            <div className="border-t border-slate-200 pt-2 font-semibold">
              <span className="text-slate-700">Program Includes:</span>
              <ul className="mt-1 space-y-1 text-[11px] text-slate-600 pl-2">
                {selectedPlan.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-green-600">✓</span> {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t-2 border-dashed border-slate-300 pt-3 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">Total Payable Amount:</span>
              <span className="font-extrabold text-blue-700 text-lg">₹{selectedPlan.price.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-[11px] text-emerald-800">
            <BsShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
            <span>256-Bit SSL Encrypted Razorpay Gateway (UPI, Cards, NetBanking accepted).</span>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handlePayNow}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              {loading ? "Verifying Payment..." : `🔒 Pay Now ₹${selectedPlan.price.toLocaleString("en-IN")}`}
            </button>

            <button
              type="button"
              onClick={() => setStep("details")}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl transition border border-gray-300 text-xs cursor-pointer text-center"
            >
              ← Back to Edit Details
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ENROLLMENT CONFIRMED SUCCESS */}
      {step === "success" && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <BsCheckCircleFill size={40} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            ✓ Enrollment Successful!
          </h2>

          <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
            Congratulations <strong>{formData.name}</strong>! Your payment of <strong>₹{selectedPlan.price}</strong> has been server-side verified.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs space-y-1.5 text-slate-700">
            <div><span className="font-semibold">Domain:</span> {formData.preferred_domain}</div>
            <div><span className="font-semibold">Duration:</span> {formData.internship_duration}</div>
            <div><span className="font-semibold">Payment Status:</span> <span className="text-green-600 font-bold">PAID</span></div>
            <div><span className="font-semibold">Transaction ID:</span> <span className="font-mono text-[11px]">{paymentReceipt?.payment_id || "pay_verified"}</span></div>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-xs text-left leading-relaxed">
            📧 A detailed confirmation receipt and orientation details have been sent to <strong>{formData.email}</strong>.
          </div>

          <button
            type="button"
            onClick={handleSkipClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-md text-sm cursor-pointer"
          >
            Start Chat / Continue to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

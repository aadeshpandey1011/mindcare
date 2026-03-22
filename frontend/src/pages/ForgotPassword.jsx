import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email,       setEmail]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState("");
  const [messageType, setMessageType] = useState("");
  const [emailSent,   setEmailSent]   = useState(false);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 8000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!email) { showMessage("Please enter your email address.", "error"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Please enter a valid email address.", "error"); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset email");

      setEmailSent(true);
      showMessage("Password reset link sent to your email!", "success");
      setEmail("");
    } catch (err) {
      showMessage(err.message || "Failed to send reset email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[28%] max-w-md bg-white rounded-lg shadow-xl p-10">

        <div className="text-3xl font-bold mb-2 text-gray-800 text-center">Forgot Password?</div>
        <p className="text-sm text-gray-600 text-center mb-6">
          We'll send you a reset link valid for 15 minutes.
        </p>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
            MC
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
            messageType === "success" ? "bg-green-100 text-green-700" :
            messageType === "error"   ? "bg-red-100 text-red-700"     : "bg-blue-100 text-blue-700"
          }`}>
            {message}
          </div>
        )}

        {!emailSent ? (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="fp-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                placeholder="Enter your registered email"
                className="w-full text-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the email linked to your MindCare account.
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Check your email</h3>
            <p className="text-sm text-gray-500">
              A password reset link has been sent. It expires in 15 minutes.
            </p>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? "Resending…" : "Resend Email"}
            </button>
          </div>
        )}

        {/* Back to Sign In — uses navigate, actually works */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-red-400 hover:underline text-sm inline-flex items-center gap-1"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>

      <div className="mt-4 mb-14 text-gray-600 text-center text-sm">
        Didn't receive the email? Check your spam folder.
      </div>
    </div>
  );
}

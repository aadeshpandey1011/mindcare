import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export default function ResetPassword() {
  const { token }  = useParams();   // token from the email link URL
  const navigate   = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState("");
  const [messageType, setMessageType] = useState("");
  const [done,        setDone]        = useState(false); // true after successful reset

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 6000);
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!form.newPassword || !form.confirmPassword) {
      showMessage("Please fill both password fields.", "error"); return;
    }
    if (form.newPassword.length < 6) {
      showMessage("Password must be at least 6 characters.", "error"); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showMessage("Passwords do not match.", "error"); return;
    }
    if (!token) {
      showMessage("Invalid or missing reset token. Please request a new link.", "error"); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: form.newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password reset failed");

      setDone(true);
      showMessage("Password reset successful! Redirecting to login…", "success");

      // Auto-redirect to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      showMessage(err.message || "Password reset failed. The link may have expired.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[28%] max-w-md bg-white rounded-lg shadow-xl p-10">

        <div className="text-3xl font-bold mb-2 text-gray-800 text-center">
          {done ? "Password Reset!" : "Set New Password"}
        </div>
        <p className="text-sm text-gray-600 text-center mb-6">
          {done
            ? "Your password has been updated successfully."
            : "Enter and confirm your new password below."}
        </p>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
            MC
          </div>
        </div>

        {/* Message banner */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
            messageType === "success" ? "bg-green-100 text-green-700" :
            messageType === "error"   ? "bg-red-100 text-red-700"     : "bg-blue-100 text-blue-700"
          }`}>
            {message}
          </div>
        )}

        {!done ? (
          <div className="flex flex-col gap-4">

            {/* New password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full text-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                placeholder="Re-enter your new password"
                className={`w-full text-sm border-2 rounded-lg px-4 py-2.5 focus:outline-none ${
                  form.confirmPassword && form.newPassword !== form.confirmPassword
                    ? "border-red-400 focus:border-red-500"
                    : form.confirmPassword && form.newPassword === form.confirmPassword
                    ? "border-green-400 focus:border-green-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {form.confirmPassword && form.newPassword === form.confirmPassword && (
                <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </div>
        ) : (
          // Success state
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Redirecting you to login…</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-base font-medium transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Footer link */}
        {!done && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-red-400 hover:underline text-sm inline-flex items-center gap-1"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 mb-14 text-gray-500 text-center text-sm">
        Link expired?{" "}
        <button
          onClick={() => navigate("/forgot-password")}
          className="text-red-400 hover:underline"
        >
          Request a new one
        </button>
      </div>
    </div>
  );
}

import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 8000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      showMessage("Please enter your email address.", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }

    setLoading(true);
    
    try {
      // Make API call to forgot password endpoint
      const response = await fetch("/api/v1/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setEmailSent(true);
      showMessage("Password reset link has been sent to your email!", "success");
      setEmail(""); // Clear email field

    } catch (err) {
      console.error(err);
      showMessage(err.message || "Failed to send reset email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    showMessage("Redirecting to login...", "info");
    // In real app: navigate("/login");
  };

  const handleResendEmail = () => {
    if (email) {
      handleSubmit({ preventDefault: () => {} });
    } else {
      showMessage("Please enter your email address first.", "error");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[28%] max-w-md bg-white rounded-lg shadow-xl p-10">
        {/* Header */}
        <div className="text-3xl font-bold mb-2 text-gray-800 text-center">
          Forgot Password?
        </div>
        
        <div className="text-sm text-gray-600 text-center mb-6">
          Don't worry, we'll send you reset instructions.
        </div>
        
        {/* Logo placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
            MC
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
            messageType === "success" ? "bg-green-100 text-green-700" :
            messageType === "error" ? "bg-red-100 text-red-700" :
            messageType === "info" ? "bg-blue-100 text-blue-700" : ""
          }`}>
            {message}
          </div>
        )}

        {!emailSent ? (
          <>
            {/* Email Input Form */}
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your registered email"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the email address associated with your account
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-lg font-medium cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Email Sent Confirmation */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Check your email</h3>
              
              <p className="text-sm text-gray-600 mb-6">
                We've sent a password reset link to your email address. 
                The link will expire in 15 minutes for security.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Resending..." : "Resend Email"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <button 
            onClick={handleBackToLogin}
            className="text-red-400 hover:underline text-sm cursor-pointer bg-none border-none inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Sign In
          </button>
        </div>
      </div>
      
      {/* Additional Help */}
      <div className="mt-4 mb-14 text-gray-600 text-center text-sm max-w-md">
        <p>
          Didn't receive the email? Check your spam folder or{" "}
          <span className="text-red-400 hover:underline cursor-pointer">
            contact support
          </span>
        </p>
      </div>
    </div>
  );
}
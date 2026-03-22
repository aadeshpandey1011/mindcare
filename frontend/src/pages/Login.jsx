import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE    = import.meta.env.VITE_API_URL    || "http://localhost:5000/api/v1";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function Login() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { login }      = useAuth();

  const [form, setForm] = useState({
    email: "", username: "", password: "", loginMethod: "email",
  });
  const [loading,            setLoading]            = useState(false);
  const [message,            setMessage]            = useState("");
  const [messageType,        setMessageType]        = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Show error if redirected back from a failed Google login
  useEffect(() => {
    if (searchParams.get("error") === "google_failed") {
      showMessage("Google sign-in failed. Please try again or use email.", "error");
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLoginMethodChange = (method) =>
    setForm({ ...form, loginMethod: method, email: "", username: "" });

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginValue = form.loginMethod === "email" ? form.email : form.username;
    if (!loginValue || !form.password) { showMessage("Please fill all fields.", "error"); return; }

    setLoading(true);
    try {
      const loginData = {
        password: form.password,
        ...(form.loginMethod === "email" ? { email: form.email } : { username: form.username }),
      };

      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(loginData),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid credentials. Please check your details.");
        if (response.status >= 500)  throw new Error("Server error. Please try again later.");
        throw new Error(`Login failed (${response.status})`);
      }

      const data = await response.json();
      const token = data.token || data.data?.token;
      const user  = data.user  || data.data?.user;
      if (!token || !user) throw new Error("Invalid response from server");

      if (user.isApproved === false) {
        throw new Error("Your account is pending admin approval.");
      }

      localStorage.setItem("dpi_token", token);
      localStorage.setItem("token",     token);
      localStorage.setItem("user",      JSON.stringify(user));
      await login(token, user);

      showMessage("Login successful! Redirecting...", "success");
      setTimeout(() => navigate(user.role === "admin" ? "/dashboard" : "/newhome"), 1000);

    } catch (err) {
      if (err.message?.includes("pending")) {
        showMessage("Your account is pending admin approval.", "info");
      } else if (err.name === "TypeError") {
        showMessage("Network error. Please check your connection.", "error");
      } else {
        showMessage(err.message || "Login failed.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect to backend Google OAuth — no frontend library needed
  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
  };

  if (showForgotPassword) {
    return <ForgotPasswordComponent onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[28%] max-w-md bg-white rounded-lg shadow-xl p-10">

        <div className="text-3xl font-bold mb-6 text-gray-800 text-center">Sign In</div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">MC</div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
            messageType === "success" ? "bg-green-100 text-green-700" :
            messageType === "error"   ? "bg-red-100 text-red-700"     : "bg-blue-100 text-blue-700"
          }`}>{message}</div>
        )}

        {/* Google button — real OAuth redirect */}
        <div className="my-5">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 rounded-lg py-3 px-4 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {/* Real Google "G" SVG logo */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="flex items-center gap-2 my-5">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Email / Username toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          {["email", "username"].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => handleLoginMethodChange(method)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium capitalize transition-colors ${
                form.loginMethod === method ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {method}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {form.loginMethod === "email" ? "Email" : "Username"}
            </label>
            {form.loginMethod === "email" ? (
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="Enter your email" required
                className="w-full text-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none" />
            ) : (
              <input type="text" name="username" value={form.username} onChange={handleChange}
                placeholder="Enter your username" required
                className="w-full text-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Enter your password" required
              className="w-full text-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none" />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-base font-medium cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => setShowForgotPassword(true)}
            className="text-red-400 hover:underline text-sm cursor-pointer bg-none border-none">
            Forgot Password?
          </button>
        </div>
      </div>

      <div className="mt-4 mb-14 text-gray-700">
        New to MindCare?{" "}
        <button onClick={() => navigate("/signup")}
          className="text-red-400 hover:underline cursor-pointer bg-none border-none">
          Join Now
        </button>
      </div>
    </div>
  );
}

// ── Forgot Password ───────────────────────────────────────────────────────────
function ForgotPasswordComponent({ onBack }) {
  const [email,       setEmail]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState("");
  const [messageType, setMessageType] = useState("");
  const [emailSent,   setEmailSent]   = useState(false);

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 8000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { showMessage("Please enter your email address.", "error"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showMessage("Please enter a valid email.", "error"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send reset email. Please try again.");
      setEmailSent(true);
      showMessage("Password reset link sent to your email!", "success");
      setEmail("");
    } catch (err) {
      showMessage(err.message || "Failed to send reset email.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[28%] max-w-md bg-white rounded-lg shadow-xl p-10">
        <div className="text-3xl font-bold mb-2 text-gray-800 text-center">Forgot Password?</div>
        <p className="text-sm text-gray-600 text-center mb-6">We'll send you reset instructions.</p>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">MC</div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
            messageType === "success" ? "bg-green-100 text-green-700" :
            messageType === "error"   ? "bg-red-100 text-red-700"     : "bg-blue-100 text-blue-700"
          }`}>{message}</div>
        )}

        {!emailSent ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email" required
                className="w-full text-sm border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none" />
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Check your email</h3>
            <p className="text-sm text-gray-500">Reset link sent. It expires in 15 minutes.</p>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {loading ? "Resending…" : "Resend Email"}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={onBack}
            className="text-red-400 hover:underline text-sm inline-flex items-center gap-1">
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

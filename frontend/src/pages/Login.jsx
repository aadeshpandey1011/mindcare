import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";


export default function Login() {
  const navigate = useNavigate();   // ✅ initialize navigate
  const { login } = useAuth();   // ✅ get login function from context
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    loginMethod: "email" // Track whether user wants to login with email or username
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  // const [showSignup, setShowSignup] = useState(false); 
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLoginMethodChange = (method) => {
    setForm({
      ...form,
      loginMethod: method,
      email: "",
      username: ""
    });
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loginValue = form.loginMethod === "email" ? form.email : form.username;

    if (!loginValue || !form.password) {
      showMessage("Please fill all fields.", "error");
      return;
    }

    setLoading(true);

    try {
      // Prepare login data based on method
      const loginData = {
        password: form.password,
        ...(form.loginMethod === "email" ? { email: form.email } : { username: form.username })
      };

      // Make API call with better error handling
      const url = `${API_BASE}/users/login`; // <-- use same base as register/forgot
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginData),
        credentials: "include", // include cookies if backend uses them (no harm otherwise)
      });

      // Check if response is ok first
      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 404) {
          throw new Error("Login service is currently unavailable. Please try again later.");
        } else if (response.status === 401) {
          throw new Error("Invalid credentials. Please check your email/username and password.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(`HTTP ${response.status}: Login failed`);
        }
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server");
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid JSON response from server");
      }

      // Your backend likely sends `token` and `user` at root, not inside `data`
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user;

      if (!token || !user) {
        throw new Error("Invalid response structure from server");
      }

      console.log("IsApproved:", user.isApproved);
      if (user.isApproved === false) {
        setLoading(false);
        throw new Error("Your account is pending approval. Please wait for an admin to approve your account.");
        return;
      }
      showMessage("Login successful! Redirecting...", "success");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("dpi_token", data.token);


      localStorage.setItem("user", JSON.stringify({
        id: user.id || user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }));
      // ✅ update context instead of just localStorage
      await login(token, user);
      // Redirect after short delay
      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/Newhome");
        }
      }, 1500);

      // In a real app, you would use context/state management and navigation
      // For demo purposes, we'll just show success
      console.log("Login successful:", { token, user });

      // Reset form
      setForm({
        email: "",
        username: "",
        password: "",
        loginMethod: "email"
      });

    } catch (err) {
      console.error("Login error:", err);

      if (err.name === "TypeError" && err.message.includes("fetch")) {
        showMessage("Network error. Please check your connection and try again.", "error");
      } else if (err.message.includes("pending approval")) {
        showMessage("Your account is pending admin approval.", "info");
      } else {
        showMessage(err.message || "Login failed. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    showMessage("Google login feature is coming soon!", "info");
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleJoinNow = () => {
    // setShowSignup(true);
    navigate("/signup");
  };

  // Simple component switching for demo
  // if (showSignup) {
  //   return <SignupComponent onBackToLogin={() => setShowSignup(false)} />;
  // }

  if (showForgotPassword) {
    return <ForgotPasswordComponent onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[28%] max-w-md bg-white rounded-lg shadow-xl p-10">
        {/* Header */}
        <div className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Sign In
        </div>

        {/* Logo placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
            MC
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${messageType === "success" ? "bg-green-100 text-green-700" :
              messageType === "error" ? "bg-red-100 text-red-700" :
                messageType === "info" ? "bg-blue-100 text-blue-700" : ""
            }`}>
            {message}
          </div>
        )}

        {/* Google Login Button */}
        <div className="my-5">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 rounded-lg py-3 px-4 text-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              G
            </div>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 my-6">
          <div className="flex-1 h-px bg-gray-400"></div>
          <div className="text-gray-400">or</div>
          <div className="flex-1 h-px bg-gray-400"></div>
        </div>

        {/* Login Method Toggle */}
        <div className="mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleLoginMethodChange("email")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${form.loginMethod === "email"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => handleLoginMethodChange("username")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${form.loginMethod === "username"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Username
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="flex flex-col gap-4">
          {/* Email or Username Input */}
          <div>
            <label htmlFor={form.loginMethod} className="block text-sm font-medium text-gray-700 mb-1">
              {form.loginMethod === "email" ? "Email" : "Username"}
            </label>
            {form.loginMethod === "email" ? (
              <input
                type="email"
                name="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Enter your email"
                required
              />
            ) : (
              <input
                type="text"
                name="username"
                id="username"
                value={form.username}
                onChange={handleChange}
                className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Enter your username"
                required
              />
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-lg font-medium cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* Forgot Password Link */}
        <div className="mt-4 text-center">
          <button
            onClick={handleForgotPassword}
            className="text-red-400 hover:underline text-sm cursor-pointer bg-none border-none"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      {/* Sign up link - outside the box */}
      <div className="mt-4 mb-14 text-gray-700">
        New to MindCare?{" "}
        <button
          onClick={handleJoinNow}
          className="text-red-400 hover:underline cursor-pointer bg-none border-none"
        >
          Join Now
        </button>
      </div>
    </div>
  );
}




// Simplified Forgot Password Component for demo
function ForgotPasswordComponent({ onBackToLogin }) {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Password reset service is currently unavailable. Please try again later.");
        } else {
          throw new Error("Failed to send reset email. Please try again.");
        }
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const responseText = await response.text();
        if (responseText) {
          const data = JSON.parse(responseText);
          if (!data.success) {
            throw new Error(data.message || "Failed to send reset email");
          }
        }
      }

      setEmailSent(true);
      showMessage("Password reset link has been sent to your email!", "success");
      setEmail("");

    } catch (err) {
      console.error("Forgot password error:", err);
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        showMessage("Network error. Please check your connection and try again.", "error");
      } else {
        showMessage(err.message || "Failed to send reset email. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[28%] max-w-md bg-white rounded-lg shadow-xl p-10">
        <div className="text-3xl font-bold mb-2 text-gray-800 text-center">
          Forgot Password?
        </div>

        <div className="text-sm text-gray-600 text-center mb-6">
          Don't worry, we'll send you reset instructions.
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
            MC
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${messageType === "success" ? "bg-green-100 text-green-700" :
              messageType === "error" ? "bg-red-100 text-red-700" :
                messageType === "info" ? "bg-blue-100 text-blue-700" : ""
            }`}>
            {message}
          </div>
        )}

        {!emailSent ? (
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

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-lg font-medium cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        ) : (
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

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Resending..." : "Resend Email"}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-red-400 hover:underline text-sm cursor-pointer bg-none border-none inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Sign In
          </button>
        </div>
      </div>

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
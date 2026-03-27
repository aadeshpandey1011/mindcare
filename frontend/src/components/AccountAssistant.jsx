/**
 * AccountAssistant — floating AI-powered account helper.
 * Bottom-left corner on all authenticated pages.
 * Fetches real user data then routes questions through the
 * backend /chat endpoint (Gemini) with an account-context system prompt.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const QUICK_CHIPS = {
  student: [
    { label: "📅 My bookings", q: "Show me my upcoming and recent bookings with their status, counsellor name, date/time, and fee" },
    { label: "💳 Payments", q: "Do I have any pending payments or awaiting-payment bookings?" },
    { label: "⭐ Reviews due", q: "Are there any sessions waiting for my review or confirmation?" },
    { label: "👤 My profile", q: "Summarize my account and profile info" },
  ],
  counsellor: [
    { label: "📅 Sessions", q: "Show me my upcoming confirmed sessions and any pending approval requests" },
    { label: "💰 Earnings", q: "What are my earnings and pending payouts?" },
    { label: "⭐ Awaiting confirm", q: "Are there sessions waiting for student confirmation to release payment?" },
    { label: "👤 Profile", q: "Summarize my counsellor profile" },
  ],
  admin: [
    { label: "👥 Approvals", q: "Are there any counsellors pending admin approval?" },
    { label: "📊 Stats", q: "Give me a summary of platform stats — users, bookings, revenue" },
    { label: "💸 Payouts", q: "Are there counsellor payouts that need to be processed?" },
    { label: "🔄 Activity", q: "What's the recent activity on the platform?" },
  ],
};

export default function AccountAssistant() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  // Fetch account data when panel opens
  const fetchAccountData = useCallback(async () => {
    if (!token || accountData) return;
    setDataLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const results = {};

      try {
        const bRes = await fetch(`${API}/bookings?limit=10&sortBy=createdAt&sortOrder=desc`, { headers });
        const bData = await bRes.json();
        if (bData.success) results.bookings = (bData.data.bookings || []).map(b => ({
          counsellor: b.counselor?.fullName || b.student?.fullName || "N/A",
          date: b.date, timeSlot: b.timeSlot, mode: b.mode,
          status: b.status, feePaid: b.feePaid, reason: b.reason,
        }));
      } catch (e) { results.bookings = []; }

      try {
        const pRes = await fetch(`${API}/payments/history?limit=10`, { headers });
        const pData = await pRes.json();
        if (pData.success) results.payments = (pData.data.payments || []).map(p => ({
          amount: p.amount, status: p.status, method: p.paymentMethod, date: p.createdAt,
        }));
      } catch (e) { results.payments = []; }

      results.profile = { name: user.fullName, email: user.email, role: user.role };

      if (user?.role === "admin") {
        try {
          const aRes = await fetch(`${API}/admin/pending-users`, { headers });
          const aData = await aRes.json();
          if (aData.success) results.pendingUsers = (aData.data.users || []).map(u => ({
            name: u.fullName, email: u.email, role: u.role, date: u.createdAt,
          }));
        } catch (e) { results.pendingUsers = []; }
      }

      setAccountData(results);
    } catch (e) { /* silent */ }
    finally { setDataLoading(false); }
  }, [token, user, accountData]);

  useEffect(() => { if (open && !accountData) fetchAccountData(); }, [open, fetchAccountData, accountData]);

  if (!user || !token) return null;

  const role = user.role || "student";
  const chips = QUICK_CHIPS[role] || QUICK_CHIPS.student;

  const buildContextMessage = (userQuestion) => {
    const dataStr = accountData ? JSON.stringify(accountData, null, 2) : "No data loaded yet.";
    return `[ACCOUNT ASSISTANT MODE — Answer as MindCare's Account Assistant, NOT as the mental health companion]

The user is asking about their account. Here is their LIVE account data fetched from the database:

USER: ${user.fullName || "User"} (${role})
ACCOUNT DATA:
${dataStr}

RULES:
- Answer ONLY about account info (bookings, payments, profile, sessions).
- Format dates nicely (e.g. "Mon 15 Apr, 2–3 PM").
- For bookings: show status, counsellor/student name, date/time, fee.
- "session_done" = counsellor marked done, student needs to confirm & review.
- "payment_pending" = student needs to complete payment.
- "pending" = awaiting counsellor approval.
- If data is empty say so and suggest next steps.
- Never invent data. Keep responses under 120 words.
- If asked mental health questions, redirect to Ira (the AI companion) or booking a session.

USER QUESTION: ${userQuestion}`;
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Route through backend /chat endpoint (Gemini) with account context
      const contextMessage = buildContextMessage(text);
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: contextMessage,
          history: [],
        }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Oops — I couldn't reach the server. Please check your connection and try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e?.preventDefault(); sendMessage(input); };
  const handleRefresh = () => { setAccountData(null); setMessages([]); };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96 max-h-[75vh] flex flex-col overflow-hidden"
          style={{ animation: "assistantSlideUp 0.2s ease-out" }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Account Assistant</p>
              <p className="text-emerald-100 text-[11px]">
                {dataLoading ? "Loading your data…" : "Bookings, payments & more"}
              </p>
            </div>
            <button onClick={handleRefresh} title="Refresh data"
              className="text-white/60 hover:text-white p-1 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            </button>
            <button onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white p-1 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">👋</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">Hi {user.fullName?.split(" ")[0] || "there"}!</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  {dataLoading ? "Fetching your account data…" : "Ask about bookings, payments, sessions & more"}
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {chips.map(c => (
                    <button key={c.label} onClick={() => sendMessage(c.q)}
                      disabled={loading || dataLoading}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}/>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}/>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEnd}/>
          </div>

          {messages.length > 0 && !loading && (
            <div className="px-4 pb-1.5 flex flex-wrap gap-1 flex-shrink-0">
              {chips.slice(0, 3).map(c => (
                <button key={c.label} onClick={() => sendMessage(c.q)}
                  className="text-[10px] font-medium px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit}
            className="border-t border-gray-100 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
            <input ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your account…"
              disabled={loading || dataLoading}
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 disabled:opacity-50"
            />
            <button type="submit" disabled={!input.trim() || loading || dataLoading}
              className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </form>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
          open ? "bg-gray-700" : "bg-gradient-to-br from-emerald-500 to-emerald-700"
        }`}
        title="Account Assistant">
        <span className="text-2xl">{open ? "✕" : "🤖"}</span>
        {!open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">AI</span>
          </span>
        )}
      </button>

      <style>{`
        @keyframes assistantSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const MOOD_EMOJIS = { 1:"😞",2:"😔",3:"😐",4:"🙂",5:"😊" };

const INITIAL_MSG = {
  id: 0, role: "model",
  text: "Hi there 👋 I'm Mia, your MindCare companion. I'm here to listen and support you — whatever's on your mind today.\n\nIs there something specific you'd like to talk about, or would you just like to chat?",
};

// Crisis hotline block shown when crisis detected
function CrisisBlock() {
  return (
    <div className="mx-4 mb-3 bg-red-900/40 border border-red-500/50 rounded-xl p-4">
      <p className="text-red-200 text-sm font-bold mb-2">🆘 Please reach out for immediate support:</p>
      <div className="flex flex-wrap gap-2">
        <a href="tel:9152987821" className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          iCall: 9152987821
        </a>
        <a href="tel:18602662345" className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          Vandrevala: 1860-2662-345
        </a>
        <a href="tel:112" className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          Emergency: 112
        </a>
      </div>
    </div>
  );
}

// Message bubble
function MessageBubble({ msg, onSuggestionClick }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 px-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
          <span className="text-white text-xs font-bold">M</span>
        </div>
      )}
      <div className={`max-w-[78%] ${isUser ? "order-first mr-2" : ""}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-white/12 backdrop-blur text-white/95 rounded-tl-sm border border-white/10"
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.text}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none [&>p]:text-white/95 [&>ul]:text-white/90 [&>ol]:text-white/90 [&>li]:text-white/90 [&>h3]:text-white [&>strong]:text-white [&>blockquote]:text-white/80">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
            </div>
          )}
        </div>
        <p className="text-white/30 text-[10px] mt-1 px-1">{msg.time}</p>
        {/* Suggestion chips below AI messages */}
        {!isUser && msg.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.suggestions.map((s, i) => (
              <button key={i} onClick={() => onSuggestionClick(s)}
                className="text-[11px] bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 px-3 py-1 rounded-full transition-all">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-white text-xs font-bold">U</span>
        </div>
      )}
    </div>
  );
}

export default function ChatSupport() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();

  const [messages, setMessages]     = useState([{
    ...INITIAL_MSG,
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    suggestions: ["I'm feeling anxious", "I've been feeling low", "I'm stressed about exams", "I just need to talk"],
  }]);
  const [input,     setInput]       = useState("");
  const [loading,   setLoading]     = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [todayMood,  setTodayMood]  = useState(null);
  const [moodSaved,  setMoodSaved]  = useState(false);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const msgCounter = useRef(1);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load today's mood
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/wellness/mood`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setTodayMood(d.data.todayMood); })
      .catch(() => {});
  }, [token]);

  // Build Gemini history from messages (exclude initial bot message)
  const buildHistory = useCallback(() => {
    return messages
      .filter(m => m.id !== 0) // skip the initial greeting
      .slice(-18) // last 18 messages for context
      .map(m => ({
        role:  m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsg = {
      id:   ++msgCounter.current,
      role: "user",
      text: trimmed,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory();
      const res     = await fetch(`${API}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();

      if (data.crisisDetected) setShowCrisis(true);

      const botMsg = {
        id:          ++msgCounter.current,
        role:        "model",
        text:        data.reply || "I'm here for you. Could you tell me a bit more?",
        time:        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        suggestions: data.suggestions || [],
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id:   ++msgCounter.current,
        role: "model",
        text: "I had a small hiccup. Please try again — I'm still here for you.",
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        suggestions: [],
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, token, buildHistory]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const logMood = async (m) => {
    setTodayMood(m);
    setMoodSaved(true);
    if (token) {
      await fetch(`${API}/wellness/mood`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mood: m }),
      }).catch(() => {});
    }
    // Auto-send a relevant message after mood log
    setTimeout(() => {
      const phrases = {
        1: "I'm feeling really awful today",
        2: "I'm not having a great day",
        3: "I'm feeling okay, nothing special",
        4: "I'm feeling pretty good today",
        5: "I'm feeling great today!",
      };
      sendMessage(phrases[m]);
    }, 600);
  };

  const clearConversation = () => {
    setMessages([{
      ...INITIAL_MSG,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      suggestions: ["I'm feeling anxious", "I've been feeling low", "I'm stressed about exams", "I just need to talk"],
    }]);
    setShowCrisis(false);
    msgCounter.current = 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10" />
        <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-10" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/5 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Mia — AI Support</h1>
            <p className="text-white/50 text-xs">Mental Health Companion · Always here</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/screening")}
            className="text-xs text-white/60 hover:text-white border border-white/15 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all">
            Take Screening
          </button>
          <button onClick={clearConversation}
            className="text-xs text-white/40 hover:text-white/70 px-2 py-1.5 transition-all" title="New conversation">
            ↺ New
          </button>
        </div>
      </div>

      {/* Mood check-in strip (shown if not logged today) */}
      {todayMood === null && !moodSaved && (
        <div className="relative z-10 bg-indigo-900/40 border-b border-indigo-500/20 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-white/70 text-xs font-medium">How are you feeling today?</p>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(m => (
              <button key={m} onClick={() => logMood(m)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-xl flex items-center justify-center transition-all hover:scale-110"
                title={["Awful","Bad","Okay","Good","Great"][m-1]}>
                {MOOD_EMOJIS[m]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Crisis banner — persistent when triggered */}
      {showCrisis && (
        <div className="relative z-10">
          <CrisisBlock />
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto pt-4 pb-2 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.3) transparent" }}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onSuggestionClick={sendMessage} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start mb-3 px-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <div className="bg-white/12 backdrop-blur border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div className="relative z-10 px-4 py-1 text-center">
        <p className="text-white/25 text-[10px]">
          Mia is an AI companion — not a therapist. If in crisis, call iCall: 9152987821 · Always seek professional help for serious concerns.
        </p>
      </div>

      {/* Input area */}
      <div className="relative z-10 bg-white/5 backdrop-blur border-t border-white/10 px-4 py-3">
        {/* Quick actions */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[
            { label: "📊 Take a screening", action: () => navigate("/screening") },
            { label: "📚 Browse resources",  action: () => navigate("/resources")  },
            { label: "📅 Book a session",    action: () => navigate("/booking")    },
            { label: "✍️ Journal",           action: () => navigate("/journal")    },
          ].map(q => (
            <button key={q.label} onClick={q.action}
              className="flex-shrink-0 text-xs bg-white/8 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
              {q.label}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind…"
            className="flex-1 bg-white/10 backdrop-blur border border-white/15 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/35 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
            style={{ minHeight: 48, maxHeight: 120 }}
          />
          <button onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all shadow-lg flex-shrink-0">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MoodWidget — floating daily mood check-in button.
 * Appears in the bottom-right corner on all authenticated pages.
 * Shows a pulsing dot if user hasn't logged mood today.
 * Collapses after logging.
 */
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const MOODS = [
  { value: 1, emoji: "😞", label: "Awful"  },
  { value: 2, emoji: "😔", label: "Bad"    },
  { value: 3, emoji: "😐", label: "Okay"   },
  { value: 4, emoji: "🙂", label: "Good"   },
  { value: 5, emoji: "😊", label: "Great"  },
];

export default function MoodWidget() {
  const { user, token } = useAuth();
  const [open,      setOpen]      = useState(false);
  const [todayMood, setTodayMood] = useState(null); // null = not logged
  const [saved,     setSaved]     = useState(false);
  const [loading,   setLoading]   = useState(false);

  // Fetch today's mood on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/wellness/mood`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTodayMood(d.data.todayMood);
          if (d.data.todayMood !== null) setSaved(true);
        }
      })
      .catch(() => {});
  }, [token]);

  if (!user || user.role === "admin") return null; // admin doesn't need mood tracking

  const logMood = async (value) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/wellness/mood`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ mood: value }),
      });
      const data = await res.json();
      if (data.success) {
        setTodayMood(value);
        setSaved(true);
        setTimeout(() => setOpen(false), 1400);
      }
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  };

  const moodObj = MOODS.find(m => m.value === todayMood);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Expanded picker */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64 animate-in slide-in-from-bottom-2 duration-200">
          {saved ? (
            <div className="text-center py-2">
              <span className="text-3xl">{moodObj?.emoji}</span>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                Mood logged: {moodObj?.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Come back tomorrow 💙</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 text-center">
                How are you feeling today?
              </p>
              <div className="flex justify-between">
                {MOODS.map(m => (
                  <button key={m.value} onClick={() => logMood(m.value)} disabled={loading}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition-all group">
                    <span className="text-2xl group-hover:scale-125 transition-transform">{m.emoji}</span>
                    <span className="text-[10px] text-gray-400">{m.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
          saved
            ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
            : "bg-gradient-to-br from-emerald-600 to-green-500"
        }`}
        title={saved ? `Today's mood: ${moodObj?.label}` : "Log today's mood"}>
        <span className="text-2xl">{saved ? (moodObj?.emoji || "😊") : "💭"}</span>
        {/* Pulsing dot when not logged */}
        {!saved && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white">
            <span className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-75" />
          </span>
        )}
      </button>
    </div>
  );
}

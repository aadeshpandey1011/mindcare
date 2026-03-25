import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const MOOD_MAP = { 1:"😞", 2:"😔", 3:"😐", 4:"🙂", 5:"😊" };

const PROMPTS = [
  "What's weighing on your mind today?",
  "Describe three things that went well this week.",
  "What emotion is strongest right now, and where do you feel it in your body?",
  "What would you tell a close friend who was feeling the way you do?",
  "What is one thing you're grateful for today, no matter how small?",
  "Describe a challenge you're facing. What's one small step forward?",
  "What does your ideal day look like? What's stopping you from having it?",
  "What are you afraid of right now? Is that fear helping or hurting you?",
  "Write about someone who made you feel good recently and why.",
  "What do you need more of in your life right now?",
  "When did you last feel truly at peace? What was different then?",
  "What are you proud of yourself for this week?",
];

function MoodSelector({ value, onChange }) {
  return (
    <div className="flex gap-2 items-center">
      <span className="text-xs text-gray-500 font-medium mr-1">Mood:</span>
      {[1,2,3,4,5].map(m => (
        <button key={m} type="button" onClick={() => onChange(value === m ? null : m)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110 ${
            value === m ? "ring-2 ring-indigo-400 bg-indigo-50" : "opacity-50 hover:opacity-100"
          }`}>
          {MOOD_MAP[m]}
        </button>
      ))}
    </div>
  );
}

function EntryCard({ entry, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const date = new Date(entry.createdAt);
  const dateStr = date.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {entry.title ? (
            <h3 className="font-bold text-gray-900 truncate">{entry.title}</h3>
          ) : (
            <h3 className="font-medium text-gray-400 italic text-sm">Untitled</h3>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{dateStr} · {timeStr}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {entry.mood && <span className="text-xl">{MOOD_MAP[entry.mood]}</span>}
          <button onClick={() => onEdit(entry)} className="text-gray-300 hover:text-indigo-500 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button onClick={() => onDelete(entry._id)} className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 bg-red-50 rounded-lg">Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 px-2 py-1">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">{entry.body}</p>
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {entry.tags.map(t => (
            <span key={t} className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Journal() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();

  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null); // null = new, entry = editing

  // Form state
  const [form, setForm] = useState({ title: "", body: "", mood: null, tags: "" });
  const [saving,  setSaving]  = useState(false);
  const [showForm,setShowForm]= useState(false);
  const [prompt,  setPrompt]  = useState("");

  const bodyRef = useRef(null);

  // Load entries
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/wellness/journal`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setEntries(d.data.entries || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const openNew = (withPrompt) => {
    const p = withPrompt ?? PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setEditing(null);
    setForm({ title: "", body: p ? `Prompt: ${p}\n\n` : "", mood: null, tags: "" });
    setPrompt(p || "");
    setShowForm(true);
    setTimeout(() => bodyRef.current?.focus(), 100);
  };

  const openEdit = (entry) => {
    setEditing(entry);
    setForm({
      title: entry.title || "",
      body:  entry.body  || "",
      mood:  entry.mood  || null,
      tags:  (entry.tags || []).join(", "),
    });
    setPrompt("");
    setShowForm(true);
    setTimeout(() => bodyRef.current?.focus(), 100);
  };

  const handleSave = async () => {
    if (!form.body.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      body:  form.body.trim(),
      mood:  form.mood,
      prompt: prompt || "",
      tags:  form.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5),
    };
    try {
      if (editing) {
        const res  = await fetch(`${API}/wellness/journal/${editing._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setEntries(prev => prev.map(e => e._id === editing._id ? data.data : e));
        }
      } else {
        const res  = await fetch(`${API}/wellness/journal`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) setEntries(prev => [data.data, ...prev]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (e) { /* silent */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/wellness/journal/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(prev => prev.filter(e => e._id !== id));
    } catch (e) { /* silent */ }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">✍️</span>
                <span className="text-sm font-medium opacity-75 uppercase tracking-wider">Private Journal</span>
              </div>
              <h1 className="text-3xl font-extrabold">My Journal</h1>
              <p className="text-white/70 mt-1 text-sm">
                {entries.length} {entries.length === 1 ? "entry" : "entries"} · completely private
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openNew()}
                className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow">
                ✍️ New Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Write form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{editing ? "Edit Entry" : "New Entry"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {prompt && !editing && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-4 text-sm text-indigo-700 font-medium">
                💭 {prompt}
              </div>
            )}

            <input type="text" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Title (optional)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-300" />

            <textarea ref={bodyRef} rows={8} value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Write freely — this is your private space…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3" />

            <input type="text" value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="Tags: stress, gratitude, reflection (comma-separated)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300" />

            <div className="flex items-center justify-between flex-wrap gap-3">
              <MoodSelector value={form.mood} onChange={m => setForm(p => ({ ...p, mood: m }))} />
              <div className="flex gap-2">
                <button onClick={() => openNew(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
                  className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors">
                  💡 New prompt
                </button>
                <button onClick={handleSave} disabled={!form.body.trim() || saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all">
                  {saving ? "Saving…" : editing ? "Update" : "Save Entry"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prompt suggestions (when no form open) */}
        {!showForm && entries.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
            <p className="text-4xl mb-3">📔</p>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Your journal is empty</h3>
            <p className="text-gray-500 text-sm mb-5">Writing regularly reduces anxiety and depression. Start with a prompt below, or write freely.</p>
            <div className="grid grid-cols-1 gap-2 text-left">
              {PROMPTS.slice(0, 4).map((p, i) => (
                <button key={i} onClick={() => openNew(p)}
                  className="flex items-start gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-sm text-indigo-800 transition-colors text-left">
                  <span className="flex-shrink-0 mt-0.5">💭</span> {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick write button when entries exist and form is closed */}
        {!showForm && entries.length > 0 && (
          <div className="flex gap-3 mb-6 flex-wrap">
            <button onClick={() => openNew()}
              className="flex-1 py-3 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700 rounded-xl text-sm font-medium transition-all">
              ✍️ Write a new entry
            </button>
            <button onClick={() => openNew(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
              className="px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-medium transition-all">
              💡 Use a prompt
            </button>
          </div>
        )}

        {/* Entry list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading your entries…
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <EntryCard key={entry._id} entry={entry} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

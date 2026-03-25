import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to MindCare 👋",
    subtitle: "Let's personalise your experience. This takes 60 seconds.",
  },
  {
    id: "concern",
    title: "What brings you here?",
    subtitle: "Choose the area that feels most relevant right now.",
    field: "primaryConcern",
    options: [
      { value: "anxiety",      label: "Anxiety or worry",      icon: "😰" },
      { value: "depression",   label: "Low mood or depression", icon: "💙" },
      { value: "stress",       label: "Stress or burnout",      icon: "🔥" },
      { value: "sleep",        label: "Sleep problems",         icon: "🌙" },
      { value: "relationships",label: "Relationships",          icon: "🤝" },
      { value: "self-esteem",  label: "Self-esteem",            icon: "💪" },
      { value: "other",        label: "Just exploring",         icon: "🌱" },
    ],
  },
  {
    id: "severity",
    title: "How much is this affecting you?",
    subtitle: "Be honest — there are no wrong answers.",
    field: "severity",
    options: [
      { value: "mild",     label: "A little — I want to get ahead of it",    icon: "🟢" },
      { value: "moderate", label: "Quite a bit — it's affecting my daily life",icon: "🟡" },
      { value: "severe",   label: "A lot — I'm really struggling",            icon: "🔴" },
      { value: "not_sure", label: "I'm not sure",                             icon: "❓" },
    ],
  },
  {
    id: "previous",
    title: "Have you spoken to a professional before?",
    subtitle: "This helps us tailor the right level of support.",
    field: "previousHelp",
    options: [
      { value: true,  label: "Yes, I have",            icon: "✅" },
      { value: false, label: "No, this is my first time", icon: "🌟" },
    ],
  },
  {
    id: "goals",
    title: "What are you hoping for?",
    subtitle: "Select all that apply.",
    field: "goals",
    multi: true,
    options: [
      { value: "feel_better",    label: "Feel better day to day",         icon: "☀️" },
      { value: "build_skills",   label: "Learn coping skills",            icon: "🛠️" },
      { value: "book_session",   label: "Book a counselling session",     icon: "📅" },
      { value: "understand",     label: "Understand what I'm going through", icon: "🧠" },
      { value: "track_progress", label: "Track my wellbeing over time",   icon: "📈" },
    ],
  },
  {
    id: "support",
    title: "What kind of support works best for you?",
    subtitle: "We'll set up your home screen accordingly.",
    field: "preferredSupport",
    options: [
      { value: "self_help",   label: "Self-help resources & tools", icon: "📚" },
      { value: "ai_chat",     label: "AI chat companion (Mia)",     icon: "🤖" },
      { value: "counsellor",  label: "Human counsellor sessions",   icon: "👩‍⚕️" },
      { value: "combination", label: "A mix of everything",         icon: "🔀" },
    ],
  },
];

export default function OnboardingModal({ onComplete }) {
  const { token } = useAuth();
  const navigate   = useNavigate();

  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({
    primaryConcern:   "",
    severity:         "",
    previousHelp:     null,
    goals:            [],
    preferredSupport: "",
  });
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const isMulti = current?.multi;
  const totalSteps = STEPS.length;
  const pct = Math.round((step / (totalSteps - 1)) * 100);

  const handleSelect = (field, value) => {
    if (isMulti) {
      setAnswers(prev => {
        const arr = prev[field] || [];
        return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
      });
    } else {
      setAnswers(prev => ({ ...prev, [field]: value }));
    }
  };

  const canProceed = () => {
    if (step === 0) return true;
    const field = current.field;
    const val   = answers[field];
    if (isMulti) return Array.isArray(val) && val.length > 0;
    return val !== "" && val !== null;
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(s => s + 1);
    } else {
      // Final step — save and close
      setSaving(true);
      try {
        await fetch(`${API}/wellness/onboarding`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify(answers),
        });
      } catch (e) { /* non-fatal */ }
      setSaving(false);
      onComplete(answers);
    }
  };

  const skip = async () => {
    // Mark onboarding as complete with empty answers
    if (token) {
      await fetch(`${API}/wellness/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: true }),
      }).catch(() => {});
    }
    onComplete(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
            style={{ width: `${pct}%` }} />
        </div>

        <div className="p-7">
          {/* Step counter */}
          {step > 0 && (
            <p className="text-xs text-gray-400 font-medium mb-4">
              Step {step} of {totalSteps - 1}
            </p>
          )}

          <h2 className="text-xl font-bold text-gray-900 mb-1">{current.title}</h2>
          <p className="text-sm text-gray-500 mb-6">{current.subtitle}</p>

          {/* Welcome step */}
          {step === 0 && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-600 text-sm leading-relaxed">
                MindCare is your confidential mental health companion. We'll ask you a few quick questions to personalise your experience — your resources, AI chat, and home screen will adapt to your needs.
              </p>
            </div>
          )}

          {/* Options */}
          {current.options && (
            <div className="grid grid-cols-1 gap-2.5">
              {current.options.map(opt => {
                const field = current.field;
                const val   = answers[field];
                const selected = isMulti ? (val || []).includes(opt.value) : val === opt.value;
                return (
                  <button key={String(opt.value)} onClick={() => handleSelect(field, opt.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                        : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50"
                    }`}>
                    <span className="text-xl flex-shrink-0">{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                    {selected && <span className="ml-auto text-indigo-500">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between mt-6 gap-3">
            <button onClick={skip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Skip for now
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Back
                </button>
              )}
              <button onClick={handleNext} disabled={!canProceed() || saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
                {saving ? "Saving…" : step === totalSteps - 1 ? "Get Started 🚀" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

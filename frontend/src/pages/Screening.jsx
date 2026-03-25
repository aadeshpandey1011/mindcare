import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
//  ASSESSMENT DEFINITIONS
//  FIX: renamed numeric "questions: N" to "questionCount: N" in all 5
//       assessments to eliminate the duplicate key esbuild error.
// ─────────────────────────────────────────────────────────────────────────────
const ASSESSMENTS = {
  PHQ9: {
    id: "PHQ9", label: "PHQ-9", fullName: "Depression Scale",
    color: "#8b5cf6", bg: "#f5f3ff", badge: "bg-purple-100 text-purple-700",
    icon: "💜", emoji: "🧠", duration: "3–5 min", questionCount: 9,
    description: "Clinically validated 9-item scale for detecting and measuring depression severity.",
    timeframe: "Over the LAST 2 WEEKS, how often have you been bothered by:",
    questions: [
      { id: "Q1", text: "Little interest or pleasure in doing things" },
      { id: "Q2", text: "Feeling down, depressed, or hopeless" },
      { id: "Q3", text: "Trouble falling or staying asleep, or sleeping too much" },
      { id: "Q4", text: "Feeling tired or having little energy" },
      { id: "Q5", text: "Poor appetite or overeating" },
      { id: "Q6", text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down" },
      { id: "Q7", text: "Trouble concentrating on things, such as reading the newspaper or watching television" },
      { id: "Q8", text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual" },
      { id: "Q9", text: "Thoughts that you would be better off dead, or thoughts of hurting yourself in some way", sensitive: true },
    ],
    options: [
      { value: 0, label: "Not at all",                emoji: "😊", color: "text-green-500" },
      { value: 1, label: "Several days",              emoji: "😐", color: "text-yellow-500" },
      { value: 2, label: "More than half the days",   emoji: "😔", color: "text-orange-500" },
      { value: 3, label: "Nearly every day",          emoji: "😰", color: "text-red-500" },
    ],
    maxScore: 27,
    scoring: [
      { max: 4,  label: "None–Minimal",      color: "#10b981", bg: "#ecfdf5", text: "green"  },
      { max: 9,  label: "Mild",              color: "#f59e0b", bg: "#fffbeb", text: "yellow" },
      { max: 14, label: "Moderate",          color: "#f97316", bg: "#fff7ed", text: "orange" },
      { max: 19, label: "Moderately Severe", color: "#ef4444", bg: "#fef2f2", text: "red"    },
      { max: 27, label: "Severe",            color: "#dc2626", bg: "#fff1f2", text: "red"    },
    ],
  },
  GAD7: {
    id: "GAD7", label: "GAD-7", fullName: "Anxiety Scale",
    color: "#0ea5e9", bg: "#f0f9ff", badge: "bg-blue-100 text-blue-700",
    icon: "💙", emoji: "😰", duration: "2–4 min", questionCount: 7,
    description: "7-item scale for measuring generalised anxiety disorder severity.",
    timeframe: "Over the LAST 2 WEEKS, how often have you been bothered by:",
    questions: [
      { id: "Q1", text: "Feeling nervous, anxious, or on edge" },
      { id: "Q2", text: "Not being able to stop or control worrying" },
      { id: "Q3", text: "Worrying too much about different things" },
      { id: "Q4", text: "Trouble relaxing" },
      { id: "Q5", text: "Being so restless that it is hard to sit still" },
      { id: "Q6", text: "Becoming easily annoyed or irritable" },
      { id: "Q7", text: "Feeling afraid, as if something awful might happen" },
    ],
    options: [
      { value: 0, label: "Not at all",                emoji: "😊", color: "text-green-500" },
      { value: 1, label: "Several days",              emoji: "😐", color: "text-yellow-500" },
      { value: 2, label: "More than half the days",   emoji: "😔", color: "text-orange-500" },
      { value: 3, label: "Nearly every day",          emoji: "😰", color: "text-red-500" },
    ],
    maxScore: 21,
    scoring: [
      { max: 4,  label: "Minimal",  color: "#10b981", bg: "#ecfdf5", text: "green"  },
      { max: 9,  label: "Mild",     color: "#f59e0b", bg: "#fffbeb", text: "yellow" },
      { max: 14, label: "Moderate", color: "#f97316", bg: "#fff7ed", text: "orange" },
      { max: 21, label: "Severe",   color: "#ef4444", bg: "#fef2f2", text: "red"    },
    ],
  },
  PSS10: {
    id: "PSS10", label: "PSS-10", fullName: "Perceived Stress Scale",
    color: "#f59e0b", bg: "#fffbeb", badge: "bg-amber-100 text-amber-700",
    icon: "🧡", emoji: "🔥", duration: "3–4 min", questionCount: 10,
    description: "Measures your perception of stress over the past month. Widely used in research and clinical settings.",
    timeframe: "In the LAST MONTH, how often have you:",
    questions: [
      { id: "Q1",  text: "Been upset because of something that happened unexpectedly" },
      { id: "Q2",  text: "Felt unable to control the important things in your life" },
      { id: "Q3",  text: "Felt nervous and stressed" },
      { id: "Q4",  text: "Felt confident about your ability to handle your personal problems", reverse: true },
      { id: "Q5",  text: "Felt that things were going your way", reverse: true },
      { id: "Q6",  text: "Found that you could not cope with all the things you had to do" },
      { id: "Q7",  text: "Been able to control irritations in your life", reverse: true },
      { id: "Q8",  text: "Felt that you were on top of things", reverse: true },
      { id: "Q9",  text: "Been angered because of things that were outside of your control" },
      { id: "Q10", text: "Felt difficulties were piling up so high that you could not overcome them" },
    ],
    options: [
      { value: 0, label: "Never",        emoji: "😊", color: "text-green-500"  },
      { value: 1, label: "Almost Never", emoji: "🙂", color: "text-lime-500"   },
      { value: 2, label: "Sometimes",    emoji: "😐", color: "text-yellow-500" },
      { value: 3, label: "Fairly Often", emoji: "😔", color: "text-orange-500" },
      { value: 4, label: "Very Often",   emoji: "😰", color: "text-red-500"    },
    ],
    maxScore: 40,
    scoring: [
      { max: 13, label: "Low Stress",      color: "#10b981", bg: "#ecfdf5", text: "green"  },
      { max: 26, label: "Moderate Stress", color: "#f59e0b", bg: "#fffbeb", text: "yellow" },
      { max: 40, label: "High Stress",     color: "#ef4444", bg: "#fef2f2", text: "red"    },
    ],
  },
  WEMWBS: {
    id: "WEMWBS", label: "WEMWBS", fullName: "Wellbeing Scale",
    color: "#10b981", bg: "#ecfdf5", badge: "bg-green-100 text-green-700",
    icon: "💚", emoji: "🌱", duration: "3–4 min", questionCount: 14,
    description: "Warwick-Edinburgh Mental Wellbeing Scale — measures positive mental health and flourishing.",
    timeframe: "Thinking about the LAST 2 WEEKS, how much of the time:",
    higherIsBetter: true,
    questions: [
      { id: "Q1",  text: "I've been feeling optimistic about the future" },
      { id: "Q2",  text: "I've been feeling useful" },
      { id: "Q3",  text: "I've been feeling relaxed" },
      { id: "Q4",  text: "I've been feeling interested in other people" },
      { id: "Q5",  text: "I've had energy to spare" },
      { id: "Q6",  text: "I've been dealing with problems well" },
      { id: "Q7",  text: "I've been thinking clearly" },
      { id: "Q8",  text: "I've been feeling good about myself" },
      { id: "Q9",  text: "I've been feeling close to other people" },
      { id: "Q10", text: "I've been feeling confident" },
      { id: "Q11", text: "I've been able to make up my own mind about things" },
      { id: "Q12", text: "I've been feeling loved" },
      { id: "Q13", text: "I've been interested in new things" },
      { id: "Q14", text: "I've been feeling cheerful" },
    ],
    options: [
      { value: 1, label: "None of the time",   emoji: "😞", color: "text-red-500"    },
      { value: 2, label: "Rarely",             emoji: "😔", color: "text-orange-500" },
      { value: 3, label: "Some of the time",   emoji: "😐", color: "text-yellow-500" },
      { value: 4, label: "Often",              emoji: "🙂", color: "text-lime-500"   },
      { value: 5, label: "All of the time",    emoji: "😊", color: "text-green-500"  },
    ],
    maxScore: 70,
    scoring: [
      { max: 40, label: "Low Wellbeing",      color: "#ef4444", bg: "#fef2f2", text: "red"    },
      { max: 52, label: "Moderate Wellbeing", color: "#f59e0b", bg: "#fffbeb", text: "yellow" },
      { max: 59, label: "Good Wellbeing",     color: "#10b981", bg: "#ecfdf5", text: "green"  },
      { max: 70, label: "High Wellbeing",     color: "#059669", bg: "#ecfdf5", text: "green"  },
    ],
  },
  AUDIT: {
    id: "AUDIT", label: "AUDIT", fullName: "Alcohol Use Screening",
    color: "#ef4444", bg: "#fef2f2", badge: "bg-red-100 text-red-700",
    icon: "❤️", emoji: "⚠️", duration: "3–5 min", questionCount: 10,
    description: "WHO's Alcohol Use Disorders Identification Test — screens for hazardous and harmful alcohol use.",
    timeframe: "Please answer the following questions honestly:",
    questions: [
      { id: "Q1",  text: "How often do you have a drink containing alcohol?",
        options: [{ value: 0, label: "Never" },{ value: 1, label: "Monthly or less" },{ value: 2, label: "2–4 times/month" },{ value: 3, label: "2–3 times/week" },{ value: 4, label: "4+ times/week" }] },
      { id: "Q2",  text: "How many standard drinks do you have on a typical day when you drink?",
        options: [{ value: 0, label: "1–2" },{ value: 1, label: "3–4" },{ value: 2, label: "5–6" },{ value: 3, label: "7–9" },{ value: 4, label: "10 or more" }] },
      { id: "Q3",  text: "How often do you have 6 or more drinks on one occasion?",
        options: [{ value: 0, label: "Never" },{ value: 1, label: "Less than monthly" },{ value: 2, label: "Monthly" },{ value: 3, label: "Weekly" },{ value: 4, label: "Daily or almost daily" }] },
      { id: "Q4",  text: "How often in the last year have you found that you were not able to stop drinking once you had started?",
        options: [{ value: 0, label: "Never" },{ value: 1, label: "Less than monthly" },{ value: 2, label: "Monthly" },{ value: 3, label: "Weekly" },{ value: 4, label: "Daily or almost daily" }] },
      { id: "Q5",  text: "How often in the last year have you failed to do what was normally expected of you because of drinking?",
        options: [{ value: 0, label: "Never" },{ value: 1, label: "Less than monthly" },{ value: 2, label: "Monthly" },{ value: 3, label: "Weekly" },{ value: 4, label: "Daily or almost daily" }] },
      { id: "Q6",  text: "How often in the last year have you needed a drink in the morning to get yourself going after a heavy drinking session?",
        options: [{ value: 0, label: "Never" },{ value: 1, label: "Less than monthly" },{ value: 2, label: "Monthly" },{ value: 3, label: "Weekly" },{ value: 4, label: "Daily or almost daily" }] },
      { id: "Q7",  text: "How often in the last year have you had a feeling of guilt or remorse after drinking?",
        options: [{ value: 0, label: "Never" },{ value: 1, label: "Less than monthly" },{ value: 2, label: "Monthly" },{ value: 3, label: "Weekly" },{ value: 4, label: "Daily or almost daily" }] },
      { id: "Q8",  text: "How often in the last year have you been unable to remember what happened the night before because of drinking?",
        options: [{ value: 0, label: "Never" },{ value: 1, label: "Less than monthly" },{ value: 2, label: "Monthly" },{ value: 3, label: "Weekly" },{ value: 4, label: "Daily or almost daily" }] },
      { id: "Q9",  text: "Have you or someone else been injured because of your drinking?",
        options: [{ value: 0, label: "No" },{ value: 2, label: "Yes, but not in the last year" },{ value: 4, label: "Yes, during the last year" }] },
      { id: "Q10", text: "Has a relative, friend, doctor, or other health worker been concerned about your drinking or suggested you cut down?",
        options: [{ value: 0, label: "No" },{ value: 2, label: "Yes, but not in the last year" },{ value: 4, label: "Yes, during the last year" }] },
    ],
    maxScore: 40,
    scoring: [
      { max: 7,  label: "Low Risk",         color: "#10b981", bg: "#ecfdf5", text: "green"  },
      { max: 15, label: "Hazardous Use",     color: "#f59e0b", bg: "#fffbeb", text: "yellow" },
      { max: 19, label: "Harmful Use",       color: "#f97316", bg: "#fff7ed", text: "orange" },
      { max: 40, label: "Likely Dependence", color: "#ef4444", bg: "#fef2f2", text: "red"    },
    ],
  },
};

// Client-side resource map for personalised cards (mirrors backend RESOURCE_MAP)
const RESOURCE_CARDS = {
  "1":  { title: "Understanding Anxiety — NIH",              type: "article", url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",                   emoji: "📖" },
  "2":  { title: "4-7-8 Breathing — Dr. Andrew Weil",        type: "video",   url: "https://www.youtube.com/watch?v=gz4G31LGyog",                                emoji: "🎬" },
  "3":  { title: "How Anxiety Works in the Brain — TED-Ed",  type: "video",   url: "https://www.youtube.com/watch?v=ZidGozDhOjg",                                emoji: "🎬" },
  "4":  { title: "Anxiety CBT Workbook",                     type: "tool",    url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Anxiety",  emoji: "🛠️" },
  "5":  { title: "Guided Meditation — UCLA (10 min)",        type: "audio",   url: "https://www.uclahealth.org/programs/uclamindful/free-guided-meditations/",   emoji: "🎧" },
  "7":  { title: "Social Anxiety: Exposure Therapy Guide",   type: "article", url: "https://www.anxietycanada.com/learn-about-anxiety/social-anxiety/",          emoji: "📖" },
  "8":  { title: "Therapy in a Nutshell — Anxiety Series",   type: "video",   url: "https://www.youtube.com/playlist?list=PL-DP-fXoGlKBgEyBKlQYFLs-RKFD1pTLt", emoji: "🎬" },
  "9":  { title: "DARE Anxiety Response — Free Audio",       type: "audio",   url: "https://www.dareresponse.com/free-audio/",                                   emoji: "🎧" },
  "11": { title: "Andrew Solomon: Depression TED Talk",      type: "video",   url: "https://www.ted.com/talks/andrew_solomon_depression_the_secret_we_share",    emoji: "🎬" },
  "12": { title: "Behavioural Activation Workbook",          type: "tool",    url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Depression",emoji: "🛠️" },
  "13": { title: "Stanford: This Is Depression Podcast",     type: "audio",   url: "https://stanfordhealthcare.org/stanford-health-care-now/2021/depression.html",emoji: "🎧" },
  "15": { title: "Loving-Kindness Meditation",               type: "audio",   url: "https://www.mindful.org/a-five-step-prescription-for-dealing-with-difficult-emotions/", emoji: "🎧" },
  "16": { title: "Exercise vs Antidepressants — BMJ",        type: "article", url: "https://www.bmj.com/content/384/bmj-2023-075847",                            emoji: "📖" },
  "18": { title: "Therapy in a Nutshell — Depression",       type: "video",   url: "https://www.youtube.com/playlist?list=PL-DP-fXoGlKBhv_o0NpaqzQI0F2eUeEfU", emoji: "🎬" },
  "19": { title: "The Science of Stress — APA",              type: "article", url: "https://www.apa.org/topics/stress",                                          emoji: "📖" },
  "20": { title: "Kelly McGonigal: Make Stress Your Friend", type: "video",   url: "https://www.ted.com/talks/kelly_mcgonigal_how_to_make_stress_your_friend",   emoji: "🎬" },
  "22": { title: "Stress Diary — Trigger Tracker",           type: "tool",    url: "https://www.mindtools.com/pages/article/newTCS_01.htm",                      emoji: "🛠️" },
  "23": { title: "WHO Workplace Stress Guidelines",          type: "article", url: "https://www.who.int/news-room/fact-sheets/detail/mental-health-at-work",     emoji: "📖" },
  "24": { title: "Progressive Muscle Relaxation — 15 min",  type: "audio",   url: "https://www.youtube.com/watch?v=ihO02wUzgkc",                                emoji: "🎧" },
  "34": { title: "Mindfulness Changes the Brain — 60 Min",  type: "video",   url: "https://www.youtube.com/watch?v=_DPn57gQAhE",                                emoji: "🎬" },
  "39": { title: "7-Day Mindfulness Programme",              type: "article", url: "https://www.mindful.org/meditation/mindfulness-getting-started/",            emoji: "📖" },
  "40": { title: "MBSR Body Scan — 45 min",                  type: "audio",   url: "https://www.youtube.com/watch?v=u4gZgnmkXNs",                                emoji: "🎧" },
  "41": { title: "Self-Care Wheel Assessment",               type: "tool",    url: "https://www.therapistaid.com/therapy-worksheet/self-care-assessment",        emoji: "🛠️" },
  "42": { title: "Brené Brown: Power of Vulnerability",      type: "video",   url: "https://www.ted.com/talks/brene_brown_the_power_of_vulnerability",           emoji: "🎬" },
  "44": { title: "30 Journaling Prompts for Mental Health",  type: "tool",    url: "https://positivepsychology.com/journaling-for-mental-health/",               emoji: "🛠️" },
  "45": { title: "Digital Detox Plan",                       type: "article", url: "https://www.apa.org/topics/social-media-internet/technology-use-health",     emoji: "📖" },
  "46": { title: "Yoga with Adriene — Mental Health",        type: "video",   url: "https://www.youtube.com/watch?v=COp7BR_Dvps",                                emoji: "🎬" },
  "47": { title: "Gratitude Meditation — 10 min",            type: "audio",   url: "https://www.youtube.com/watch?v=Y8JE14ZQPBA",                                emoji: "🎧" },
  "48": { title: "Crisis Support Guide — NIH",               type: "article", url: "https://www.nimh.nih.gov/health/topics/suicide-prevention",                  emoji: "🆘" },
  "49": { title: "iCall — Free Counselling Helpline",        type: "link",    url: "https://icallhelpline.org",                                                   emoji: "📞" },
};

const TYPE_COLORS = {
  article: { bg: "#eef2ff", color: "#6366f1", label: "Article" },
  video:   { bg: "#fef2f2", color: "#ef4444", label: "Video"   },
  audio:   { bg: "#ecfdf5", color: "#10b981", label: "Audio"   },
  tool:    { bg: "#fffbeb", color: "#f59e0b", label: "Tool"    },
  link:    { bg: "#f0f9ff", color: "#0ea5e9", label: "Link"    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  TINY COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function DoctorWarning({ text, urgency }) {
  if (!text) return null;
  const cfg = urgency >= 4
    ? { border: "border-red-500",    bg: "bg-red-50",    icon: "🆘", titleColor: "text-red-700",    ring: "ring-2 ring-red-400" }
    : urgency >= 3
    ? { border: "border-red-400",    bg: "bg-red-50",    icon: "🚨", titleColor: "text-red-700",    ring: "ring-1 ring-red-300" }
    : urgency >= 2
    ? { border: "border-orange-400", bg: "bg-orange-50", icon: "⚠️", titleColor: "text-orange-700", ring: "" }
    : { border: "border-yellow-400", bg: "bg-yellow-50", icon: "🩺", titleColor: "text-yellow-700", ring: "" };

  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} ${cfg.ring} p-4 mb-4`}>
      <div className={`flex items-center gap-2 mb-1 font-bold text-sm ${cfg.titleColor}`}>
        <span>{cfg.icon}</span> Medical Notice — Please Read
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function CrisisBanner() {
  return (
    <div className="bg-red-600 text-white rounded-xl p-4 mb-4 flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">🆘</span>
      <div>
        <p className="font-bold text-sm mb-1">If you are in immediate danger, please reach out now:</p>
        <div className="flex flex-wrap gap-3">
          <a href="tel:112"          className="text-sm font-black bg-white text-red-700 px-3 py-1 rounded-full hover:bg-red-50">Emergency: 112</a>
          <a href="tel:9152987821"   className="text-sm font-black bg-white text-red-700 px-3 py-1 rounded-full hover:bg-red-50">iCall: 9152987821</a>
          <a href="tel:18602662345"  className="text-sm font-black bg-white text-red-700 px-3 py-1 rounded-full hover:bg-red-50">Vandrevala: 1860-2662-345</a>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color = "#6366f1", height = "h-2.5" }) {
  return (
    <div className={`w-full ${height} bg-gray-200 rounded-full overflow-hidden`}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

function ScoreGauge({ score, maxScore, color, label }) {
  const pct = Math.round((score / maxScore) * 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-gray-900">{score}</span>
          <span className="text-[10px] text-gray-400 font-medium">/{maxScore}</span>
        </div>
      </div>
      <span className="text-xs font-bold mt-1 text-center" style={{ color }}>{label}</span>
    </div>
  );
}

function TrendBadge({ trend, delta }) {
  if (!trend || trend === "first") return null;
  const cfg = {
    improving: { icon: "📈", label: "Improving", cls: "bg-green-100 text-green-700" },
    stable:    { icon: "➡️", label: "Stable",    cls: "bg-gray-100  text-gray-600"  },
    worsening: { icon: "📉", label: "Worsening", cls: "bg-red-100   text-red-700"   },
  }[trend] || { icon: "➡️", label: "—", cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      {cfg.icon} {cfg.label} {delta !== null && delta !== undefined ? `(${delta > 0 ? "+" : ""}${delta} pts)` : ""}
    </span>
  );
}

function GoalCard({ goal, screeningId, token, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [localProgress, setLocalProgress] = useState(goal.progress || 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const completed = localProgress >= 100;
      const res = await fetch(`${API}/screenings/${screeningId}/goals/${goal._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ progress: localProgress, completed }),
      });
      const data = await res.json();
      if (data.success) { onUpdate(goal._id, localProgress, completed); setEditing(false); }
    } catch (e) { /* silent */ }
    finally { setSaving(false); }
  };

  const areaColors = {
    Sleep: "#6366f1", Engagement: "#10b981", Energy: "#f59e0b",
    "Self-Esteem": "#ec4899", Safety: "#ef4444", Grounding: "#0ea5e9",
    Relaxation: "#8b5cf6", "Worry Control": "#f97316", "Stress Awareness": "#f59e0b",
    "Positive Activities": "#10b981", "Professional Support": "#6366f1", default: "#6366f1",
  };
  const color = areaColors[goal.area] || areaColors.default;

  return (
    <div className={`bg-white rounded-xl border p-4 ${goal.completed ? "border-green-300 bg-green-50/30" : "border-gray-200"}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
            {goal.area}
          </span>
          {goal.completed && <span className="ml-2 text-xs font-bold text-green-600">✅ Done</span>}
        </div>
        {!goal.completed && token && (
          <button onClick={() => setEditing(e => !e)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
            {editing ? "Cancel" : "Update"}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-700 mb-3 leading-snug">{goal.description}</p>
      <div className="flex items-center gap-2 mb-1">
        <ProgressBar value={goal.completed ? 100 : localProgress} color={color} />
        <span className="text-xs font-bold text-gray-600 w-8 text-right">
          {goal.completed ? 100 : localProgress}%
        </span>
      </div>
      <p className="text-[11px] text-gray-400">Target: {goal.targetWeeks} week{goal.targetWeeks !== 1 ? "s" : ""}</p>
      {editing && !goal.completed && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <input type="range" min="0" max="100" value={localProgress}
            onChange={e => setLocalProgress(Number(e.target.value))}
            className="w-full accent-indigo-500 mb-2" />
          <button onClick={save} disabled={saving}
            className="w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Saving…" : `Save — ${localProgress}%`}
          </button>
        </div>
      )}
    </div>
  );
}

function MiniTrendChart({ history }) {
  if (!history || history.length < 2) return null;
  const pts = history.slice(0, 8).reverse();
  const maxS = pts[0]?.maxScore || 27;
  const W = 280, H = 80, pad = 12;
  const xStep = (W - pad * 2) / Math.max(pts.length - 1, 1);

  const points = pts.map((p, i) => {
    const x = pad + i * xStep;
    const y = H - pad - ((p.score / maxS) * (H - pad * 2));
    return { x, y, score: p.score, severity: p.severity, date: p.createdAt };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1">
        📈 Score Trend (last {pts.length} assessments)
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={pathD + ` L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`}
          fill="url(#trendGrad)"/>
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2"/>
            <text x={p.x} y={H - 1} textAnchor="middle" fontSize="7" fill="#9ca3af">
              {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESULTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ResultsPage({ result, assessmentType, history, token, navigate }) {
  const cfg = ASSESSMENTS[assessmentType];
  const severityEntry = cfg.scoring.find(s => result.totalScore <= s.max) || cfg.scoring[cfg.scoring.length - 1];
  const urgency = result.urgency ?? 0;
  const isSuicidal = result.flags?.suicidalIdeation;
  const goals = result.sessionPlan?.goals || [];
  const [localGoals, setLocalGoals] = useState(goals);

  const overallProgress = localGoals.length
    ? Math.round(localGoals.reduce((s, g) => s + (g.progress || 0), 0) / localGoals.length)
    : 0;

  const handleGoalUpdate = (goalId, progress, completed) => {
    setLocalGoals(prev => prev.map(g =>
      g._id === goalId ? { ...g, progress, completed } : g
    ));
  };

  const personalizedResources = (result.resultMeta?.resources || []).map(r => ({
    ...r,
    ...RESOURCE_CARDS[r.id || r.resourceId],
    id: r.id || r.resourceId,
  })).filter(r => r.title);

  return (
    <div className="space-y-5">
      {isSuicidal && <CrisisBanner />}

      {result.resultMeta?.doctorWarning && (
        <DoctorWarning text={result.resultMeta.doctorWarning} urgency={urgency} />
      )}

      {/* Score overview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{cfg.icon}</span>
          <h3 className="font-bold text-gray-900">{cfg.label} — {cfg.fullName}</h3>
          <TrendBadge trend={result.trend} delta={result.scoreDelta} />
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <ScoreGauge score={result.totalScore} maxScore={result.maxScore || cfg.maxScore}
            color={severityEntry.color} label={severityEntry.label} />
          <div className="flex-1 min-w-[200px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold mb-3"
              style={{ background: severityEntry.bg, color: severityEntry.color }}>
              {severityEntry.label} {cfg.higherIsBetter ? "Wellbeing" : "Symptoms"}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">{result.resultMeta?.recommended}</p>
            {result.resultMeta?.estimatedRecoveryTime && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                🕐 {result.resultMeta.estimatedRecoveryTime}
              </p>
            )}
          </div>
        </div>
        {history && history.length >= 2 && (
          <div className="mt-4"><MiniTrendChart history={history} /></div>
        )}
      </div>

      {/* Self-care actions */}
      {result.resultMeta?.selfCareActions?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h4 className="font-bold text-gray-900 text-sm mb-3">✅ Do These Today</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.resultMeta.selfCareActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-gray-700 leading-snug">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coping strategies */}
      {result.resultMeta?.copingStrategies?.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
          <h4 className="font-bold text-gray-900 text-sm mb-3">🧠 Evidence-Based Coping Strategies</h4>
          <ul className="space-y-2">
            {result.resultMeta.copingStrategies.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Personalised resources */}
      {personalizedResources.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h4 className="font-bold text-gray-900 text-sm mb-1">📚 Resources Personalised to Your Score</h4>
          <p className="text-xs text-gray-400 mb-4">Curated for {severityEntry.label.toLowerCase()} symptoms</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personalizedResources.map(r => {
              const tc = TYPE_COLORS[r.type] || TYPE_COLORS.article;
              return (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 border border-gray-200 rounded-xl p-3.5 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: tc.bg }}>{r.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:underline leading-snug">{r.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                      {r.reason && <span className="text-[10px] text-gray-400 truncate">{r.reason}</span>}
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-indigo-500 flex-shrink-0 text-sm">↗</span>
                </a>
              );
            })}
          </div>
          <a href="/resources" className="mt-4 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
            Browse all resources →
          </a>
        </div>
      )}

      {/* Session progress plan */}
      {localGoals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-5 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">🎯 Your Recovery Progress Plan</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {result.sessionPlan?.targetWeeks}-week plan · {localGoals.length} personalised goals
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-indigo-600">{overallProgress}%</p>
                <p className="text-xs text-gray-400">overall progress</p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={overallProgress} color="#6366f1" height="h-3" />
            </div>
          </div>
          <div className="p-5">
            {!token && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800 text-center">
                💡 <strong>Log in</strong> to save your goals and track progress over time
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {localGoals.map(goal => (
                <GoalCard key={goal._id} goal={goal}
                  screeningId={result.id} token={token} onUpdate={handleGoalUpdate} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Check-in dates */}
      {result.sessionPlan?.checkInDates?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h4 className="font-bold text-gray-900 text-sm mb-3">🗓️ Recommended Check-In Dates</h4>
          <p className="text-xs text-gray-400 mb-3">Re-take this assessment on these dates to track progress.</p>
          <div className="flex flex-wrap gap-2">
            {result.sessionPlan.checkInDates.map((d, i) => (
              <div key={i} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                <span className="text-indigo-500 font-bold text-xs">Check-in {i + 1}</span>
                <span className="text-indigo-800 text-xs font-semibold">
                  {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-2 border-indigo-200 bg-indigo-50 rounded-xl p-4">
        <p className="text-sm font-bold text-indigo-800 mb-1">🩺 Remember: These results do not replace a clinical diagnosis</p>
        <p className="text-xs text-indigo-700 leading-relaxed">
          This screening is a self-report tool, not a diagnostic test. Only a qualified doctor or clinical psychologist can diagnose a mental health condition.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate("/booking")}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all">
          📅 Book a Counselling Session
        </button>
        <button onClick={() => navigate("/resources")}
          className="flex-1 py-3 bg-white border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-xl font-bold text-sm transition-all">
          📚 Browse All Resources
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  HISTORY PAGE
// ─────────────────────────────────────────────────────────────────────────────
function HistoryPage({ history }) {
  const byType = {};
  for (const s of history) {
    if (!byType[s.type]) byType[s.type] = [];
    byType[s.type].push(s);
  }

  return (
    <div className="space-y-5">
      {Object.entries(byType).map(([type, items]) => {
        const cfg = ASSESSMENTS[type];
        if (!cfg) return null;
        return (
          <div key={type} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span>{cfg.icon}</span>
              <h3 className="font-bold text-gray-900 text-sm">{cfg.label} — {cfg.fullName}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length} assessments</span>
            </div>
            <MiniTrendChart history={items} />
            <div className="p-4">
              <div className="space-y-2">
                {items.map(s => {
                  const sev = cfg.scoring.find(l => s.totalScore <= l.max) || cfg.scoring[cfg.scoring.length - 1];
                  return (
                    <div key={s._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                        style={{ background: sev.color }}>
                        {s.totalScore}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900">{sev.label}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <TrendBadge trend={s.trend} delta={s.scoreDelta} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      {history.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">No previous assessments found.</p>
          <p className="text-xs mt-1">Complete an assessment to see your history here.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  QUESTION SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function QuestionScreen({ assessment, questionIndex, answers, onAnswer, onNext, onBack, submitting, onSubmit }) {
  const q    = assessment.questions[questionIndex];
  const opts = q.options || assessment.options;
  const current = answers[questionIndex];
  const total   = assessment.questions.length;
  const pct     = Math.round((questionIndex / total) * 100);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/70 text-sm">Question {questionIndex + 1} of {total}</span>
          <span className="text-white font-bold text-sm">{pct}%</span>
        </div>
        <ProgressBar value={pct} color={assessment.color} height="h-2" />
        <div className="flex gap-1 mt-2">
          {assessment.questions.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-colors"
              style={{ background: answers[i] !== null && answers[i] !== undefined
                ? assessment.color : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      </div>

      {/* Sensitive question warning */}
      {q.sensitive && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-3">
          <p className="text-red-200 text-xs leading-relaxed">
            🆘 <strong>If you are having thoughts of self-harm right now</strong>, please stop and call{" "}
            <a href="tel:9152987821" className="font-black underline">iCall: 9152987821</a>{" "}
            or{" "}
            <a href="tel:112" className="font-black underline">Emergency: 112</a>.
          </p>
        </div>
      )}

      {/* Question */}
      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
        <p className="text-white/60 text-xs mb-3">{assessment.timeframe}</p>
        <h2 className="text-white text-lg font-semibold leading-relaxed mb-6">{q.text}</h2>
        <div className="space-y-2.5">
          {opts.map(opt => (
            <button key={opt.value}
              onClick={() => onAnswer(questionIndex, opt.value)}
              className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                current === opt.value
                  ? "border-white/60 bg-white/20 shadow-lg scale-[1.01]"
                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
              }`}>
              <span className="text-2xl flex-shrink-0">{opt.emoji || "●"}</span>
              <div className="flex-1">
                <span className="font-medium text-white text-sm">{opt.label}</span>
                {opt.value !== undefined && (
                  <span className="block text-white/40 text-xs">Score: {opt.value}</span>
                )}
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                current === opt.value ? "border-white bg-white/30" : "border-white/30"
              }`}>
                {current === opt.value && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>
        {(questionIndex + 1) % 3 === 0 && questionIndex > 0 && (
          <p className="text-white/30 text-[11px] text-center mt-4">
            🩺 Reminder: If your symptoms are impacting daily life, please consider speaking to a doctor.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={onBack} disabled={questionIndex === 0}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border ${
            questionIndex === 0
              ? "opacity-30 cursor-not-allowed border-white/10 bg-white/5 text-white/40"
              : "border-white/20 bg-white/10 text-white hover:bg-white/20"
          }`}>
          ← Back
        </button>
        {questionIndex < total - 1 ? (
          <button onClick={onNext} disabled={current === null || current === undefined}
            className={`flex-[2] py-3 rounded-xl font-bold text-sm transition-all ${
              current === null || current === undefined
                ? "opacity-40 cursor-not-allowed bg-gray-600 text-gray-300"
                : "bg-white text-gray-900 hover:bg-white/90 shadow-lg"
            }`}>
            Next →
          </button>
        ) : (
          <button onClick={onSubmit} disabled={current === null || current === undefined || submitting}
            className={`flex-[2] py-3 rounded-xl font-bold text-sm transition-all ${
              current === null || current === undefined || submitting
                ? "opacity-40 cursor-not-allowed bg-gray-600 text-gray-300"
                : "bg-green-500 text-white hover:bg-green-600 shadow-lg"
            }`}>
            {submitting ? "Analysing…" : "Complete & See Results ✓"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Screening() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [screen,      setScreen]      = useState("welcome");
  const [activeType,  setActiveType]  = useState("PHQ9");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [result,      setResult]      = useState(null);
  const [history,     setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const assessment = ASSESSMENTS[activeType];

  useEffect(() => {
    if (!token) return;
    setHistLoading(true);
    fetch(`${API}/screenings/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setHistory(d.data.screenings || []); })
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [token, result]);

  const currentAnswers = useMemo(
    () => assessment.questions.map((_, i) => answers[`${activeType}_${i}`] ?? null),
    [answers, activeType, assessment]
  );

  const setAnswer = (idx, value) => {
    setAnswers(prev => ({ ...prev, [`${activeType}_${idx}`]: value }));
  };

  const startTest = (type) => {
    setActiveType(type);
    setQuestionIdx(0);
    setResult(null);
    setScreen("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (currentAnswers.some(a => a === null)) return;
    setSubmitting(true);

    const payload = assessment.questions.map((q, i) => {
      let score = currentAnswers[i];
      if (assessment.id === "PSS10" && q.reverse) score = 4 - score;
      return { questionId: q.id, score };
    });

    try {
      const res = await fetch(`${API}/screenings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: activeType, answers: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setScreen("result");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      const total = payload.reduce((s, a) => s + a.score, 0);
      const sev = assessment.scoring.find(s => total <= s.max) || assessment.scoring[assessment.scoring.length - 1];
      setResult({
        totalScore: total, maxScore: assessment.maxScore, severity: sev.label, urgency: 0,
        color: sev.color, flags: {}, trend: "first", scoreDelta: null,
        resultMeta: { recommended: "Results computed offline. Log in to save your results.", selfCareActions: [], copingStrategies: [], resources: [] },
        sessionPlan: { goals: [], checkInDates: [] },
      });
      setScreen("result");
    } finally {
      setSubmitting(false);
    }
  };

  const historyForType = history.filter(s => s.type === activeType);

  // ── WELCOME ────────────────────────────────────────────────────────────────
  if (screen === "welcome") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-2xl">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Mental Health Screening</h1>
          <p className="text-white/60 max-w-lg mx-auto text-sm leading-relaxed">
            Five clinically validated assessments to understand your mental wellbeing.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 py-2">
            <span className="text-amber-300 text-sm">⚕️</span>
            <span className="text-amber-200 text-xs font-medium">
              These tools do not replace a clinical diagnosis. Always consult a doctor if concerned.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {Object.values(ASSESSMENTS).map(a => (
            <button key={a.id} onClick={() => startTest(a.id)}
              className="text-left bg-white/10 backdrop-blur border border-white/20 hover:border-white/40 hover:bg-white/15 rounded-2xl p-5 transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{a.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{a.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: a.color + "30", color: a.color }}>
                      {a.duration}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs mt-0.5">{a.fullName}</p>
                </div>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">{a.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                {/* FIX: use a.questions.length (the array) — no more .questionCount needed here */}
                <span className="text-white/40 text-xs">{a.questions.length} questions</span>
                <span className="text-xs font-semibold group-hover:translate-x-1 transition-transform"
                  style={{ color: a.color }}>
                  Start →
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {token && (
            <button onClick={() => setScreen("history")}
              className="flex-1 py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-all">
              📊 View My History
            </button>
          )}
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
            <p className="text-white/40 text-xs">
              🔒 Completely confidential · Results saved securely · Supports trend tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── TEST ───────────────────────────────────────────────────────────────────
  if (screen === "test") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <button onClick={() => setScreen("welcome")}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
            ← Back
          </button>
          <div className="flex gap-2 flex-wrap">
            {Object.values(ASSESSMENTS).map(a => (
              <button key={a.id} onClick={() => { setActiveType(a.id); setQuestionIdx(0); }}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${
                  activeType === a.id
                    ? "text-white border-transparent"
                    : "border-white/20 text-white/40 hover:text-white/60"
                }`}
                style={activeType === a.id ? { background: a.color } : {}}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{assessment.icon}</span>
          <div>
            <h2 className="text-white font-bold text-lg">{assessment.label} — {assessment.fullName}</h2>
            <p className="text-white/50 text-xs">{assessment.description}</p>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-2 mb-5 flex items-center gap-2">
          <span className="text-red-400 text-xs">🆘 Crisis line:</span>
          <a href="tel:9152987821" className="text-red-300 font-bold text-xs hover:text-red-200">iCall: 9152987821</a>
          <span className="text-red-600 text-xs">·</span>
          <a href="tel:112" className="text-red-300 font-bold text-xs hover:text-red-200">Emergency: 112</a>
        </div>

        <QuestionScreen
          assessment={assessment}
          questionIndex={questionIdx}
          answers={currentAnswers}
          onAnswer={setAnswer}
          onNext={() => setQuestionIdx(i => i + 1)}
          onBack={() => setQuestionIdx(i => i - 1)}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (screen === "result" && result) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <button onClick={() => setScreen("welcome")} className="text-white/60 hover:text-white text-sm">← Back</button>
          <div className="flex gap-2">
            <button onClick={() => setScreen("history")} className="text-white/60 hover:text-white text-xs border border-white/20 px-3 py-1.5 rounded-lg">📊 History</button>
            <button onClick={() => startTest(activeType)} className="text-white/60 hover:text-white text-xs border border-white/20 px-3 py-1.5 rounded-lg">🔄 Retake</button>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{assessment.icon}</span>
          <div>
            <h2 className="text-white font-bold text-lg">Your Results</h2>
            <p className="text-white/50 text-xs">{assessment.label} — {assessment.fullName}</p>
          </div>
        </div>
        <ResultsPage result={result} assessmentType={activeType}
          history={historyForType} token={token} navigate={navigate} />
      </div>
    </div>
  );

  // ── HISTORY ────────────────────────────────────────────────────────────────
  if (screen === "history") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <button onClick={() => setScreen("welcome")} className="text-white/60 hover:text-white text-sm">← Back</button>
          <h2 className="text-white font-bold">My Screening History</h2>
          <button onClick={() => startTest("PHQ9")} className="text-white/60 hover:text-white text-xs border border-white/20 px-3 py-1.5 rounded-lg">+ New</button>
        </div>
        {histLoading
          ? <div className="text-center py-16 text-white/40">Loading history…</div>
          : <HistoryPage history={history} assessmentType={activeType} />
        }
      </div>
    </div>
  );

  return null;
}

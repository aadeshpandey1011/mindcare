import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Hero from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import {
  MessageCircle, Calendar, BookOpen, Users,
  UserPlus, Heart, ArrowRight, ShieldCheck,
  BookMarked, TrendingUp,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const MOOD_EMOJIS = { 1:"😞", 2:"😔", 3:"😐", 4:"🙂", 5:"😊" };
const MOOD_LABELS = { 1:"Awful", 2:"Bad", 3:"Okay", 4:"Good", 5:"Great" };
const MOOD_COLORS = {
  1: "from-red-500 to-red-400",
  2: "from-orange-500 to-orange-400",
  3: "from-yellow-500 to-yellow-400",
  4: "from-green-500 to-green-400",
  5: "from-emerald-500 to-teal-400",
};

// ── Mood check-in card embedded in home screen ─────────────────────────────
function MoodCheckInCard({ token }) {
  const [todayMood, setTodayMood] = useState(null);
  const [saved,     setSaved]     = useState(false);
  const [loading,   setLoading]   = useState(false);

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

  const logMood = async (value) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/wellness/mood`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ mood: value }),
      });
      const data = await res.json();
      if (data.success) { setTodayMood(value); setSaved(true); }
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  };

  if (saved && todayMood) {
    return (
      <div className={`bg-gradient-to-r ${MOOD_COLORS[todayMood]} rounded-2xl p-5 text-white`}>
        <p className="text-xs font-bold opacity-75 uppercase tracking-wider mb-1">Today's Mood</p>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{MOOD_EMOJIS[todayMood]}</span>
          <div>
            <p className="text-xl font-black">{MOOD_LABELS[todayMood]}</p>
            <p className="text-white/70 text-xs">Logged today · Come back tomorrow</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-100 p-5 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        💭 How are you feeling today?
      </p>
      <div className="flex justify-between">
        {[1,2,3,4,5].map(m => (
          <button key={m} onClick={() => logMood(m)} disabled={loading}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-indigo-50 transition-all group">
            <span className="text-3xl group-hover:scale-125 transition-transform">{MOOD_EMOJIS[m]}</span>
            <span className="text-[10px] text-gray-400">{MOOD_LABELS[m]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, token } = useAuth();

  const [bannerDismissed, setBannerDismissed] = React.useState(
    () => sessionStorage.getItem("verifyBannerDismissed") === "true"
  );

  const dismissBanner = () => {
    sessionStorage.setItem("verifyBannerDismissed", "true");
    setBannerDismissed(true);
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Verify Identity Banner ── */}
      {user && !bannerDismissed && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-amber-600 flex-shrink-0" size={20} />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Verify your identity</span> — add your phone number and government ID to get a verified badge on your profile.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to="/verify-identity"
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
              Verify Now
            </Link>
            <button onClick={dismissBanner} className="text-amber-500 hover:text-amber-700 text-lg leading-none" title="Dismiss">×</button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <motion.section
        className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white py-16"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1 }}>
            <h1 className="text-5xl font-extrabold leading-tight">Your Mental Wellness Companion</h1>
            <p className="mt-4 text-lg">Confidential, stigma-free, and student-focused mental health support at your fingertips.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/screening"
                className="px-6 py-3 border border-white rounded-lg hover:bg-white hover:text-purple-600 hover:scale-105 transform transition duration-300 font-medium">
                Take Screening
              </Link>
              <Link to="/chat"
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg hover:scale-105 transform transition duration-300 font-medium flex items-center gap-2">
                <MessageCircle size={16}/> Chat with Mia
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="bg-white rounded-lg shadow-inner flex items-center justify-center overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }}>
            <img src={Hero} alt="Mental wellness hero"
              className="transition-transform transform hover:scale-110 duration-500" />
          </motion.div>
        </div>
      </motion.section>

      {/* ── Daily mood check-in (logged-in users) ── */}
      {user && token && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 py-6">
          <div className="max-w-3xl mx-auto px-6">
            <MoodCheckInCard token={token} />
          </div>
        </div>
      )}

      {/* ── Features ── */}
      <motion.section className="bg-gradient-to-r from-indigo-100 to-purple-100 py-16"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-10 text-gray-800">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            <FeatureCard icon={<MessageCircle size={32} className="text-white"/>} title="AI Support" desc="Talk to Mia anytime, 24/7." link="/chat" gradient="from-blue-500 to-blue-400"/>
            <FeatureCard icon={<Calendar size={32} className="text-white"/>} title="Book Sessions" desc="Book private counsellor sessions." link="/booking" gradient="from-purple-500 to-purple-400"/>
            <FeatureCard icon={<BookOpen size={32} className="text-white"/>} title="Resources" desc="Videos, articles, and guided audio." link="/resources" gradient="from-green-500 to-green-400"/>
            <FeatureCard icon={<BookMarked size={32} className="text-white"/>} title="Journal" desc="Your private mental health journal." link="/journal" gradient="from-pink-500 to-rose-400"/>
            <FeatureCard icon={<Users size={32} className="text-white"/>} title="Peer Forum" desc="Anonymous peer support community." link="/forum" gradient="from-orange-500 to-orange-400"/>
          </div>
        </div>
      </motion.section>

      {/* ── How It Works ── */}
      <motion.section className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 py-16"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <StepCard icon={<UserPlus size={36} className="text-white"/>}    title="1. Sign Up"       desc="Create a confidential account in 60 seconds." gradient="from-blue-500 to-blue-400"/>
            <StepCard icon={<TrendingUp size={36} className="text-white"/>}  title="2. Assess"        desc="Take a 3-minute mental health screening."      gradient="from-purple-500 to-purple-400"/>
            <StepCard icon={<MessageCircle size={36} className="text-white"/>}title="3. Get Support"  desc="Chat with Mia or book a human counsellor."     gradient="from-green-500 to-green-400"/>
            <StepCard icon={<Heart size={36} className="text-white"/>}        title="4. Stay Well"     desc="Track progress and use daily resources."       gradient="from-red-500 to-red-400"/>
          </div>
        </div>
      </motion.section>

      {/* ── Testimonials ── */}
      <motion.section className="bg-gradient-to-r from-purple-100 via-indigo-100 to-purple-100 py-16"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">What Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestimonialCard name="Anonymous Student" text="This platform gave me a safe space to express myself and get real help. The AI chat was surprisingly thoughtful." />
            <TestimonialCard name="Another User"      text="Booking sessions was super easy and private. The counsellor was amazing and I felt heard." />
          </div>
        </div>
      </motion.section>

      {/* ── Trust badges ── */}
      <div className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Built on clinical standards</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> PHQ-9 &amp; GAD-7 validated screening</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> CBT-based AI support</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> End-to-end encrypted data</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> No ads, never sold</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> 24/7 crisis resources</div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold mb-3">MindCare</h3>
            <p className="text-gray-400 text-sm">Your confidential mental wellness companion. Always here for you.</p>
            <p className="text-gray-500 text-xs mt-3">No ads · No data selling · Always confidential</p>
          </div>
          <div>
            <h4 className="font-semibold text-base mb-3">Features</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li><Link to="/chat"       className="hover:text-purple-400 transition-colors">AI Chat Support</Link></li>
              <li><Link to="/screening"  className="hover:text-purple-400 transition-colors">Screening Tests</Link></li>
              <li><Link to="/resources"  className="hover:text-purple-400 transition-colors">Resource Library</Link></li>
              <li><Link to="/journal"    className="hover:text-purple-400 transition-colors">Private Journal</Link></li>
              <li><Link to="/forum"      className="hover:text-purple-400 transition-colors">Peer Forum</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-base mb-3">Crisis Support</h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li className="flex items-center gap-2"><span className="text-red-400">📞</span> iCall: 9152987821</li>
              <li className="flex items-center gap-2"><span className="text-red-400">📞</span> Vandrevala: 1860-2662-345</li>
              <li className="flex items-center gap-2"><span className="text-red-400">📞</span> Emergency: 112</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-base mb-3">Legal</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li><Link to="/privacy"        className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/verify-identity" className="hover:text-purple-400 transition-colors">Verify Identity</Link></li>
            </ul>
            <div className="flex justify-center md:justify-start space-x-3 mt-4">
              <a href="#" className="hover:text-purple-400 transition-colors text-xl">🌐</a>
              <a href="#" className="hover:text-purple-400 transition-colors text-xl">🐦</a>
              <a href="#" className="hover:text-purple-400 transition-colors text-xl">📸</a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-500 text-xs">
          © 2026 MindCare. All rights reserved. · This platform does not replace professional medical advice.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, link, gradient }) {
  return (
    <motion.div className={`p-5 rounded-xl shadow-lg flex flex-col items-center bg-gradient-to-r ${gradient} text-white hover:scale-105 transition-transform duration-300`}
      whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
      <Link to={link} className="flex flex-col items-center">
        <div className="mb-3">{icon}</div>
        <h4 className="text-base font-bold">{title}</h4>
        <p className="text-white/80 text-xs mt-1.5 text-center">{desc}</p>
      </Link>
    </motion.div>
  );
}

function StepCard({ icon, title, desc, gradient }) {
  return (
    <motion.div className={`p-6 rounded-xl shadow-md flex flex-col items-center bg-gradient-to-r ${gradient} text-white hover:scale-105 transition-transform duration-300`}
      whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
      <div className="mb-3">{icon}</div>
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="text-white/80 text-xs mt-1.5 text-center">{desc}</p>
    </motion.div>
  );
}

function TestimonialCard({ name, text }) {
  return (
    <motion.div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow duration-300"
      whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
      <blockquote className="italic text-gray-700 text-sm leading-relaxed">"{text}"</blockquote>
      <p className="mt-4 text-xs text-gray-500 text-right">— {name}</p>
    </motion.div>
  );
}

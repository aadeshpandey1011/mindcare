import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import Hero from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import {
  MessageCircle,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  Heart,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  // Check if user has NOT verified identity yet
  // We don't have govtId.isVerified in the JWT, so we show the banner
  // unless user has dismissed it (stored in sessionStorage)
  const [bannerDismissed, setBannerDismissed] = React.useState(
    () => sessionStorage.getItem("verifyBannerDismissed") === "true"
  );

  const dismissBanner = () => {
    sessionStorage.setItem("verifyBannerDismissed", "true");
    setBannerDismissed(true);
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Verify Identity Banner (shown to all logged-in users who haven't dismissed) ── */}
      {user && !bannerDismissed && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-amber-600 flex-shrink-0" size={20} />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Verify your identity</span> — add your phone number and government ID to get a verified badge on your profile.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/verify-identity"
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Verify Now
            </Link>
            <button
              onClick={dismissBanner}
              className="text-amber-500 hover:text-amber-700 text-lg leading-none"
              title="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <motion.section
        className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-5xl font-extrabold leading-tight">
              Your Mental Wellness Companion
            </h1>
            <p className="mt-4 text-lg">
              Confidential, stigma-free, and student-focused mental health support at your fingertips.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link
                to="/screening"
                className="px-6 py-3 border border-white rounded-lg hover:bg-white hover:text-purple-600 hover:scale-105 transform transition duration-500"
              >
                Take Screening
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow-inner flex items-center justify-center overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <img
              src={Hero}
              alt="Mental wellness hero"
              className="transition-transform transform hover:scale-110 duration-500"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="bg-gradient-to-r from-indigo-100 to-purple-100 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-10 text-gray-800">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FeatureCard
              icon={<MessageCircle size={36} className="text-white" />}
              title="AI Chat Support"
              desc="Get immediate, confidential mental health guidance."
              link="/chat"
              gradient="from-blue-500 to-blue-400"
            />
            <FeatureCard
              icon={<Calendar size={36} className="text-white" />}
              title="Confidential Booking"
              desc="Book private sessions with qualified counselors."
              link="/booking"
              gradient="from-purple-500 to-purple-400"
            />
            <FeatureCard
              icon={<BookOpen size={36} className="text-white" />}
              title="Resource Hub"
              desc="Learn coping strategies and mental wellness tips."
              link="/resources"
              gradient="from-green-500 to-green-400"
            />
            <FeatureCard
              icon={<Users size={36} className="text-white" />}
              title="Peer Forum"
              desc="Connect anonymously with peers in a safe space."
              link="/forum"
              gradient="from-orange-500 to-orange-400"
            />
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <StepCard icon={<UserPlus size={40} className="text-white" />} title="Sign Up" desc="Create an account securely to get started." gradient="from-blue-500 to-blue-400" />
            <StepCard icon={<MessageCircle size={40} className="text-white" />} title="Get Support" desc="Use AI chat or book a session with a counselor." gradient="from-green-500 to-green-400" />
            <StepCard icon={<Heart size={40} className="text-white" />} title="Stay Well" desc="Access resources to maintain mental wellness." gradient="from-red-500 to-red-400" />
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section
        className="bg-gradient-to-r from-purple-100 via-indigo-100 to-purple-100 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">What Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestimonialCard name="Anonymous Student" text="This platform gave me a safe space to express myself and get real help." />
            <TestimonialCard name="Another User" text="Booking sessions was super easy and private. Loved the experience!" />
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white py-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold mb-4">MindCare</h3>
            <p className="text-gray-400">Your companion for mental wellness and support, always there for you.</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-purple-400 transition-colors duration-300">Home</Link></li>
              <li><Link to="/resources" className="hover:text-purple-400 transition-colors duration-300">Resources</Link></li>
              <li><Link to="/forum" className="hover:text-purple-400 transition-colors duration-300">Forum</Link></li>
              <li><Link to="/verify-identity" className="hover:text-purple-400 transition-colors duration-300">Verify Identity</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">Follow Us</h4>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="#" className="hover:text-purple-400 transition-colors duration-300 text-2xl">🌐</a>
              <a href="#" className="hover:text-purple-400 transition-colors duration-300 text-2xl">🐦</a>
              <a href="#" className="hover:text-purple-400 transition-colors duration-300 text-2xl">📸</a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-gray-700 pt-4 text-center text-gray-500">
          © 2025 MindCare. All rights reserved.
        </div>
      </motion.footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, link, gradient }) {
  return (
    <motion.div
      className={`p-6 rounded-lg shadow-lg flex flex-col items-center transition-transform transform hover:scale-105 hover:shadow-2xl duration-500 bg-gradient-to-r ${gradient} text-white`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link to={link} className="flex flex-col items-center">
        <div className="mb-4">{icon}</div>
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="text-white text-sm mt-2 text-center">{desc}</p>
      </Link>
    </motion.div>
  );
}

function StepCard({ icon, title, desc, gradient }) {
  return (
    <motion.div
      className={`p-6 rounded-lg shadow-md flex flex-col items-center transition-transform transform hover:scale-105 hover:shadow-xl duration-500 bg-gradient-to-r ${gradient} text-white`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="mb-4">{icon}</div>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-white text-sm mt-2 text-center">{desc}</p>
    </motion.div>
  );
}

function TestimonialCard({ name, text }) {
  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow transition-transform transform hover:scale-105 hover:shadow-lg duration-500"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <blockquote className="italic text-gray-700">"{text}"</blockquote>
      <p className="mt-4 text-sm text-gray-500 text-right">— {name}</p>
    </motion.div>
  );
}

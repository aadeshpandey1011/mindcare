import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../assets/hero.png";
import {
  MessageCircle,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  Heart,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left Side: Text */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Your Mental Wellness Companion
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Confidential, stigma-free, and student-focused mental health
              support at your fingertips.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link
                to="/signup"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 flex items-center"
              >
                Get Started <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link
                to="/screening"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Take Screening
              </Link>
            </div>
          </div>

          {/* Right Side: Hero Image Placeholder */}
          <div className="bg-gray-200 rounded-lg h-72 md:h-96 shadow-inner flex items-center justify-center">
            <span  className="text-gray-500"><img src={Hero} alt="" srcset="" /></span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-10">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FeatureCard
              icon={<MessageCircle size={36} className="text-blue-600" />}
              title="AI Chat Support"
              desc="Get immediate, confidential mental health guidance."
              link="/chat"
            />
            <FeatureCard
              icon={<Calendar size={36} className="text-purple-600" />}
              title="Confidential Booking"
              desc="Book private sessions with qualified counselors."
              link="/booking"
            />
            <FeatureCard
              icon={<BookOpen size={36} className="text-green-600" />}
              title="Resource Hub"
              desc="Learn coping strategies and mental wellness tips."
              link="/resources"
            />
            <FeatureCard
              icon={<Users size={36} className="text-orange-600" />}
              title="Peer Forum"
              desc="Connect anonymously with peers in a safe space."
              link="/forum"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <StepCard
              icon={<UserPlus size={40} className="text-blue-600" />}
              title="Sign Up"
              desc="Create an account securely to get started."
            />
            <StepCard
              icon={<MessageCircle size={40} className="text-green-600" />}
              title="Get Support"
              desc="Use AI chat or book a session with a counselor."
            />
            <StepCard
              icon={<Heart size={40} className="text-red-500" />}
              title="Stay Well"
              desc="Access resources to maintain mental wellness."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">
            What Students Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestimonialCard
              name="Anonymous Student"
              text="This platform gave me a safe space to express myself and get real help."
            />
            <TestimonialCard
              name="Another User"
              text="Booking sessions was super easy and private. Loved the experience!"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

/* -------- Reusable Components -------- */

function FeatureCard({ icon, title, desc, link }) {
  return (
    <Link
      to={link}
      className="bg-gray-50 hover:bg-gray-100 p-6 rounded-lg shadow flex flex-col items-center transition"
    >
      <div className="mb-4">{icon}</div>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-gray-600 text-sm mt-2">{desc}</p>
    </Link>
  );
}

function StepCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
      <div className="mb-4">{icon}</div>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-gray-600 text-sm mt-2">{desc}</p>
    </div>
  );
}

function TestimonialCard({ name, text }) {
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow">
      <blockquote className="italic text-gray-700">"{text}"</blockquote>
      <p className="mt-4 text-sm text-gray-500">— {name}</p>
    </div>
  );
}

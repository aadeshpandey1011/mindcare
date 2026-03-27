import React, { useState, useEffect } from "react";
import Navbar       from "./Navbar";
import MoodWidget   from "./MoodWidget";
import AccountAssistant from "./AccountAssistant";
import OnboardingModal from "./OnboardingModal";
import { Outlet }   from "react-router-dom";
import { useAuth }  from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const Layout = () => {
  const { user, token } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding has been completed
  useEffect(() => {
    if (!token || !user) return;
    // Only students see onboarding
    if (user.role !== "student") return;

    fetch(`${API}/wellness/onboarding`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        // Show modal if no onboarding record exists or it's not completed
        if (!d.data || !d.data.completed) {
          // Delay slightly so the page renders first
          setTimeout(() => setShowOnboarding(true), 800);
        }
      })
      .catch(() => {});
  }, [token, user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      <Navbar />
      <div>
        <Outlet />
      </div>

      {/* Floating mood check-in widget — all authenticated users */}
      <MoodWidget />

      {/* Floating AI account assistant — all authenticated users */}
      <AccountAssistant />

      {/* First-time onboarding modal — students only */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </>
  );
};

export default Layout;

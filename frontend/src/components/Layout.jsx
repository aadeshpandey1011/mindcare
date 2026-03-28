import React, { useState, useEffect } from "react";
import Navbar       from "./Navbar";
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
    if (user.role !== "student") return;

    fetch(`${API}/wellness/onboarding`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.data || !d.data.completed) {
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

      {/* First-time onboarding modal — students only */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </>
  );
};

export default Layout;

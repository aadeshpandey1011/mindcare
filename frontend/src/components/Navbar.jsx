import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { user, logout, loading, authChecked } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { name: "AI Chat Support",   path: "/chat" },
    { name: "Screening Test",    path: "/screening" },
    { name: "Book Appointment",  path: "/booking" },
    { name: "Resources",         path: "/resources" },
    { name: "Peer Forum",        path: "/forum" },
  ];

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    localStorage.clear();
    navigate("/");
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin:      "bg-red-100 text-red-800 border-red-200",
      counsellor: "bg-green-100 text-green-800 border-green-200",
      student:    "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getUserInitials = (u) => {
    if (!u?.fullName) return "U";
    const parts = u.fullName.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : u.fullName[0].toUpperCase();
  };

  const AvatarCircle = ({ size = "w-10 h-10" }) => {
    const [err, setErr] = useState(false);
    if (user?.avatar && !err) {
      return (
        <img
          src={user.avatar}
          alt={user.fullName}
          className={`${size} rounded-full object-cover border-2 border-indigo-200 shadow-sm`}
          onError={() => setErr(true)}
        />
      );
    }
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-2 border-indigo-200 shadow-sm`}>
        <span className="text-white font-semibold text-sm">{getUserInitials(user)}</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 shadow-md bg-gradient-to-r from-white via-blue-50 to-blue-100 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-indigo-700 hover:text-indigo-800 transition-colors">
          MindCare
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex space-x-6 font-medium">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`transition-colors duration-200 pb-1 border-b-2 ${
                isActive(item.path)
                  ? "border-indigo-600 text-indigo-700 font-semibold"
                  : "border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-500"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {loading || !authChecked ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="hidden lg:block">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/70 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <div className="relative">
                  <AvatarCircle />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">

                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <AvatarCircle size="w-12 h-12" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                          {user.isApproved === false && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Pending Approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">

                    {/* Profile */}
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate("/profile"); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>

                    {/* ── Verify Identity ── shown to all logged-in users */}
                    <Link
                      to="/verify-identity"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="flex-1">Verify Identity</span>
                      {/* Orange dot if not yet verified */}
                      <span className="w-2 h-2 rounded-full bg-orange-400 ml-auto" title="Not verified yet" />
                    </Link>

                    {/* Admin panel — admin only */}
                    {user.role === "admin" && (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}

                    {/* Counsellor dashboard — counsellor only */}
                    {user.role === "counsellor" && (
                      <Link
                        to="/counsellorDashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        My Sessions
                      </Link>
                    )}

                    <hr className="my-1 border-gray-100" />

                    {/* Sign out */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                Login
              </Link>
              <Link to="/signup" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

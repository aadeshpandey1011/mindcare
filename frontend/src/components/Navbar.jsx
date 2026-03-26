import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { user, logout, loading, authChecked } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Role-aware nav items ─────────────────────────────────────────────────
  const studentNav = [
    { name: "AI Chat",          path: "/chat"       },
    { name: "Screening",        path: "/screening"  },
    { name: "Book Session",     path: "/booking"    },
    { name: "Journal",          path: "/journal"    },
    { name: "Resources",        path: "/resources"  },
    { name: "Forum",            path: "/forum"      },
  ];

  const counsellorNav = [
    { name: "My Sessions",     path: "/counsellorDashboard" },
    { name: "Journal",         path: "/journal"             },
    { name: "Resources",       path: "/resources"           },
    { name: "Forum",           path: "/forum"               },
    { name: "Settings & Ads",  path: "/counsellor-settings" },
  ];

  const adminNav = [
    { name: "Dashboard",       path: "/dashboard"           },
    { name: "All Users",       path: "/admin/users"         },
    { name: "Payment Logs",    path: "/admin/payments"      },
    { name: "Payouts",         path: "/admin/payouts"       },
    { name: "Peer Forum",      path: "/forum"               },
  ];

  const navItems =
    user?.role === "admin"      ? adminNav     :
    user?.role === "counsellor" ? counsellorNav :
    studentNav;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

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

  const getRoleBadgeColor = (role) => ({
    admin:      "bg-red-100 text-red-800 border-red-200",
    counsellor: "bg-green-100 text-green-800 border-green-200",
    student:    "bg-blue-100 text-blue-800 border-blue-200",
  }[role] || "bg-gray-100 text-gray-800 border-gray-200");

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
        <img src={user.avatar} alt={user.fullName}
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
        <Link to={user?.role === "admin" ? "/dashboard" : user?.role === "counsellor" ? "/counsellorDashboard" : "/newhome"}
          className={`text-2xl font-extrabold tracking-tight transition-colors ${user?.role === "admin" ? "text-red-600 hover:text-red-700" : "text-indigo-700 hover:text-indigo-800"}`}>
          MindCare
          {user?.role === "admin" && <span className="ml-1 text-xs font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md align-middle">ADMIN</span>}
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex space-x-5 font-medium">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path}
              className={`transition-colors duration-200 pb-1 border-b-2 text-sm ${
                isActive(item.path)
                  ? "border-indigo-600 text-indigo-700 font-semibold"
                  : "border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-500"
              }`}>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {loading || !authChecked ? (
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/70 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <div className="relative">
                  <AvatarCircle />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <AvatarCircle size="w-12 h-12" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {user.role === "admin" && (
                      <>
                        <DropItem icon="dashboard" label="Admin Dashboard"   to="/dashboard"      onClose={() => setIsDropdownOpen(false)} />
                        <DropItem icon="users"     label="All Users"          to="/admin/users"    onClose={() => setIsDropdownOpen(false)} />
                        <DropItem icon="payment"   label="Payment Logs"       to="/admin/payments" onClose={() => setIsDropdownOpen(false)} />
                        <DropItem icon="payment"   label="Counsellor Payouts" to="/admin/payouts"  onClose={() => setIsDropdownOpen(false)} />
                        <hr className="my-1 border-gray-100" />
                      </>
                    )}
                    {user.role === "counsellor" && (
                      <>
                        <DropItem icon="sessions"  label="My Sessions"        to="/counsellorDashboard" onClose={() => setIsDropdownOpen(false)} />
                        <DropItem icon="journal"   label="My Journal"         to="/journal"             onClose={() => setIsDropdownOpen(false)} />
                        <DropItem icon="settings"  label="Settings & Ads"     to="/counsellor-settings" onClose={() => setIsDropdownOpen(false)} />
                        <DropItem icon="payment"   label="Payment History"    to="/my-payments"         onClose={() => setIsDropdownOpen(false)} />
                        <hr className="my-1 border-gray-100" />
                      </>
                    )}
                    {user.role === "student" && (
                      <>
                        <DropItem icon="bookings"  label="My Bookings"        to="/all-bookings"   onClose={() => setIsDropdownOpen(false)} />
                        <DropItem icon="journal"   label="My Journal"         to="/journal"        onClose={() => setIsDropdownOpen(false)} />
                        <DropItem icon="payment"   label="Payment History"    to="/my-payments"    onClose={() => setIsDropdownOpen(false)} />
                        <hr className="my-1 border-gray-100" />
                      </>
                    )}
                    <DropItem icon="profile"   label="View Profile"       to="/profile"          onClose={() => setIsDropdownOpen(false)} />
                    <DropItem icon="verify"    label="Verify Identity"    to="/verify-identity"  onClose={() => setIsDropdownOpen(false)} dot="orange" />
                    <DropItem icon="privacy"   label="Privacy Policy"     to="/privacy"          onClose={() => setIsDropdownOpen(false)} />
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <SignOutIcon /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login"  className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Login</Link>
              <Link to="/signup" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DropItem({ icon, label, to, onClose, dot }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => { onClose(); navigate(to); }}
      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
      <DropIcon name={icon} />
      <span className="flex-1">{label}</span>
      {dot && <span className={`w-2 h-2 rounded-full bg-${dot}-400 ml-auto`} />}
    </button>
  );
}

function DropIcon({ name }) {
  const cls = "w-4 h-4 mr-3 text-gray-400";
  const icons = {
    profile:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    verify:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/><rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></>,
    users:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    payment:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    bookings:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    sessions:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    settings:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    journal:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    privacy:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    forum:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />,
  };
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icons[name] || null}
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

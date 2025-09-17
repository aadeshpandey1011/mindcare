// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { useState, useRef, useEffect } from "react";

// export default function Navbar() {
//   const { user, logout, loading } = useAuth(); // Add loading from context
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   const navItems = [
//     { name: "AI Chat Support", path: "/chat" },
//     { name: "Screening Test", path: "/screening" },
//     { name: "Book Appointment", path: "/booking" },
//     { name: "Resources", path: "/resources" },
//     { name: "Peer Forum", path: "/forum" },
//   ];

//   const isActive = (path) => location.pathname === path;

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleProfileClick = () => {
//     setIsDropdownOpen(false);
//     navigate("/profile");
//   };

//   const handleLogout = () => {
//     setIsDropdownOpen(false);
//     logout();
//     // localStorage.removeItem("dpi_token");
//     localStorage.clear();
//     navigate("/");
//   };

//   const getRoleBadgeColor = (role) => {
//     switch (role) {
//       case "admin":
//         return "bg-red-100 text-red-800 border-red-200";
//       case "counsellor":
//         return "bg-green-100 text-green-800 border-green-200";
//       case "student":
//         return "bg-blue-100 text-blue-800 border-blue-200";
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-200";
//     }
//   };

//   return (
//     <header className="sticky top-0 z-50 shadow-md bg-gradient-to-r from-white via-blue-50 to-blue-100 backdrop-blur border-b">
//       <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
//         <Link
//           to="/"
//           className="text-2xl font-extrabold tracking-tight text-indigo-700 hover:text-indigo-800 transition-colors"
//         >
//           MindCare
//         </Link>

//         <nav className="hidden md:flex space-x-6 font-medium">
//           {navItems.map((item) => (
//             <Link
//               key={item.name}
//               to={item.path}
//               className={`transition-colors duration-200 pb-1 border-b-2 ${
//                 isActive(item.path)
//                   ? "border-indigo-600 text-indigo-700 font-semibold"
//                   : "border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-500"
//               }`}
//             >
//               {item.name}
//             </Link>
//           ))}
//         </nav>

//         <div className="flex items-center space-x-4">
//           {loading ? (
//             // Show loading skeleton while auth is initializing
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
//               <div className="hidden lg:block">
//                 <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
//                 <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
//               </div>
//             </div>
//           ) : user ? (
//             <div className="relative" ref={dropdownRef}>
//               {/* Avatar Button */}
//               <button
//                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                 className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
//               >
//                 <div className="relative">
//                   <img
//                     src={user.avatar || "/default-avatar.png"}
//                     alt={user.fullName}
//                     className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
//                   />
//                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
//                 </div>
//                 <div className="hidden lg:block text-left">
//                   <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
//                   <p className="text-xs text-gray-500 capitalize">@{user.username}</p>
//                 </div>
//                 <svg
//                   className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
//                     isDropdownOpen ? "rotate-180" : ""
//                   }`}
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                 </svg>
//               </button>

//               {/* Dropdown Menu */}
//               {isDropdownOpen && (
//                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
//                   {/* User Info Header */}
//                   <div className="px-4 py-3 border-b border-gray-100">
//                     <div className="flex items-center space-x-3">
//                       <img
//                         src={user.avatar || "/default-avatar.png"}
//                         alt={user.fullName}
//                         className="w-12 h-12 rounded-full object-cover"
//                       />
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
//                         <p className="text-sm text-gray-500 truncate">{user.email}</p>
//                         <div className="flex items-center mt-1">
//                           <span
//                             className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(
//                               user.role
//                             )}`}
//                           >
//                             {user.role}
//                           </span>
//                           {user.isApproved === false && (
//                             <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
//                               Pending Approval
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Menu Items */}
//                   <div className="py-2">
//                     <button
//                       onClick={handleProfileClick}
//                       className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
//                     >
//                       <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                         />
//                       </svg>
//                       View Profile
//                     </button>

//                     <Link
//                       to="/settings"
//                       onClick={() => setIsDropdownOpen(false)}
//                       className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
//                     >
//                       <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
//                         />
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       </svg>
//                       Settings
//                     </Link>

//                     {user.role === "admin" && (
//                       <Link
//                         to="/admin"
//                         onClick={() => setIsDropdownOpen(false)}
//                         className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
//                       >
//                         <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
//                           />
//                         </svg>
//                         Admin Panel
//                       </Link>
//                     )}

//                     <hr className="my-2" />

//                     <button
//                       onClick={handleLogout}
//                       className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
//                     >
//                       <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
//                         />
//                       </svg>
//                       Sign Out
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="flex items-center space-x-3">
//               <Link
//                 to="/login"
//                 className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
//               >
//                 Login
//               </Link>
//               <Link
//                 to="/register"
//                 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors"
//               >
//                 Sign Up
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }








import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { user, logout, loading, authChecked } = useAuth(); // Add authChecked
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { name: "AI Chat Support", path: "/chat" },
    { name: "Screening Test", path: "/screening" },
    { name: "Book Appointment", path: "/booking" },
    { name: "Resources", path: "/resources" },
    { name: "Peer Forum", path: "/forum" },
  ];

  const isActive = (path) => location.pathname === path;

  // Reset image state when user changes
  useEffect(() => {
    if (user?.avatar) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [user?.avatar]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate("/profile");
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    localStorage.clear();
    navigate("/");
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "counsellor":
        return "bg-green-100 text-green-800 border-green-200";
      case "student":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Helper function to get avatar src with fallback
  const getAvatarSrc = (user) => {
    if (!user) return "/default-avatar.png";
    
    // If user has avatar, use it, otherwise use default
    return user.avatar && !imageError ? user.avatar : "/default-avatar.png";
  };

  // Helper function to get user initials for fallback
  const getUserInitials = (user) => {
    if (!user?.fullName) return "U";
    
    const names = user.fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return user.fullName[0]?.toUpperCase() || "U";
  };

  // Avatar Component with proper loading states
  const Avatar = ({ user, size = "w-10 h-10", className = "" }) => {
    const [localImageLoaded, setLocalImageLoaded] = useState(false);
    const [localImageError, setLocalImageError] = useState(false);
    
    const shouldShowImage = user?.avatar && !localImageError && authChecked;
    const avatarSrc = getAvatarSrc(user);
    
    return (
      <div className={`relative ${size} ${className}`}>
        {shouldShowImage ? (
          <>
            {/* Image */}
            <img
              src={avatarSrc}
              alt={user?.fullName || "User"}
              className={`${size} rounded-full object-cover border-2 border-indigo-200 shadow-sm transition-opacity duration-200 ${
                localImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setLocalImageLoaded(true)}
              onError={() => {
                setLocalImageError(true);
                setLocalImageLoaded(false);
              }}
            />
            
            {/* Loading placeholder */}
            {!localImageLoaded && (
              <div className={`absolute inset-0 ${size} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-2 border-indigo-200 shadow-sm`}>
                <span className="text-white font-semibold text-sm">
                  {getUserInitials(user)}
                </span>
              </div>
            )}
          </>
        ) : (
          // Default avatar with initials
          <div className={`${size} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-2 border-indigo-200 shadow-sm`}>
            <span className="text-white font-semibold text-sm">
              {getUserInitials(user)}
            </span>
          </div>
        )}
        
        {/* Online indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 shadow-md bg-gradient-to-r from-white via-blue-50 to-blue-100 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-indigo-700 hover:text-indigo-800 transition-colors"
        >
          MindCare
        </Link>

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

        <div className="flex items-center space-x-4">
          {loading || !authChecked ? (
            // Show loading skeleton while auth is initializing
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="hidden lg:block">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Avatar user={user} />
                
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">@{user.username}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Avatar user={user} size="w-12 h-12" />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                          {user.isApproved === false && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Pending Approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      View Profile
                    </button>

                    <Link
                      to="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Admin Panel
                      </Link>
                    )}

                    <hr className="my-2" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
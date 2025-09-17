// import React, { createContext, useContext, useEffect, useState } from "react";
// import { getMe } from "../api/authApi";

// // Create Context
// const AuthContext = createContext();

// // Provider Component
// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(() => localStorage.getItem("dpi_token"));
//   const [loading, setLoading] = useState(true);

//   // Initialize auth state on mount
//   useEffect(() => {
//     const initAuth = async () => {
//       const storedToken = localStorage.getItem("dpi_token");
      
//       if (storedToken) {
//         try {
//           const res = await getMe(storedToken);
//           setUser(res.data.data.user);
//           setToken(storedToken);
//         } catch (err) {
//           console.error("Auth check failed:", err.response?.data?.message);
//           setUser(null);
//           setToken(null);
//           localStorage.removeItem("dpi_token");
//         }
//       }
      
//       setLoading(false);
//     };

//     initAuth();
//   // },[]); // Remove the dependency array complexity
//   },[token]); // Remove the dependency array complexity

//   // Login function
//   const login = (newToken, newUser) => {
//     setToken(newToken);
//     setUser(newUser);
//     localStorage.setItem("dpi_token", newToken);
//     setLoading(false); // Ensure loading is false after login
//   };

//   // Logout function
//   const logout = () => {
//     setToken(null);
//     setUser(null);
//     localStorage.removeItem("dpi_token");
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Hook for consuming context
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };


// // import React, { createContext, useContext, useEffect, useState } from "react";
// // import { getMe } from "../api/authApi";

// // // Create Context
// // const AuthContext = createContext();

// // // Provider Component
// // export const AuthProvider = ({ children }) => {
// //   const [user, setUser] = useState(null);
// //   const [token, setToken] = useState(() => localStorage.getItem("dpi_token"));
// //   const [loading, setLoading] = useState(true);

// //   // Initialize auth state on mount
// //   useEffect(() => {
// //     const initAuth = async () => {
// //       const storedToken = localStorage.getItem("dpi_token");
      
// //       if (storedToken) {
// //         try {
// //           // ✅ Fix: Change from /auth/me to /users/me or /users/current-user
// //           const res = await getMe(storedToken);
// //           setUser(res.data.data.user);
// //           setToken(storedToken);
// //         } catch (err) {
// //           console.error("Auth check failed:", err.response?.data?.message || err.message);
// //           setUser(null);
// //           setToken(null);
// //           localStorage.removeItem("dpi_token");
// //         }
// //       }
      
// //       setLoading(false);
// //     };

// //     initAuth();
// //   }, []); // ✅ Fix: Add proper dependency array

// //   // Login function
// //   const login = (newToken, newUser) => {
// //     setToken(newToken);
// //     setUser(newUser);
// //     localStorage.setItem("dpi_token", newToken);
// //     setLoading(false);
// //   };

// //   // Logout function
// //   const logout = () => {
// //     setToken(null);
// //     setUser(null);
// //     localStorage.removeItem("dpi_token");
// //   };

// //   return (
// //     <AuthContext.Provider value={{ user, token, login, logout, loading }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // };

// // // Hook for consuming context
// // export const useAuth = () => {
// //   const context = useContext(AuthContext);
// //   if (!context) {
// //     throw new Error("useAuth must be used within an AuthProvider");
// //   }
// //   return context;
// // };










import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe } from "../api/authApi";

// Create Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("dpi_token"));
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Memoized auth check function to prevent unnecessary re-creation
  const checkAuth = useCallback(async (tokenToCheck) => {
    if (!tokenToCheck) {
      setUser(null);
      setToken(null);
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    try {
      const res = await getMe(tokenToCheck);
      setUser(res.data.data.user);
      setToken(tokenToCheck);
    } catch (err) {
      console.error("Auth check failed:", err.response?.data?.message || err.message);
      
      // Clear invalid token
      setUser(null);
      setToken(null);
      localStorage.removeItem("dpi_token");
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, []);

  // Initialize auth state on mount - ONLY runs once
  useEffect(() => {
    const storedToken = localStorage.getItem("dpi_token");
    checkAuth(storedToken);
  }, []); // Empty dependency array - runs only once on mount

  // Login function
  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
    setAuthChecked(true);
    localStorage.setItem("dpi_token", newToken);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setLoading(false);
    setAuthChecked(true);
    localStorage.removeItem("dpi_token");
  }, []);

  // Manual auth refresh function (useful for token refresh scenarios)
  const refreshAuth = useCallback(async () => {
    const currentToken = localStorage.getItem("dpi_token");
    if (currentToken && currentToken === token) {
      setLoading(true);
      await checkAuth(currentToken);
    }
  }, [token, checkAuth]);

  // Provide stable auth state - prevents unnecessary re-renders
  const value = {
    user,
    token,
    loading,
    authChecked,
    login,
    logout,
    refreshAuth,
    isAuthenticated: !!user && !!token,
    isStudent: user?.role === 'student',
    isCounsellor: user?.role === 'counsellor',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for consuming context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
import React, { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "../api/authApi";

// Create Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("dpi_token") || null);
  const [loading, setLoading] = useState(true);

  // Check if token is valid on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await getMe(token);
          setUser(res.data.data.user);
        } catch (err) {
          console.error("Auth check failed:", err.response?.data?.message);
          setUser(null);
          setToken(null);
          localStorage.removeItem("dpi_token");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  // Login function
  const login = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("dpi_token", token);
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("dpi_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook for consuming context
export const useAuth = () => useContext(AuthContext);

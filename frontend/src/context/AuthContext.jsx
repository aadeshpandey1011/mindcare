import React, { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "../api/authApi";

// Create Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("dpi_token"));
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("dpi_token");
      
      if (storedToken) {
        try {
          const res = await getMe(storedToken);
          setUser(res.data.data.user);
          setToken(storedToken);
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
  }, []); // Remove the dependency array complexity

  // Login function
  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("dpi_token", newToken);
    setLoading(false); // Ensure loading is false after login
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("dpi_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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
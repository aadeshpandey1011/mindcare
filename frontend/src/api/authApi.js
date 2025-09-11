import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// Register new user
export const signup = (userData) => API.post("/users/register", userData);


// Login
export const login = (credentials) => API.post("/users/login", credentials);

// Fetch current user
export const getMe = (token) =>
  API.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Logout
export const logout = () => API.post("/auth/logout");

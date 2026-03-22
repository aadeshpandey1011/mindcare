import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

export const signup = (userData) => API.post("/users/register", userData);

export const login = (credentials) => API.post("/users/login", credentials);

// Calls /users/me — the correct, stable endpoint
export const getMe = (token) =>
  API.get("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const logout = () => API.post("/users/logout");

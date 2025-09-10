import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// Get list of screening questionnaires
export const getScreenings = () => API.get("/screenings");

// Submit user screening answers
export const submitScreening = (answers, token) =>
  API.post("/screenings/submit", answers, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Get user's previous screening results
export const getMyScreeningResults = (token) =>
  API.get("/screenings/my-results", {
    headers: { Authorization: `Bearer ${token}` },
  });

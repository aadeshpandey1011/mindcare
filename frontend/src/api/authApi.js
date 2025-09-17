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


// authApi.js
// import axios from 'axios';

// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// // Create axios instance with default config
// const authAPI = axios.create({
//   baseURL: API_BASE,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests if available
// authAPI.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('dpi_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Handle response errors globally
// authAPI.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('dpi_token');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// // ✅ Fix: Change endpoint from /auth/me to /users/current-user
// export const getMe = (token) => {
//   return authAPI.get('/users/current-user', {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// };

// export const login = (credentials) => {
//   return authAPI.post('/users/login', credentials);
// };

// export const register = (userData) => {
//   return authAPI.post('/users/register', userData);
// };

// export const logout = () => {
//   return authAPI.post('/users/logout');
// };

// export const refreshToken = () => {
//   return authAPI.post('/users/refresh-token');
// };

// export default authAPI;
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// Fetch all comments
export const getComments = () => API.get("/comments");

// Post a new comment
export const createComment = (commentData, token) =>
  API.post("/comments", commentData, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Delete comment (admin or author only)
export const deleteComment = (id, token) =>
  API.delete(`/comments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

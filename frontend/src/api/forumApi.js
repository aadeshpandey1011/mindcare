import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export const getPosts = (category) =>
  API.get(`/forum/posts?category=${category}`);

export const createPost = (postData) =>
  API.post('/forum/posts', postData);

export const deletePost = (postId, userId) =>
  API.delete(`/forum/posts/${postId}`, { data: { userId } });

export const toggleSupport = (postId, userId) =>
  API.post(`/forum/posts/${postId}/support`, { userId });

export const addReply = (postId, content, userId) =>
  API.post(`/forum/posts/${postId}/reply`, { content, userId });
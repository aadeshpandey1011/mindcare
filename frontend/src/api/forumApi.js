import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    withCredentials: true,
});

const authHeader = () => {
    const token = localStorage.getItem('dpi_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const getPosts = (category, options = {}) => {
    const params = new URLSearchParams({ category });
    if (options.userId)      params.set('userId', options.userId);
    if (options.isAdmin)     params.set('isAdmin', 'true');
    if (options.showDeleted) params.set('showDeleted', 'true');
    return API.get(`/forum/posts?${params}`);
};

/**
 * createPost — sends multipart/form-data so media files can be attached.
 * data: { title, description, tags, category, userId, isAnonymous, mediaFiles: File[] }
 */
export const createPost = (data) => {
    const form = new FormData();
    form.append('title',       data.title);
    form.append('description', data.description);
    form.append('category',    data.category);
    form.append('userId',      data.userId);
    form.append('isAnonymous', data.isAnonymous ? 'true' : 'false');

    // tags as comma-separated string (backend splits it)
    if (data.tags) form.append('tags', Array.isArray(data.tags) ? data.tags.join(',') : data.tags);

    // attach media files (images + videos)
    if (data.mediaFiles && data.mediaFiles.length > 0) {
        data.mediaFiles.forEach(file => form.append('media', file));
    }

    // Don't set Content-Type — axios sets multipart/form-data with boundary automatically
    return API.post('/forum/posts', form);
};

export const deletePost = (postId, userId) =>
    API.delete(`/forum/posts/${postId}`, { data: { userId } });

export const toggleSupport = (postId, userId) =>
    API.post(`/forum/posts/${postId}/support`, { userId });

export const addReply = (postId, content, userId, isAnonymous = false) =>
    API.post(`/forum/posts/${postId}/reply`, { content, userId, isAnonymous });

export const reportPost = (postId, userId, reason) =>
    API.post(`/forum/posts/${postId}/report`, { userId, reason });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminDeletePost = (postId, reason) =>
    API.delete(`/forum/posts/${postId}/admin`, { data: { reason }, headers: authHeader() });

export const restorePost = (postId) =>
    API.post(`/forum/posts/${postId}/restore`, {}, { headers: authHeader() });

export const dismissReports = (postId) =>
    API.post(`/forum/posts/${postId}/dismiss-reports`, {}, { headers: authHeader() });

export const warnUser = (postId, reason) =>
    API.post(`/forum/posts/${postId}/warn`, { reason }, { headers: authHeader() });

export const banUser = (userId, reason) =>
    API.post(`/forum/users/${userId}/ban`, { reason }, { headers: authHeader() });

export const unbanUser = (userId) =>
    API.post(`/forum/users/${userId}/unban`, {}, { headers: authHeader() });

export const adminDeleteReply = (postId, replyId) =>
    API.delete(`/forum/posts/${postId}/replies/${replyId}`, { headers: authHeader() });

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      (err.code === 'ECONNABORTED' ? 'Request timed out.' : null) ||
      err.message ||
      'An unexpected error occurred.';
    const error = new Error(message);
    error.status = err.response?.status;
    error.data = err.response?.data;
    return Promise.reject(error);
  }
);

// Issues
export const classifyIssue = (payload) => api.post('/issues/classify', payload);
export const getIssues = (params) => api.get('/issues', { params });
export const getIssueById = (id) => api.get(`/issues/${id}`);
export const deleteIssue = (id) => api.delete(`/issues/${id}`);
export const confirmIssueCategory = (id, confirmedCategory) =>
  api.patch(`/issues/${id}/confirm`, { confirmedCategory });

// Stats & health
export const getStats = () => api.get('/stats');
export const getHealth = () => api.get('/health');

export default api;

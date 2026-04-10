import axios from 'axios';

const API_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData);
    return response.data;
  },
  register: (email, password) => api.post('/auth/register', { email, password }),
};

export const simApi = {
  start: () => api.post('/simulate/start'),
  stop: () => api.post('/simulate/stop'),
  reset: () => api.post('/simulate/reset'),
  getStatus: () => api.get('/simulate/status'),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getLogs: () => api.get('/dashboard/logs'),
};

export const ariaApi = {
  chat: (query) => api.post('/aria/chat', { query }),
};

export default api;

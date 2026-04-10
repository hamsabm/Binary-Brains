import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = (u, p) => api.post('/auth/login', { username: u, password: p });
export const getFullCycle = () => api.get('/simulate/full_cycle');
export const getStats = () => api.get('/dashboard/stats');
export const getLogs = (limit=50) => api.get(`/dashboard/logs?limit=${limit}`);
export const postChat = (message, include_context=true) => api.post('/ai/chat', { message, include_context });

// ADVANCED ADD-ONS
export const getPrediction = () => api.get('/intel/prediction');
export const getGameStats = () => api.get('/gamified/stats');
export const simulateFullCycle = () => api.get('/simulate/full_cycle');

export default api;

import axios from 'axios';
import { useLoadingStore } from '../store/loadingStore';

const api = axios.create({
  baseURL: '/api',
});

// Attach token & start loading bar
api.interceptors.request.use(
  (config) => {
    useLoadingStore.getState().startLoading();
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    useLoadingStore.getState().stopLoading();
    return Promise.reject(error);
  }
);

// Auto-refresh on 401 & stop loading bar on response/error
api.interceptors.response.use(
  (res) => {
    useLoadingStore.getState().stopLoading();
    return res;
  },
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useLoadingStore.getState().stopLoading();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    useLoadingStore.getState().stopLoading();
    return Promise.reject(error);
  }
);

export default api;

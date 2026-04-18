// services/api.js
// Axios instance with AsyncStorage token management

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://10.0.2.2:5000/api/v1';
// Note: 10.0.2.2 = Android emulator host. For iOS use: localhost
// For physical device: use your machine's local IP e.g. http://192.168.1.10:5000/api/v1

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach access token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.data.accessToken;
        await AsyncStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Navigation reset handled by auth store listener
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

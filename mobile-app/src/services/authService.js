import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const authService = {
  /**
   * Login and persist tokens + user profile
   */
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = data.data;
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);
    return user;
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },

  getStoredUser: async () => {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },
};

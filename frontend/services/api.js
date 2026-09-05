import axios from 'axios';
import storage from './storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically resolves the API base URL depending on runtime environment:
 * - Real Device with Expo Go / Metro: uses host machine LAN IP
 * - Android Emulator: fallback 10.0.2.2:5000
 * - iOS Simulator / Web: localhost:5000
 */
export const getBaseUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api`;
    }
  }

  const extraApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraApiUrl) {
    return extraApiUrl;
  }

  // Android emulator routes host machine via 10.0.2.2; iOS / web routes via localhost
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach Bearer token from SecureStore
api.interceptors.request.use(
  async (config) => {
    try {
      // Ensure baseURL is dynamically resolved if host changed
      config.baseURL = getBaseUrl();

      const accessToken = await storage.getItem('accessToken');
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.warn('[API Request Interceptor Error]', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Token Refresh on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) {
          await storage.deleteItem('accessToken');
          await storage.deleteItem('refreshToken');
          await storage.deleteItem('user');
          return Promise.reject(error);
        }

        // Request a new access token
        const refreshResponse = await axios.post(`${getBaseUrl()}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse.data;

        await storage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          await storage.setItem('refreshToken', newRefreshToken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        await storage.deleteItem('accessToken');
        await storage.deleteItem('refreshToken');
        await storage.deleteItem('user');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

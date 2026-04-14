import * as Sentry from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { router } from 'expo-router';

export const API_BASE_URL = 'https://fid-lepro-production.up.railway.app';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injecte automatiquement le token JWT sur chaque requête
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion globale des erreurs : refresh auto sur 401, logout si refresh échoue
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (__DEV__) {
      const url = error?.config?.url;
      const status = error?.response?.status;
      console.warn(`[API] ${status ?? 'ERR'} — ${url}`, error?.response?.data);
    }

    if (error?.response?.status === 401 && !error?.config?._retry401) {
      error.config._retry401 = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('no refresh token');

        // Tenter de renouveler le token d'accès
        const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = res.data;

        // Sauvegarder les nouveaux tokens
        await Promise.all([
          SecureStore.setItemAsync('token', newToken),
          SecureStore.setItemAsync('refreshToken', newRefreshToken),
        ]);

        // Relancer la requête originale avec le nouveau token
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(error.config);
      } catch {
        // Refresh échoué → déconnecter
        await Promise.all([
          SecureStore.deleteItemAsync('token'),
          SecureStore.deleteItemAsync('role'),
          SecureStore.deleteItemAsync('refreshToken'),
        ]);
        router.replace('/login');
      }
    }

    // Reporter les erreurs serveur (5xx) à Sentry
    const status = error?.response?.status;
    if (status >= 500) {
      Sentry.captureException(error, {
        extra: {
          url: error?.config?.url,
          method: error?.config?.method,
          status,
          data: error?.response?.data,
        },
      });
    }

    return Promise.reject(error);
  }
);

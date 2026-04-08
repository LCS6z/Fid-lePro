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

// Gestion globale des erreurs : logout auto sur 401, debug en dev
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (__DEV__) {
      const url = error?.config?.url;
      const status = error?.response?.status;
      console.warn(`[API] ${status ?? 'ERR'} — ${url}`, error?.response?.data);
    }

    // Token expiré ou invalide → on efface la session et on renvoie au login
    if (error?.response?.status === 401 && !error?.config?._retry401) {
      error.config._retry401 = true; // évite la boucle infinie
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('role');
      router.replace('/login');
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

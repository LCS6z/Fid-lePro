import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  qrCode: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isReady: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  isReady: false,

  login: async (token, user) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ token: null, user: null });
  },

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userStr = await SecureStore.getItemAsync('user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr) });
      }
    } catch {
      // session invalide
    } finally {
      set({ isReady: true });
    }
  },
}));

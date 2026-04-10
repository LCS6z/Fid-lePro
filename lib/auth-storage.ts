import * as SecureStore from 'expo-secure-store';

export type UserRole = 'client' | 'commercant';

/**
 * Gestion du token JWT via SecureStore (chiffré nativement).
 * Remplace AsyncStorage qui stockait le token en clair.
 */
export const authStorage = {
  async setSession(token: string, role: UserRole, refreshToken?: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync('token', token),
      SecureStore.setItemAsync('role', role),
      refreshToken ? SecureStore.setItemAsync('refreshToken', refreshToken) : Promise.resolve(),
    ]);
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('token');
  },

  async getRole(): Promise<UserRole | null> {
    return SecureStore.getItemAsync('role') as Promise<UserRole | null>;
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync('refreshToken');
  },

  async setToken(token: string): Promise<void> {
    return SecureStore.setItemAsync('token', token);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync('token'),
      SecureStore.deleteItemAsync('role'),
      SecureStore.deleteItemAsync('refreshToken'),
    ]);
  },

  // Stockage générique sécurisé pour les préférences sensibles (ex: biometrie)
  async getRaw(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async setRaw(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async removeRaw(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

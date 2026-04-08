/**
 * Cache local pour les données API critiques.
 * Permet d'afficher des données même sans réseau (offline-first).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'fidelepro_cache_';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

export const cache = {
  async set<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): Promise<void> {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) return null; // expiré
      return entry.data;
    } catch {
      return null;
    }
  },

  async getStale<T>(key: string): Promise<T | null> {
    // Retourne les données même expirées (utile en mode offline)
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch {
      return null;
    }
  },

  async invalidate(key: string): Promise<void> {
    await AsyncStorage.removeItem(PREFIX + key);
  },

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(PREFIX));
    if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
  },
};

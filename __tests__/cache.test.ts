import AsyncStorage from '@react-native-async-storage/async-storage';
import { cache } from '../lib/cache';

describe('cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('set / get', () => {
    it('stocke et récupère une valeur', async () => {
      await cache.set('test_key', { nom: 'Alice' });
      const result = await cache.get<{ nom: string }>('test_key');
      expect(result).toEqual({ nom: 'Alice' });
    });

    it('retourne null si la clé n existe pas', async () => {
      const result = await cache.get('inexistant');
      expect(result).toBeNull();
    });

    it('retourne null si entrée expirée', async () => {
      // TTL de 1ms pour forcer l'expiration
      await cache.set('expire_key', { data: 'old' }, 1);
      await new Promise(r => setTimeout(r, 10));
      const result = await cache.get('expire_key');
      expect(result).toBeNull();
    });

    it('retourne la valeur si dans le TTL', async () => {
      await cache.set('fresh_key', 42, 60000);
      const result = await cache.get<number>('fresh_key');
      expect(result).toBe(42);
    });
  });

  describe('getStale', () => {
    it('retourne les données même expirées', async () => {
      await cache.set('stale_key', { stale: true }, 1);
      await new Promise(r => setTimeout(r, 10));
      const result = await cache.getStale<{ stale: boolean }>('stale_key');
      expect(result).toEqual({ stale: true });
    });

    it('retourne null si clé absente', async () => {
      const result = await cache.getStale('vide');
      expect(result).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('supprime une entrée spécifique', async () => {
      await cache.set('a', 1);
      await cache.set('b', 2);
      await cache.invalidate('a');
      expect(await cache.get<number>('a')).toBeNull();
      expect(await cache.get<number>('b')).toBe(2);
    });
  });

  describe('clear', () => {
    it('supprime toutes les entrées du cache', async () => {
      await cache.set('x', 1);
      await cache.set('y', 2);
      await cache.clear();
      expect(await cache.get<number>('x')).toBeNull();
      expect(await cache.get<number>('y')).toBeNull();
    });

    it('ne supprime pas les clés non-cache', async () => {
      await AsyncStorage.setItem('autre_cle', 'valeur');
      await cache.set('z', 3);
      await cache.clear();
      expect(await AsyncStorage.getItem('autre_cle')).toBe('valeur');
    });
  });

  describe('robustesse', () => {
    it('retourne null si JSON corrompu', async () => {
      await AsyncStorage.setItem('fidelepro_cache_corrupt', 'pas_du_json{{{');
      const result = await cache.get('corrupt');
      expect(result).toBeNull();
    });
  });
});

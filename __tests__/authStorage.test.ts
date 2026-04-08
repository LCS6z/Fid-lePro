import * as SecureStore from 'expo-secure-store';
import { authStorage } from '../lib/auth-storage';

describe('authStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setSession', () => {
    it('stocke le token et le rôle', async () => {
      await authStorage.setSession('tok123', 'client');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'tok123');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('role', 'client');
    });

    it('fonctionne pour le rôle commerçant', async () => {
      await authStorage.setSession('tok456', 'commercant');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('role', 'commercant');
    });
  });

  describe('getToken', () => {
    it('retourne le token stocké', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('tok123');

      const token = await authStorage.getToken();

      expect(token).toBe('tok123');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('token');
    });

    it('retourne null si aucun token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const token = await authStorage.getToken();

      expect(token).toBeNull();
    });
  });

  describe('getRole', () => {
    it('retourne le rôle stocké', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('commercant');

      const role = await authStorage.getRole();

      expect(role).toBe('commercant');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('role');
    });
  });

  describe('clear', () => {
    it('supprime token et rôle', async () => {
      await authStorage.clear();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('role');
    });
  });
});

import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('état initial', () => {
    it('démarre avec isLoading=true puis false après restore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('restaure le token et le rôle depuis SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('tok_restore')
        .mockResolvedValueOnce('client');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.token).toBe('tok_restore');
      expect(result.current.role).toBe('client');
    });

    it('token et role sont null si aucune session', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.token).toBeNull();
      expect(result.current.role).toBeNull();
    });
  });

  describe('login()', () => {
    it('met à jour token et role, et appelle setSession', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('new_token', 'commercant');
      });

      expect(result.current.token).toBe('new_token');
      expect(result.current.role).toBe('commercant');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'new_token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('role', 'commercant');
    });
  });

  describe('logout()', () => {
    it('vide token et role, appelle clear() et redirige vers /login', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('tok')
        .mockResolvedValueOnce('client');

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.role).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('role');
      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });

  describe('useAuth() hors AuthProvider', () => {
    it('lève une erreur si utilisé sans provider', () => {
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth doit être utilisé dans un AuthProvider'
      );
    });
  });
});

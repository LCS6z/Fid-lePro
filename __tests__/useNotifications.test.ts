import { renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { act } from 'react';
import { apiClient } from '../lib/api';

// Écrase le mock global pour tester la vraie implémentation
jest.mock('@/hooks/useNotifications', () => jest.requireActual('../hooks/useNotifications'));

// Remplace le mock expo-device pour pouvoir contrôler isDevice par test
let mockIsDevice = false;
jest.mock('expo-device', () => ({
  get isDevice() { return mockIsDevice; },
}));

let responseCallback: ((r: Notifications.NotificationResponse) => void) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsDevice = false;
  responseCallback = null;

  (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(cb => {
    responseCallback = cb;
    return { remove: jest.fn() };
  });
  (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation(() => ({
    remove: jest.fn(),
  }));
});

const makeResponse = (screen?: string): Notifications.NotificationResponse => ({
  notification: {
    request: { content: { data: screen ? { screen } : {} } } as any,
  } as any,
  actionIdentifier: 'default',
  userText: undefined,
});

describe('useNotifications', () => {
  describe('deep link', () => {
    it('navigue vers /dashboard-client', async () => {
      const useNotifications = require('../hooks/useNotifications').default;
      renderHook(() => useNotifications());
      await act(async () => {});
      responseCallback!(makeResponse('dashboard-client'));
      expect(router.replace).toHaveBeenCalledWith('/dashboard-client');
    });

    it('navigue vers /dashboard-commercant', async () => {
      const useNotifications = require('../hooks/useNotifications').default;
      renderHook(() => useNotifications());
      await act(async () => {});
      responseCallback!(makeResponse('dashboard-commercant'));
      expect(router.replace).toHaveBeenCalledWith('/dashboard-commercant');
    });

    it('ne navigue pas si screen inconnu', async () => {
      const useNotifications = require('../hooks/useNotifications').default;
      renderHook(() => useNotifications());
      await act(async () => {});
      responseCallback!(makeResponse('unknown-screen'));
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('enregistrement FCM', () => {
    it('envoie le token FCM au bon endpoint pour un client', async () => {
      mockIsDevice = true;
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_client');
        if (key === 'role') return Promise.resolve('client');
        return Promise.resolve(null);
      });
      (apiClient.post as jest.Mock).mockResolvedValue({});

      const useNotifications = require('../hooks/useNotifications').default;
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/api/client/fcm-token',
          { fcmToken: 'ExponentPushToken[test]' }
        );
      });
    });

    it('envoie le token FCM au bon endpoint pour un commercant', async () => {
      mockIsDevice = true;
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_commercant');
        if (key === 'role') return Promise.resolve('commercant');
        return Promise.resolve(null);
      });
      (apiClient.post as jest.Mock).mockResolvedValue({});

      const useNotifications = require('../hooks/useNotifications').default;
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/api/commercant/fcm-token',
          { fcmToken: 'ExponentPushToken[test]' }
        );
      });
    });

    it('ne fait rien si pas un device physique', async () => {
      mockIsDevice = false;
      const useNotifications = require('../hooks/useNotifications').default;
      renderHook(() => useNotifications());
      await act(async () => {});

      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('ne fait rien si permission refusée', async () => {
      mockIsDevice = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

      const useNotifications = require('../hooks/useNotifications').default;
      renderHook(() => useNotifications());
      await act(async () => {});

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('ne plante pas si apiClient.post échoue', async () => {
      mockIsDevice = true;
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_client');
        if (key === 'role') return Promise.resolve('client');
        return Promise.resolve(null);
      });
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network'));

      const useNotifications = require('../hooks/useNotifications').default;
      renderHook(() => useNotifications());
      await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    });
  });

  describe('cleanup', () => {
    it('supprime les listeners au démontage', async () => {
      const removeNotif = jest.fn();
      const removeResponse = jest.fn();
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValueOnce({ remove: removeNotif });
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValueOnce({ remove: removeResponse });

      const useNotifications = require('../hooks/useNotifications').default;
      const { unmount } = renderHook(() => useNotifications());
      await act(async () => {});
      unmount();

      expect(removeNotif).toHaveBeenCalled();
      expect(removeResponse).toHaveBeenCalled();
    });
  });
});

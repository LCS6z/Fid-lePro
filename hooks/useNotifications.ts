import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { apiClient } from '@/lib/api';
import { authStorage } from '@/lib/auth-storage';
import { clearBadge } from '@/lib/notification-prefs';

const EXPO_PROJECT_ID = 'f2f1be30-74ba-48ce-bbf3-840d0379f2af';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotifData = {
  screen?: string;
  type?: string;
  carteId?: string;
  commercantId?: string;
};

/**
 * Navigue vers le bon écran selon les données de la notif.
 * - tampon_ajoute / recompense_dispo → dashboard-client
 * - relance → dashboard-client
 * - stats_quotidiennes → dashboard-commercant
 */
function handleDeepLink(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as NotifData | undefined;
  const screen = data?.screen;
  const type = data?.type;

  if (screen === 'dashboard-client' || type === 'tampon_ajoute' || type === 'recompense_dispo' || type === 'relance') {
    router.replace('/dashboard-client');
  } else if (screen === 'dashboard-commercant' || type === 'stats_quotidiennes') {
    router.replace('/dashboard-commercant');
  }
}

export default function useNotifications() {
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  useEffect(() => {
    enregistrerNotifications();

    // Badge → 0 quand l'app passe au premier plan
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') clearBadge();
    });

    // Notif reçue pendant que l'app est au premier plan
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('[Notifications] Reçue:', notification);
    });

    // Utilisateur tape sur une notif → deep link
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (__DEV__) console.log('[Notifications] Réponse:', response);
      clearBadge();
      handleDeepLink(response);
    });

    return () => {
      appStateSub.remove();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const enregistrerNotifications = async () => {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const token = await Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID });
    const fcmToken = token.data;

    const authToken = await authStorage.getToken();
    const role = await authStorage.getRole();
    if (authToken && fcmToken) {
      try {
        const endpoint = role === 'commercant'
          ? '/api/commercant/fcm-token'
          : '/api/client/fcm-token';
        await apiClient.post(endpoint, { fcmToken });
      } catch (e) {
        if (__DEV__) console.warn('[Notifications] Erreur enregistrement FCM:', e);
      }
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FidèlePro',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6637ee',
        showBadge: true,
      });
    }
  };
}

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/api';
import { authStorage } from '@/lib/auth-storage';

const EXPO_PROJECT_ID = 'f2f1be30-74ba-48ce-bbf3-840d0379f2af';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Navigue vers le bon écran selon les données de la notif
function handleDeepLink(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  const screen = data?.screen as string | undefined;

  if (screen === 'dashboard-client') {
    router.replace('/dashboard-client');
  } else if (screen === 'dashboard-commercant') {
    router.replace('/dashboard-commercant');
  }
  // Pas de screen spécifié → on reste sur l'écran courant
}

export default function useNotifications() {
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  useEffect(() => {
    enregistrerNotifications();

    // Notif reçue pendant que l'app est au premier plan
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('[Notifications] Reçue:', notification);
    });

    // Utilisateur tape sur une notif → deep link
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (__DEV__) console.log('[Notifications] Réponse:', response);
      handleDeepLink(response);
    });

    return () => {
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
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6637ee',
      });
    }
  };
}

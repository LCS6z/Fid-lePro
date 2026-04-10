import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BiometricLock } from '@/components/BiometricLock';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useBiometricLock } from '@/hooks/useBiometricLock';
import { config } from '@/lib/config';

// Initialisation Sentry — doit être appelé le plus tôt possible
Sentry.init({
  dsn: config.sentryDsn,
  enabled: config.isProd,
  environment: config.appEnv,
  // Capture 100% des transactions en prod, 0% en dev (ajustable)
  tracesSampleRate: config.isProd ? 0.2 : 0,
  // Relie les erreurs aux releases EAS (injecté par le plugin Sentry)
  release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
  debug: false,
});

// Vérifie les mises à jour OTA au démarrage (prod uniquement)
function useOtaUpdate() {
  const checkUpdate = useCallback(async () => {
    if (!Updates.isEnabled || !config.isProd) return;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Mise à jour disponible',
        "Une nouvelle version a été téléchargée. Redémarrez pour l'appliquer.",
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Redémarrer', onPress: () => Updates.reloadAsync() },
        ]
      );
    } catch {
      // Silencieux — ne pas bloquer l'app si le check échoue
    }
  }, []);

  useEffect(() => {
    checkUpdate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// Gère le deep link depuis une notification (foreground, background et killed state)
function useNotificationLaunch() {
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!lastResponse) return;
    const data = lastResponse.notification.request.content.data as Record<string, unknown> | undefined;
    const screen = data?.screen as string | undefined;
    if (screen === 'dashboard-client') router.replace('/dashboard-client');
    else if (screen === 'dashboard-commercant') router.replace('/dashboard-commercant');
  }, [lastResponse]);
}

function AppContent() {
  useOtaUpdate();
  useNotificationLaunch();
  const { lockState, unlock } = useBiometricLock();

  return (
    <>
      <StatusBar style="light" />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="inscription-client" />
        <Stack.Screen name="inscription-commercant" />
        <Stack.Screen name="dashboard-client" options={{ gestureEnabled: false }} />
        <Stack.Screen name="dashboard-commercant" options={{ gestureEnabled: false }} />
        <Stack.Screen name="cgv" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profil" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="mot-de-passe-oublie" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="partenaires" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="stats-commercant" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="campagne" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="recompenses-client" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="parrainage" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications-inbox" options={{ animation: 'slide_from_right' }} />
      </Stack>
      {lockState === 'locked' && <BiometricLock onUnlock={unlock} />}
    </>
  );
}

function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

// Sentry.wrap capture les crashes natifs non gérés (ANR Android, OOM, etc.)
export default Sentry.wrap(RootLayout);

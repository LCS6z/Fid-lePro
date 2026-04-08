import '@testing-library/jest-native/extend-expect';

jest.setTimeout(10000);

// React 18 appelle window.dispatchEvent lors d'erreurs récupérables (ErrorBoundary recovery)
// L'env React Native Jest n'a pas de vraie implémentation — on la stub.
if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
  (window as any).dispatchEvent = jest.fn();
}

// ─── expo-secure-store ───────────────────────────────────────────────────────
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
});

// ─── expo-router ─────────────────────────────────────────────────────────────
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  Redirect: ({ href }: { href: string }) => null,
}));

// ─── expo-notifications ──────────────────────────────────────────────────────
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setNotificationChannelAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
  useLastNotificationResponse: jest.fn(() => null),
  AndroidImportance: { MAX: 5 },
}));

// ─── expo-device ─────────────────────────────────────────────────────────────
jest.mock('expo-device', () => ({
  isDevice: false,
}));

// ─── expo-constants ───────────────────────────────────────────────────────────
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: { APP_ENV: 'test', SENTRY_DSN: '' },
    },
  },
}));

// ─── FlatList : désactive la virtualisation en tests ─────────────────────────
// Évite les erreurs "Unable to find node on unmounted component" dues aux
// internals de VirtualizedList qui mesurent des nœuds déjà démontés.
// ─── react-native-reanimated ─────────────────────────────────────────────────
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// ─── react-native-qrcode-svg ─────────────────────────────────────────────────
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// ─── expo-camera ─────────────────────────────────────────────────────────────
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: false }, jest.fn()]),
}));

// ─── AsyncStorage ─────────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ─── useNotifications (évite fetch/setInterval en env Jest) ──────────────────
jest.mock('@/hooks/useNotifications', () => () => undefined);

// ─── @sentry/react-native ────────────────────────────────────────────────────
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: jest.fn((component: unknown) => component),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn(),
  Severity: { Error: 'error', Warning: 'warning', Info: 'info' },
}));

// ─── expo-local-authentication ───────────────────────────────────────────────
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

// ─── expo-haptics ────────────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ─── react-native-safe-area-context ──────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ─── Silence des warnings de console en test ─────────────────────────────────
const originalWarn = console.warn.bind(console);
beforeAll(() => {
  console.warn = (msg: string, ...args: unknown[]) => {
    if (typeof msg === 'string' && msg.includes('[API]')) return;
    originalWarn(msg, ...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});

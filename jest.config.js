/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-qrcode-svg)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Bypass le runtime Expo winter (ReadableStream, ImportMetaRegistry) — incompatible Jest
    '^expo/src/winter$': '<rootDir>/__mocks__/expo-winter.js',
    '^expo/src/winter/(.*)$': '<rootDir>/__mocks__/emptyMock.js',
    '^expo/virtual/streams$': '<rootDir>/__mocks__/emptyMock.js',
    '^expo/virtual/(.*)$': '<rootDir>/__mocks__/emptyMock.js',
    // Modules natifs non supportés par Jest
    '^expo-location$': '<rootDir>/__mocks__/expo-location.js',
    '^expo-task-manager$': '<rootDir>/__mocks__/expo-task-manager.js',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'context/**/*.tsx',
    'hooks/useBiometricLock.ts',
    'hooks/useNotifications.ts',
    'hooks/useOffline.ts',
    '!lib/types.ts',
    'app/login.tsx',
    'app/inscription-client.tsx',
    'app/inscription-commercant.tsx',
    'app/dashboard-client.tsx',
    'app/dashboard-commercant.tsx',
    'app/onboarding.tsx',
    'app/mot-de-passe-oublie.tsx',
    'app/profil.tsx',
    'app/cgv.tsx',
    'app/index.tsx',
    'components/BiometricLock.tsx',
    'components/ErrorBoundary.tsx',
    'components/FormInput.tsx',
    'components/OfflineBanner.tsx',
    'components/Toast.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
    },
  },
};

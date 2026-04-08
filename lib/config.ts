import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;

export const config = {
  appEnv: (extra?.APP_ENV as string) ?? 'development',
  sentryDsn: (extra?.SENTRY_DSN as string) ?? '',
  isProd: ((extra?.APP_ENV as string) ?? '') === 'production',
};

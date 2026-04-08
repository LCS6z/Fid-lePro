import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const lightTheme = {
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceSecondary: '#f0f0f0',
  text: '#333333',
  textMuted: '#888888',
  textSubtle: '#555555',
  border: '#eeeeee',
  borderLight: '#f0f0f0',
  overlay: 'rgba(0,0,0,0.5)',
  inactiveBorder: '#ffcccc',
  inactiveBackground: '#fff9f9',
  inactiveBadgeBackground: '#ffeeee',
  placeholder: '#aaaaaa',
  skeletonBase: '#e0e0e0',
  skeletonHighlight: '#f5f5f5',
};

export const darkTheme = {
  background: '#0f0f14',
  surface: '#1c1c28',
  surfaceSecondary: '#252535',
  text: '#f0f0f0',
  textMuted: '#888899',
  textSubtle: '#aaaabc',
  border: '#2a2a3a',
  borderLight: '#222232',
  overlay: 'rgba(0,0,0,0.7)',
  inactiveBorder: '#3a2222',
  inactiveBackground: '#1e1515',
  inactiveBadgeBackground: '#2a1a1a',
  placeholder: '#55556a',
  skeletonBase: '#2a2a3a',
  skeletonHighlight: '#333345',
};

export type Theme = typeof lightTheme;

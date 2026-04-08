/**
 * Design tokens centralisés — FidèlePro
 * Source unique de vérité pour toutes les couleurs et espacements de l'app.
 */

export const colors = {
  // Brand
  primary: '#6637ee',
  primaryLight: '#7c4dff',
  primaryDark: '#5e35b1',
  primaryShadow: 'rgba(102, 55, 238, 0.4)',

  // Sémantique
  success: '#2ecc71',
  error: '#e74c3c',
  warning: '#f1c40f',
  orange: '#f39c12',

  // Neutres
  white: '#ffffff',
  background: '#f5f5f5',
  surface: '#ffffff',
  border: '#eeeeee',
  borderLight: '#f0f0f0',

  // Texte
  text: '#333333',
  textMuted: '#888888',
  textSubtle: '#555555',
  placeholder: '#aaaaaa',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',

  // États inactif (card client)
  inactiveBorder: '#ffcccc',
  inactiveBackground: '#fff9f9',
  inactiveBadgeBackground: '#ffeeee',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  card: 24,
  circle: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  button: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  }),
  statCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'fidelepro_theme_preference';

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  themePreference: 'system',
  setThemePreference: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  // Restaure la préférence sauvegardée au démarrage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setThemePreferenceState(val);
      }
      setLoaded(true);
    });
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  };

  const resolvedDark =
    themePreference === 'system' ? systemScheme === 'dark' : themePreference === 'dark';

  const isDark = loaded ? resolvedDark : systemScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}

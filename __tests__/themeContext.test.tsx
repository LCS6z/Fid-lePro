import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import * as RN from 'react-native';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { darkTheme, lightTheme } from '../constants/theme';

function ThemeConsumer() {
  const { theme, isDark, themePreference, setThemePreference } = useTheme();
  return (
    <>
      <Text testID="isDark">{String(isDark)}</Text>
      <Text testID="bg">{theme.background}</Text>
      <Text testID="pref">{themePreference}</Text>
      <TouchableOpacity testID="setLight" onPress={() => setThemePreference('light')} />
      <TouchableOpacity testID="setDark" onPress={() => setThemePreference('dark')} />
      <TouchableOpacity testID="setSystem" onPress={() => setThemePreference('system')} />
    </>
  );
}

describe('ThemeContext', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  it('fournit le thème clair si colorScheme=light', async () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await waitFor(() => expect(screen.getByTestId('isDark').props.children).toBe('false'));
    expect(screen.getByTestId('bg').props.children).toBe(lightTheme.background);
  });

  it('fournit le thème sombre si colorScheme=dark', async () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await waitFor(() => expect(screen.getByTestId('isDark').props.children).toBe('true'));
    expect(screen.getByTestId('bg').props.children).toBe(darkTheme.background);
  });

  it('fournit le thème clair si colorScheme=null', async () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue(null);
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await waitFor(() => expect(screen.getByTestId('isDark').props.children).toBe('false'));
    expect(screen.getByTestId('bg').props.children).toBe(lightTheme.background);
  });

  it('force le thème clair même si système=dark', async () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await act(async () => { fireEvent.press(screen.getByTestId('setLight')); });
    expect(screen.getByTestId('isDark').props.children).toBe('false');
    expect(screen.getByTestId('pref').props.children).toBe('light');
    expect(await AsyncStorage.getItem('fidelepro_theme_preference')).toBe('light');
  });

  it('force le thème sombre même si système=light', async () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await act(async () => { fireEvent.press(screen.getByTestId('setDark')); });
    expect(screen.getByTestId('isDark').props.children).toBe('true');
    expect(screen.getByTestId('pref').props.children).toBe('dark');
  });

  it('restaure la préférence depuis AsyncStorage au montage', async () => {
    await AsyncStorage.setItem('fidelepro_theme_preference', 'dark');
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await waitFor(() => expect(screen.getByTestId('pref').props.children).toBe('dark'));
    expect(screen.getByTestId('isDark').props.children).toBe('true');
  });

  it('revient au système après setThemePreference("system")', async () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    await act(async () => { fireEvent.press(screen.getByTestId('setDark')); });
    await act(async () => { fireEvent.press(screen.getByTestId('setSystem')); });
    expect(screen.getByTestId('isDark').props.children).toBe('false'); // suit système=light
    expect(screen.getByTestId('pref').props.children).toBe('system');
  });
});

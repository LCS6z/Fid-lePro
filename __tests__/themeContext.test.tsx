import { render, screen } from '@testing-library/react-native';
import React from 'react';
import * as RN from 'react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { darkTheme, lightTheme } from '../constants/theme';

function ThemeConsumer() {
  const { theme, isDark } = useTheme();
  return (
    <>
      <Text testID="isDark">{String(isDark)}</Text>
      <Text testID="bg">{theme.background}</Text>
    </>
  );
}

describe('ThemeContext', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fournit le thème clair si colorScheme=light', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('isDark').props.children).toBe('false');
    expect(screen.getByTestId('bg').props.children).toBe(lightTheme.background);
  });

  it('fournit le thème sombre si colorScheme=dark', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('isDark').props.children).toBe('true');
    expect(screen.getByTestId('bg').props.children).toBe(darkTheme.background);
  });

  it('fournit le thème clair si colorScheme=null', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue(null);
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
    expect(screen.getByTestId('isDark').props.children).toBe('false');
    expect(screen.getByTestId('bg').props.children).toBe(lightTheme.background);
  });
});

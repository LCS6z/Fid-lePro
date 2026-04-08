import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { BiometricLock } from '../components/BiometricLock';

// ThemeContext mocké pour éviter les mises à jour AsyncStorage hors act()
jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      background: '#fff', surface: '#f5f5f5', text: '#000', textMuted: '#888',
      border: '#ddd', surfaceSecondary: '#eee',
    },
    isDark: false,
    themePreference: 'system',
    setThemePreference: jest.fn(),
  }),
}));

const renderLock = (onUnlock = jest.fn()) =>
  render(<BiometricLock onUnlock={onUnlock} />);

describe('BiometricLock', () => {
  it('affiche le titre et le bouton de déverrouillage', () => {
    renderLock();
    expect(screen.getByText('Application verrouillée')).toBeTruthy();
    expect(screen.getByText('Utilisez la biométrie pour continuer')).toBeTruthy();
    expect(screen.getByLabelText('Déverrouiller avec biométrie')).toBeTruthy();
  });

  it('appelle onUnlock au clic', async () => {
    const onUnlock = jest.fn().mockResolvedValue(true);
    renderLock(onUnlock);
    fireEvent.press(screen.getByLabelText('Déverrouiller avec biométrie'));
    await waitFor(() => expect(onUnlock).toHaveBeenCalled());
  });

  it('affiche le message d\'erreur si onUnlock retourne false', async () => {
    const onUnlock = jest.fn().mockResolvedValue(false);
    renderLock(onUnlock);
    fireEvent.press(screen.getByLabelText('Déverrouiller avec biométrie'));
    await waitFor(() => screen.getByText('Authentification échouée. Réessayez.'));
  });

  it('n\'affiche pas d\'erreur si onUnlock retourne true', async () => {
    const onUnlock = jest.fn().mockResolvedValue(true);
    renderLock(onUnlock);
    fireEvent.press(screen.getByLabelText('Déverrouiller avec biométrie'));
    await waitFor(() => expect(onUnlock).toHaveBeenCalled());
    expect(screen.queryByText('Authentification échouée. Réessayez.')).toBeNull();
  });

  it('désactive le bouton pendant la vérification', async () => {
    let resolve: (v: boolean) => void;
    const onUnlock = jest.fn(
      () => new Promise<boolean>(r => { resolve = r; })
    );
    renderLock(onUnlock);
    fireEvent.press(screen.getByLabelText('Déverrouiller avec biométrie'));
    await waitFor(() => screen.getByText('⏳ Vérification...'));
    const btn = screen.getByLabelText('Déverrouiller avec biométrie');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
    await waitFor(async () => { resolve!(true); });
  });
});

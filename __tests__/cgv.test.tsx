import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { router } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import CGV from '../app/cgv';

const renderScreen = async () => {
  render(
    <ThemeProvider>
      <CGV />
    </ThemeProvider>
  );
  await waitFor(() => screen.getByText('Conditions Générales'));
};

describe('CGV screen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('affiche le titre et les sections principales', async () => {
    await renderScreen();
    expect(screen.getByText('Conditions Générales')).toBeTruthy();
    expect(screen.getByText('1. Objet')).toBeTruthy();
    expect(screen.getByText('3. Tarification')).toBeTruthy();
    expect(screen.getByText('10. Contact')).toBeTruthy();
  });

  it('navigue en arrière sur Retour', async () => {
    await renderScreen();
    fireEvent.press(screen.getByText('← Retour'));
    expect(router.back).toHaveBeenCalled();
  });

  it('affiche la date de mise à jour', async () => {
    await renderScreen();
    expect(screen.getByText(/Dernière mise à jour/i)).toBeTruthy();
  });
});

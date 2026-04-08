import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import React from 'react';
import Onboarding from '../app/onboarding';

const renderScreen = () => render(<Onboarding />);

describe('Onboarding screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le premier slide au demarrage', () => {
    renderScreen();
    expect(screen.getByText('Bienvenue sur FidèlePro')).toBeTruthy();
  });

  it('affiche le bouton Suivant sur le premier slide', () => {
    renderScreen();
    expect(screen.getByText('Suivant \u2192')).toBeTruthy();
  });

  it('affiche le bouton Passer sur le premier slide', () => {
    renderScreen();
    expect(screen.getByText('Passer')).toBeTruthy();
  });

  it('passe au slide 2 apres Suivant', async () => {
    renderScreen();
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => {
      expect(screen.getByText('Scannez, cumulez')).toBeTruthy();
    });
  });

  it('passe au slide 3 apres deux Suivant', async () => {
    renderScreen();
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => screen.getByText('Scannez, cumulez'));
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => {
      expect(screen.getByText("Récoltez vos récompenses")).toBeTruthy();
    });
  });

  it("affiche C'est parti sur le dernier slide", async () => {
    renderScreen();
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => screen.getByText('Scannez, cumulez'));
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => screen.getByText("Récoltez vos récompenses"));
    expect(screen.getByText("C'est parti ! \uD83D\uDE80")).toBeTruthy();
  });

  it("Passer enregistre onboarding_done et redirige vers /login", async () => {
    renderScreen();
    fireEvent.press(screen.getByText('Passer'));
    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('onboarding_done', '1');
      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });

  it("C'est parti enregistre onboarding_done et redirige vers /login", async () => {
    renderScreen();
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => screen.getByText('Scannez, cumulez'));
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => screen.getByText("Récoltez vos récompenses"));
    fireEvent.press(screen.getByText("C'est parti ! \uD83D\uDE80"));
    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('onboarding_done', '1');
      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });

  it("le dernier slide n'a pas de bouton Passer", async () => {
    renderScreen();
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => screen.getByText('Scannez, cumulez'));
    fireEvent.press(screen.getByText('Suivant \u2192'));
    await waitFor(() => screen.getByText("Récoltez vos récompenses"));
    expect(screen.queryByText('Passer')).toBeNull();
  });
});

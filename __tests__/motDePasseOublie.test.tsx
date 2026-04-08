import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import MotDePasseOublie from '../app/mot-de-passe-oublie';
import { apiClient } from '../lib/api';
import * as SecureStore from 'expo-secure-store';

jest.mock('../lib/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
  API_BASE_URL: 'https://fid-lepro-production.up.railway.app',
}));

const renderScreen = () => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  render(
    <ThemeProvider>
      <AuthProvider>
        <MotDePasseOublie />
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('MotDePasseOublie screen', () => {
  beforeEach(() => { jest.clearAllMocks(); cleanup(); });

  describe('étape 1 — email', () => {
    it('affiche le formulaire email', () => {
      renderScreen();
      expect(screen.getByText('Récupération')).toBeTruthy();
      expect(screen.getByPlaceholderText('Adresse email')).toBeTruthy();
      expect(screen.getByText('Envoyer le code →')).toBeTruthy();
    });

    it('toast si email vide', async () => {
      renderScreen();
      fireEvent.press(screen.getByText('Envoyer le code →'));
      await waitFor(() => screen.getByText('Entrez votre adresse email'));
    });

    it('toast si email invalide', async () => {
      renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'pasunemail');
      fireEvent.press(screen.getByText('Envoyer le code →'));
      await waitFor(() => screen.getByText('Adresse email invalide'));
    });

    it('passe à l étape code même si API échoue (sécurité)', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('err'));
      renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'test@test.fr');
      fireEvent.press(screen.getByText('Envoyer le code →'));
      await waitFor(() => screen.getByText('Code reçu ?'));
    });

    it('passe à l étape code si API réussit', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});
      renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'test@test.fr');
      fireEvent.press(screen.getByText('Envoyer le code →'));
      await waitFor(() => screen.getByText('Code reçu ?'));
    });
  });

  describe('étape 2 — code', () => {
    const goToCode = async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});
      renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'test@test.fr');
      fireEvent.press(screen.getByText('Envoyer le code →'));
      await waitFor(() => screen.getByText('Code reçu ?'));
    };

    it('toast si code trop court', async () => {
      await goToCode();
      fireEvent.changeText(screen.getByPlaceholderText('Code à 6 chiffres'), '12');
      fireEvent.press(screen.getByText('Vérifier →'));
      await waitFor(() => screen.getByText('Entrez le code reçu par email'));
    });

    it('toast erreur si code invalide', async () => {
      // mock 1: envoi email OK, mock 2: vérif code KO
      (apiClient.post as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('invalid'));
      renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'test@test.fr');
      fireEvent.press(screen.getByText('Envoyer le code →'));
      await waitFor(() => screen.getByPlaceholderText('Code à 6 chiffres'));
      fireEvent.changeText(screen.getByPlaceholderText('Code à 6 chiffres'), '123456');
      fireEvent.press(screen.getByText('Vérifier →'));
      await waitFor(() => screen.getByText('Code invalide ou expiré'));
    });

    it('passe à l étape nouveau mdp si code valide', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});
      await goToCode();
      fireEvent.changeText(screen.getByPlaceholderText('Code à 6 chiffres'), '123456');
      fireEvent.press(screen.getByText('Vérifier →'));
      await waitFor(() => screen.getByText('Nouveau mot de passe'));
    });

    it('retour à l étape email avec Renvoyer le code', async () => {
      await goToCode();
      fireEvent.press(screen.getByText('Renvoyer le code'));
      await waitFor(() => screen.getByText('Récupération'));
    });
  });

  describe('étape 3 — nouveau mot de passe', () => {
    const goToNewMdp = async () => {
      (apiClient.post as jest.Mock)
        .mockResolvedValueOnce({}) // envoi email
        .mockResolvedValueOnce({}); // vérif code
      renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'test@test.fr');
      fireEvent.press(screen.getByText('Envoyer le code →'));
      await waitFor(() => screen.getByPlaceholderText('Code à 6 chiffres'));
      fireEvent.changeText(screen.getByPlaceholderText('Code à 6 chiffres'), '123456');
      fireEvent.press(screen.getByText('Vérifier →'));
      await waitFor(() => screen.getByText('Nouveau mot de passe'));
    };

    it('toast si champs vides', async () => {
      await goToNewMdp();
      fireEvent.press(screen.getByText('Réinitialiser →'));
      await waitFor(() => screen.getByText('Remplissez tous les champs'));
    });

    it('toast si mdp différents', async () => {
      await goToNewMdp();
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'abc12345');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le mot de passe'), 'different');
      fireEvent.press(screen.getByText('Réinitialiser →'));
      await waitFor(() => screen.getByText('Les mots de passe ne correspondent pas'));
    });

    it('toast si mdp trop court', async () => {
      await goToNewMdp();
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'abc');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le mot de passe'), 'abc');
      fireEvent.press(screen.getByText('Réinitialiser →'));
      await waitFor(() => expect(screen.getAllByText(/8 caractères/).length).toBeGreaterThan(0));
    });

    it('toast erreur si API de réinitialisation échoue', async () => {
      await goToNewMdp();
      (apiClient.post as jest.Mock).mockRejectedValueOnce({ response: { data: { message: 'Code expiré' } } });
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'nouveau123');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le mot de passe'), 'nouveau123');
      fireEvent.press(screen.getByText('Réinitialiser →'));
      await waitFor(() => screen.getByText('Code expiré'));
    });

    it('affiche l écran succès si API réussit', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});
      await goToNewMdp();
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'nouveau123');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le mot de passe'), 'nouveau123');
      fireEvent.press(screen.getByText('Réinitialiser →'));
      await waitFor(() => screen.getByText('Mot de passe modifié !'));
    });

    it('redirige vers /login depuis l écran succès', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});
      await goToNewMdp();
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'nouveau123');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le mot de passe'), 'nouveau123');
      fireEvent.press(screen.getByText('Réinitialiser →'));
      await waitFor(() => screen.getByText('Se connecter →'));
      fireEvent.press(screen.getByText('Se connecter →'));
      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });

  describe('navigation', () => {
    it('bouton Retour appelle router.back', () => {
      renderScreen();
      fireEvent.press(screen.getByLabelText('Retour'));
      expect(router.back).toHaveBeenCalled();
    });
  });
});

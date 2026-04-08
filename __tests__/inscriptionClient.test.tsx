import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import InscriptionClient from '../app/inscription-client';
import { apiClient } from '../lib/api';

jest.mock('../lib/api', () => ({
  apiClient: { post: jest.fn() },
  API_BASE_URL: 'https://fid-lepro-production.up.railway.app',
}));

jest.spyOn(Alert, 'alert');

const renderScreen = async () => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  render(
    <AuthProvider>
      <InscriptionClient />
    </AuthProvider>
  );
  await waitFor(() => screen.getByText('Créer mon compte →'));
};

describe('InscriptionClient screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validation', () => {
    it('alerte si tous les champs sont vides', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Créer mon compte →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Tous les champs sont obligatoires');
      });
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("alerte si l'email est manquant", async () => {
      await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Prénom et nom'), 'Jean Dupont');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Créer mon compte →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Tous les champs sont obligatoires');
      });
    });

    it('alerte si le nom est manquant', async () => {
      await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'jean@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Créer mon compte →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Tous les champs sont obligatoires');
      });
    });
  });

  describe('inscription réussie', () => {
    it('appelle le bon endpoint avec les bons paramètres', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });

      await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Prénom et nom'), 'Jean Dupont');
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'jean@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Créer mon compte →'));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/api/auth/inscription/client',
          { nom: 'Jean Dupont', email: 'jean@test.fr', password: 'pass123' }
        );
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Compte créé !',
        'Bienvenue sur FidèlePro !',
        expect.any(Array)
      );
    });
  });

  describe('erreur serveur', () => {
    it("affiche le message d'erreur de l'API", async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: 'Email déjà utilisé' } },
      });

      await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Prénom et nom'), 'Jean');
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'existant@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Créer mon compte →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Email déjà utilisé');
      });
    });

    it('affiche un message générique si pas de message API', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Prénom et nom'), 'Jean');
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'jean@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Créer mon compte →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Email déjà utilisé ou problème serveur'
        );
      });
    });
  });

  describe('navigation', () => {
    it('lien retour redirige vers /login', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Déjà un compte ? Se connecter'));
      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });
});

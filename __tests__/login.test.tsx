import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import Login from '../app/login';
import { apiClient } from '../lib/api';

jest.mock('../lib/api', () => ({
  apiClient: { post: jest.fn() },
  API_BASE_URL: 'https://fid-lepro-production.up.railway.app',
}));

jest.spyOn(Alert, 'alert');

// Rend le screen et attend que l'AuthContext finisse de se restaurer
const renderLogin = async () => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  render(
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
  // Attend que le bouton soit disponible (AuthContext chargé)
  await waitFor(() => screen.getByText('Se connecter →'));
};

describe('Login screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validation du formulaire', () => {
    it('alerte si les champs sont vides', async () => {
      await renderLogin();
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs');
      });
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("n'appelle pas l'API si le mot de passe est vide", async () => {
      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'test@test.fr');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('connexion commerçant', () => {
    it('redirige vers /dashboard-commercant en cas de succès', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { token: 'tok_commercant' } });

      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/dashboard-commercant');
      });
    });

    it("alerte 'Compte suspendu' si statut=suspendu", async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { statut: 'suspendu' } },
      });

      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Compte suspendu',
          'Votre compte est suspendu. Contactez le support.'
        );
      });
    });

    it("alerte 'Compte en attente' si statut=inactif", async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { statut: 'inactif' } },
      });
      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Compte en attente', expect.any(String));
      });
    });

    it("alerte 'Compte résilié' si statut=résilié", async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { statut: 'résilié' } },
      });
      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Compte résilié', expect.any(String));
      });
    });

    it("alerte 'Paiement en attente' si statut=impayé", async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { statut: 'impayé' } },
      });

      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Paiement en attente',
          'Votre abonnement est impayé. Souhaitez-vous régler votre situation maintenant ?',
          expect.any(Array)
        );
      });
    });
  });

  describe('connexion client (fallback)', () => {
    it('redirige vers /dashboard-client si commerçant échoue puis client réussit', async () => {
      (apiClient.post as jest.Mock)
        .mockRejectedValueOnce({ response: { status: 401, data: {} } })
        .mockResolvedValueOnce({ data: { token: 'tok_client' } });

      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'user@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/dashboard-client');
      });
    });

    it('alerte si les deux tentatives échouent', async () => {
      (apiClient.post as jest.Mock)
        .mockRejectedValueOnce({ response: { status: 401, data: {} } })
        .mockRejectedValueOnce({ response: { status: 401, data: {} } });

      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'bad@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'wrong');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Email ou mot de passe incorrect');
      });
    });
  });

  describe('mot de passe oublié', () => {
    it('navigue vers /mot-de-passe-oublie', async () => {
      await renderLogin();
      fireEvent.press(screen.getByText('Mot de passe oublié ?'));
      expect(router.push).toHaveBeenCalledWith('/mot-de-passe-oublie');
    });
  });

  describe('relance paiement impayé', () => {
    it('alerte si relance-paiement echoue', async () => {
      (apiClient.post as jest.Mock)
        .mockRejectedValueOnce({ response: { data: { statut: 'impayé' } } })
        .mockRejectedValueOnce(new Error('Network'));

      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Paiement en attente', expect.any(String), expect.any(Array)));

      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
      const btn = buttons.find((b: any) => b.text === 'Régler maintenant');
      await btn.onPress();

      await waitFor(() =>
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de générer le lien de paiement. Contactez le support.')
      );
    });

    it('n ouvre pas Linking si checkoutUrl absent', async () => {
      const { Linking } = require('react-native');
      jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
      (apiClient.post as jest.Mock)
        .mockRejectedValueOnce({ response: { data: { statut: 'impayé' } } })
        .mockResolvedValueOnce({ data: {} }); // pas de checkoutUrl

      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Paiement en attente', expect.any(String), expect.any(Array)));

      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
      const btn = buttons.find((b: any) => b.text === 'Régler maintenant');
      await btn.onPress();

      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('appelle relance-paiement et ouvre Linking si URL dispo', async () => {
      const { Linking } = require('react-native');
      jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
      (apiClient.post as jest.Mock)
        .mockRejectedValueOnce({ response: { data: { statut: 'impayé' } } })
        .mockResolvedValueOnce({ data: { checkoutUrl: 'https://stripe.com/pay/abc' } });

      await renderLogin();
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe'), 'pass123');
      fireEvent.press(screen.getByText('Se connecter →'));

      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Paiement en attente', expect.any(String), expect.any(Array)));

      // Simule le tap "Régler maintenant"
      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
      const btn = buttons.find((b: any) => b.text === 'Régler maintenant');
      await btn.onPress();

      await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith('https://stripe.com/pay/abc'));
    });
  });

  describe('navigation', () => {
    it('lien inscription client pousse /inscription-client', async () => {
      await renderLogin();
      fireEvent.press(screen.getByText("S'inscrire en tant que client"));
      expect(router.push).toHaveBeenCalledWith('/inscription-client');
    });

    it('lien inscription commerçant pousse /inscription-commercant', async () => {
      await renderLogin();
      fireEvent.press(screen.getByText("S'inscrire en tant que commerçant"));
      expect(router.push).toHaveBeenCalledWith('/inscription-commercant');
    });
  });
});

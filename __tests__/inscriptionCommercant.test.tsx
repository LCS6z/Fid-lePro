import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import InscriptionCommercant from '../app/inscription-commercant';
import { apiClient } from '../lib/api';

jest.mock('../lib/api', () => ({
  apiClient: { post: jest.fn() },
  API_BASE_URL: 'https://fid-lepro-production.up.railway.app',
}));

jest.spyOn(Alert, 'alert');
jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

const renderScreen = async () => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  render(
    <AuthProvider>
      <InscriptionCommercant />
    </AuthProvider>
  );
  await waitFor(() => screen.getByText('Continuer \u2192'));
};

// Remplit et valide l'etape 1
const passerEtape1 = async (nom = 'Ma Boulangerie', email = 'shop@test.fr', password = 'pass123') => {
  fireEvent.changeText(screen.getByPlaceholderText('Nom du commerce'), nom);
  fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), email);
  fireEvent.changeText(screen.getByPlaceholderText('Mot de passe (6 caractères min)'), password);
  fireEvent.press(screen.getByText('Continuer \u2192'));
  await waitFor(() => screen.getByPlaceholderText('Téléphone'));
};

// Remplit et valide l'etape 2
const passerEtape2 = async () => {
  fireEvent.changeText(screen.getByPlaceholderText('Téléphone'), '0612345678');
  fireEvent.changeText(screen.getByPlaceholderText('Adresse du commerce'), '1 rue du Pain');
  fireEvent.changeText(screen.getByPlaceholderText('Type de commerce (ex: Restaurant, Café...)'), 'Boulangerie');
  fireEvent.press(screen.getByText('Continuer \u2192'));
  await waitFor(() => screen.getByText('\uD83D\uDCB3 Payer 150\u20AC'));
};

describe('InscriptionCommercant screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("etape 1 - validation", () => {
    it("alerte si tous les champs etape 1 sont vides", async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Continuer \u2192'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Tous les champs sont obligatoires');
      });
    });

    it("alerte si le mot de passe fait moins de 6 caracteres", async () => {
      await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('Nom du commerce'), 'Shop');
      fireEvent.changeText(screen.getByPlaceholderText('Adresse email'), 'shop@test.fr');
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe (6 caractères min)'), '123');
      fireEvent.press(screen.getByText('Continuer \u2192'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Le mot de passe doit faire au moins 6 caractères'
        );
      });
    });

    it("passe a l'etape 2 si les champs sont valides", async () => {
      await renderScreen();
      await passerEtape1();

      expect(screen.getByPlaceholderText('Téléphone')).toBeTruthy();
    });
  });

  describe("etape 2 - validation", () => {
    it("alerte si les champs etape 2 sont vides", async () => {
      await renderScreen();
      await passerEtape1();
      fireEvent.press(screen.getByText('Continuer \u2192'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Tous les champs sont obligatoires');
      });
    });

    it("Retour revient a l'etape 1", async () => {
      await renderScreen();
      await passerEtape1();
      fireEvent.press(screen.getByText('\u2190 Retour'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nom du commerce')).toBeTruthy();
      });
    });

    it("passe a l'etape 3 si les champs sont valides", async () => {
      await renderScreen();
      await passerEtape1();
      await passerEtape2();

      expect(screen.getByText('\uD83D\uDCB3 Payer 150\u20AC')).toBeTruthy();
    });
  });

  describe("etape 3 - paiement", () => {
    it("appelle l'API avec les bons parametres apres acceptation CGV", async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { checkoutUrl: 'https://stripe.com/pay/test' },
      });

      await renderScreen();
      await passerEtape1();
      await passerEtape2();

      fireEvent.press(screen.getByTestId('cgv-toggle'));
      fireEvent.press(screen.getByText('\uD83D\uDCB3 Payer 150\u20AC'));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/api/stripe/inscription-commercant',
          {
            nom: 'Ma Boulangerie',
            email: 'shop@test.fr',
            password: 'pass123',
            telephone: '0612345678',
            adresse: '1 rue du Pain',
            typeCommerce: 'Boulangerie',
          }
        );
      });
    });

    it("ouvre l'URL Stripe apres succes", async () => {
      const checkoutUrl = 'https://stripe.com/pay/test_abc';
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { checkoutUrl } });

      await renderScreen();
      await passerEtape1();
      await passerEtape2();

      fireEvent.press(screen.getByTestId('cgv-toggle'));
      fireEvent.press(screen.getByText('\uD83D\uDCB3 Payer 150\u20AC'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '\u2705 Compte créé !',
          expect.stringContaining('paiement sécurisé'),
          expect.any(Array)
        );
      });

      // Simule le clic sur "Proceder au paiement" dans l'Alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2] as Array<{ text: string; onPress?: () => void }>;
      buttons[0].onPress?.();
      expect(Linking.openURL).toHaveBeenCalledWith(checkoutUrl);
    });

    it("affiche le message d'erreur API en cas d'echec", async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { erreur: 'Email déjà utilisé' } },
      });

      await renderScreen();
      await passerEtape1();
      await passerEtape2();

      fireEvent.press(screen.getByTestId('cgv-toggle'));
      fireEvent.press(screen.getByText('\uD83D\uDCB3 Payer 150\u20AC'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Email déjà utilisé');
      });
    });

    it("affiche Erreur serveur si pas de message API", async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      await renderScreen();
      await passerEtape1();
      await passerEtape2();

      fireEvent.press(screen.getByTestId('cgv-toggle'));
      fireEvent.press(screen.getByText('\uD83D\uDCB3 Payer 150\u20AC'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Erreur serveur');
      });
    });

    it("le bouton paiement est desactive si CGV non acceptees", async () => {
      await renderScreen();
      await passerEtape1();
      await passerEtape2();
      // Ne coche pas la case CGV
      const btn = screen.getByText('\uD83D\uDCB3 Payer 150\u20AC');
      fireEvent.press(btn);
      // Le bouton est disabled → l'API ne doit pas être appelée
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("Retour depuis etape 3 revient a l'etape 2", async () => {
      await renderScreen();
      await passerEtape1();
      await passerEtape2();
      fireEvent.press(screen.getByText('\u2190 Retour'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Téléphone')).toBeTruthy();
      });
    });
  });

  describe("navigation", () => {
    it("lien retour redirige vers /login", async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Déjà un compte ? Se connecter'));
      expect(router.replace).toHaveBeenCalledWith('/login');
    });

    it("lien CGV pousse vers /cgv", async () => {
      await renderScreen();
      await passerEtape1();
      await passerEtape2();
      fireEvent.press(screen.getByText('conditions générales de vente'));
      expect(router.push).toHaveBeenCalledWith('/cgv');
    });
  });
});

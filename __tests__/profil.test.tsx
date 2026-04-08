import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Profil from '../app/profil';
import { apiClient } from '../lib/api';

jest.mock('../lib/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
  API_BASE_URL: 'https://fid-lepro-production.up.railway.app',
}));

jest.spyOn(Alert, 'alert');

const renderScreen = async () => {
  (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
    if (key === 'token') return Promise.resolve('tok_test');
    if (key === 'role') return Promise.resolve('client');
    return Promise.resolve(null);
  });
  render(
    <ThemeProvider>
      <AuthProvider>
        <Profil />
      </AuthProvider>
    </ThemeProvider>
  );
  await waitFor(() => screen.getByText('Paramètres'));
};

describe('Profil screen', () => {
  beforeEach(async () => { jest.clearAllMocks(); cleanup(); await AsyncStorage.clear(); });

  describe('affichage', () => {
    it('affiche les sections principales', async () => {
      await renderScreen();
      expect(screen.getByText('Changer le mot de passe')).toBeTruthy();
      expect(screen.getByText('Conditions générales')).toBeTruthy();
      expect(screen.getByText('Se déconnecter')).toBeTruthy();
      expect(screen.getByText('Supprimer mon compte')).toBeTruthy();
    });

    it('affiche la section Apparence avec 3 options', async () => {
      await renderScreen();
      expect(screen.getByText('🎨 Apparence')).toBeTruthy();
      expect(screen.getByText('☀️ Clair')).toBeTruthy();
      expect(screen.getByText('⚙️ Auto')).toBeTruthy();
      expect(screen.getByText('🌙 Sombre')).toBeTruthy();
    });

    it('navigue vers /cgv sur Conditions générales', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Conditions générales'));
      expect(router.push).toHaveBeenCalledWith('/cgv');
    });

    it('navigue en arrière sur Retour', async () => {
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Retour'));
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('changement de mot de passe', () => {
    it('ouvre le formulaire sur tap', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Changer le mot de passe'));
      await waitFor(() => screen.getByPlaceholderText('Mot de passe actuel'));
    });

    it('affiche toast si champs vides', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Changer le mot de passe'));
      await waitFor(() => screen.getByText('Enregistrer'));
      fireEvent.press(screen.getByText('Enregistrer'));
      await waitFor(() => screen.getByText(/Remplissez tous les champs/));
    });

    it('affiche toast si mots de passe différents', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Changer le mot de passe'));
      await waitFor(() => screen.getByPlaceholderText('Mot de passe actuel'));
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe actuel'), 'ancien123');
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'nouveau123');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le nouveau mot de passe'), 'different123');
      fireEvent.press(screen.getByText('Enregistrer'));
      await waitFor(() => screen.getByText(/ne correspondent pas/));
    });

    it('affiche toast si mot de passe trop court', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Changer le mot de passe'));
      await waitFor(() => screen.getByPlaceholderText('Mot de passe actuel'));
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe actuel'), 'ancien123');
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'abc');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le nouveau mot de passe'), 'abc');
      fireEvent.press(screen.getByText('Enregistrer'));
      await waitFor(() => screen.getByText(/8 caractères/));
    });

    it('soumet avec succès et ferme le formulaire', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});
      await renderScreen();
      fireEvent.press(screen.getByText('Changer le mot de passe'));
      await waitFor(() => screen.getByPlaceholderText('Mot de passe actuel'));
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe actuel'), 'ancien123');
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'nouveau123');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le nouveau mot de passe'), 'nouveau123');
      fireEvent.press(screen.getByText('Enregistrer'));
      await waitFor(() => screen.getByText(/modifié avec succès/));
    });

    it('affiche toast erreur si API échoue', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({ response: { data: { message: 'Mot de passe incorrect' } } });
      await renderScreen();
      fireEvent.press(screen.getByText('Changer le mot de passe'));
      await waitFor(() => screen.getByPlaceholderText('Mot de passe actuel'));
      fireEvent.changeText(screen.getByPlaceholderText('Mot de passe actuel'), 'mauvais');
      fireEvent.changeText(screen.getByPlaceholderText('Nouveau mot de passe'), 'nouveau123');
      fireEvent.changeText(screen.getByPlaceholderText('Confirmer le nouveau mot de passe'), 'nouveau123');
      fireEvent.press(screen.getByText('Enregistrer'));
      await waitFor(() => screen.getByText('Mot de passe incorrect'));
    });
  });

  describe('déconnexion', () => {
    it('affiche une confirmation avant déconnexion', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Se déconnecter'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Déconnexion', expect.any(String), expect.any(Array));
      });
    });
  });

  describe('suppression de compte', () => {
    it('affiche une confirmation avant suppression', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('Supprimer mon compte'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Supprimer mon compte',
          expect.stringContaining('irréversible'),
          expect.any(Array)
        );
      });
    });

    it('affiche toast erreur si suppression échoue', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(new Error('Network'));
      await renderScreen();

      (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons: any[]) => {
        const btn = buttons.find((b: any) => b.text === 'Supprimer');
        btn?.onPress?.();
      });

      fireEvent.press(screen.getByText('Supprimer mon compte'));
      await waitFor(() => screen.getByText(/Impossible de supprimer/i));
    });

    it('supprime le compte et redirige vers /login', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({});
      await renderScreen();

      // Simule la confirmation directement
      (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons: any[]) => {
        const btn = buttons.find((b: any) => b.text === 'Supprimer');
        btn?.onPress?.();
      });

      fireEvent.press(screen.getByText('Supprimer mon compte'));
      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/api/auth/compte');
        expect(router.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('apparence', () => {
    it('sélectionne le thème clair', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('☀️ Clair'));
      // La préférence est persistée en AsyncStorage
      await waitFor(async () => {
        const val = await AsyncStorage.getItem('fidelepro_theme_preference');
        expect(val).toBe('light');
      });
    });

    it('sélectionne le thème sombre', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('🌙 Sombre'));
      await waitFor(async () => {
        const val = await AsyncStorage.getItem('fidelepro_theme_preference');
        expect(val).toBe('dark');
      });
    });

    it('sélectionne le mode automatique', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('⚙️ Auto'));
      await waitFor(async () => {
        const val = await AsyncStorage.getItem('fidelepro_theme_preference');
        expect(val).toBe('system');
      });
    });
  });
});

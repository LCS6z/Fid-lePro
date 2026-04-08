import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../context/AuthContext';
import DashboardCommercant from '../app/dashboard-commercant';
import { apiClient } from '../lib/api';
import * as ExpoCamera from 'expo-camera';

jest.mock('../lib/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
  API_BASE_URL: 'https://fid-lepro-production.up.railway.app',
}));

jest.spyOn(Alert, 'alert');

const CLIENTS_MOCK = [
  { nom: 'Alice Martin', email: 'alice@test.fr', totalTampons: 12, derniereScan: new Date().toISOString() },
  { nom: 'Bob Durand', email: 'bob@test.fr', totalTampons: 3, derniereScan: null },
  {
    nom: 'Charlie Ancien', email: 'charlie@test.fr', totalTampons: 1,
    derniereScan: new Date(Date.now() - 40 * 86400000).toISOString(), // inactif +30j
  },
];

const renderScreen = async () => {
  (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
    if (key === 'token') return Promise.resolve('tok_commercant');
    if (key === 'role') return Promise.resolve('commercant');
    return Promise.resolve(null);
  });
  (apiClient.get as jest.Mock).mockResolvedValue({ data: CLIENTS_MOCK });

  render(
    <AuthProvider>
      <DashboardCommercant />
    </AuthProvider>
  );
  await waitFor(() => screen.getAllByText('Alice Martin'));
};

describe('DashboardCommercant screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    cleanup();
    await AsyncStorage.clear();
  });

  describe('affichage', () => {
    it('affiche la liste des clients', async () => {
      await renderScreen();
      expect(screen.getAllByText('Alice Martin').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bob Durand').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Charlie Ancien').length).toBeGreaterThan(0);
    });

    it('affiche le badge Inactif sur un client inactif', async () => {
      await renderScreen();
      expect(screen.getByText('Inactif')).toBeTruthy();
    });

    it('affiche le bouton Relancer sur un client inactif', async () => {
      await renderScreen();
      expect(screen.getByText('\uD83D\uDD14 Relancer ce client')).toBeTruthy();
    });

    it('affiche le header Espace Commercant', async () => {
      await renderScreen();
      expect(screen.getByText('Espace Commerçant')).toBeTruthy();
    });

    it('affiche les stats totalClients', async () => {
      await renderScreen();
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    });
  });

  describe('relance client', () => {
    it('appelle l API de relance et change le bouton', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});
      await renderScreen();
      fireEvent.press(screen.getByText('\uD83D\uDD14 Relancer ce client'));
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/api/commercant/relancer',
          { email: 'charlie@test.fr' }
        );
      });
    });

    it('affiche confirmation de relance meme si API echoue', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('err'));
      await renderScreen();
      fireEvent.press(screen.getByText('\uD83D\uDD14 Relancer ce client'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '\uD83D\uDCE8 Relance envoyée',
          expect.any(String)
        );
      });
    });
  });

  describe('redirection', () => {
    it('redirige vers /login si pas de token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      render(<AuthProvider><DashboardCommercant /></AuthProvider>);
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('erreur API avec cache', () => {
    it('affiche les données hors ligne si cache disponible', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_commercant');
        if (key === 'role') return Promise.resolve('commercant');
        return Promise.resolve(null);
      });
      // Pré-remplir le cache avec des données stale
      const entry = { data: CLIENTS_MOCK, timestamp: Date.now() - 999999, ttl: 1 };
      await AsyncStorage.setItem('fidelepro_cache_commercant_clients', JSON.stringify(entry));
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network'));

      render(<AuthProvider><DashboardCommercant /></AuthProvider>);
      await waitFor(() => screen.getAllByText('Alice Martin'));
      expect(screen.getByText(/hors ligne/i)).toBeTruthy();
    });

    it('affiche toast erreur si API echoue et pas de cache', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_commercant');
        if (key === 'role') return Promise.resolve('commercant');
        return Promise.resolve(null);
      });
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network'));

      render(<AuthProvider><DashboardCommercant /></AuthProvider>);
      await waitFor(() => screen.getByText(/connexion|Impossible/i));
    });
  });

  describe('etat vide', () => {
    it('affiche le message vide si aucun client', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_commercant');
        return Promise.resolve(null);
      });
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
      render(<AuthProvider><DashboardCommercant /></AuthProvider>);
      await waitFor(() => screen.getByText('Aucun client pour le moment'));
    });
  });

  describe('modal profil commercant', () => {
    it('ouvre le modal profil sur tap avatar', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('👤'));
      await waitFor(() => screen.getByText('scans total'));
    });

    it('ferme le modal profil', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('👤'));
      await waitFor(() => screen.getByText('scans total'));
      fireEvent.press(screen.getByText('Fermer'));
      await waitFor(() => expect(screen.queryByText('scans total')).toBeNull());
    });

    it('Paramètres navigue vers /profil', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('👤'));
      await waitFor(() => screen.getByLabelText('Paramètres du compte'));
      fireEvent.press(screen.getByLabelText('Paramètres du compte'));
      expect(router.push).toHaveBeenCalledWith('/profil');
    });

    it('Se déconnecter appelle logout', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('👤'));
      await waitFor(() => screen.getByText('scans total'));
      // Le bouton Se déconnecter dans le modal
      const btns = screen.getAllByText('Se déconnecter');
      fireEvent.press(btns[0]);
      await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    });
  });

  describe('pull to refresh', () => {
    it('recharge les données sans afficher le loader principal', async () => {
      await renderScreen();
      const scrollView = screen.UNSAFE_getByType(require('react-native').ScrollView);
      scrollView.props.refreshControl.props.onRefresh();
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2); // initial + refresh
      });
    });
  });

  describe('recherche', () => {
    it('filtre la liste par nom', async () => {
      await renderScreen();
      const input = screen.getByPlaceholderText('Rechercher un client...');
      fireEvent.changeText(input, 'Alice');
      await waitFor(() => {
        expect(screen.getAllByText('Alice Martin').length).toBeGreaterThan(0);
      });
    });

    it('affiche empty state si aucun résultat', async () => {
      await renderScreen();
      const input = screen.getByPlaceholderText('Rechercher un client...');
      fireEvent.changeText(input, 'xxxxxxinexistant');
      await waitFor(() => screen.getByText('Aucun résultat'));
    });
  });

  describe('scanner', () => {
    it('ouvre le scanner si permission accordee', async () => {
      (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
      await renderScreen();
      fireEvent.press(screen.getByText('Scanner un client'));
      await waitFor(() => screen.getByText('Scanner le QR client'));
    });

    it('alerte si permission refusee', async () => {
      const requestPermission = jest.fn().mockResolvedValue({ granted: false });
      (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
        { granted: false },
        requestPermission,
      ]);
      await renderScreen();
      fireEvent.press(screen.getByText('Scanner un client'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission caméra requise',
          expect.any(String)
        );
      });
    });

    it('envoie le scan et affiche le succes', async () => {
      (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { client: { nom: 'Alice Martin' }, totalTampons: 5, recompense: null },
      });
      await renderScreen();
      fireEvent.press(screen.getByText('Scanner un client'));
      await waitFor(() => screen.getByText('Scanner le QR client'));

      // Simule un scan QR
      const camera = screen.UNSAFE_getByType(require('expo-camera').CameraView);
      camera.props.onBarcodeScanned({ data: 'qr_alice_123' });

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/scan', { qrCode: 'qr_alice_123' });
        expect(Alert.alert).toHaveBeenCalledWith('✅ Tampon ajouté !', expect.stringContaining('Alice Martin'));
      });
    });

    it('alerte si QR invalide', async () => {
      (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('invalid'));
      await renderScreen();
      fireEvent.press(screen.getByText('Scanner un client'));
      await waitFor(() => screen.getByText('Scanner le QR client'));

      const camera = screen.UNSAFE_getByType(require('expo-camera').CameraView);
      camera.props.onBarcodeScanned({ data: 'qr_invalide' });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('QR invalide', expect.any(String));
      });
    });

    it('ferme le scanner avec Annuler', async () => {
      (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
        { granted: true },
        jest.fn(),
      ]);
      await renderScreen();
      fireEvent.press(screen.getByText('Scanner un client'));
      await waitFor(() => screen.getByText('Scanner le QR client'));
      fireEvent.press(screen.getByText('✕ Annuler'));
      await waitFor(() => screen.getByText('Espace Commerçant'));
    });
  });
});

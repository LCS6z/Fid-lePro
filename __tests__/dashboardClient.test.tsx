import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import DashboardClient from '../app/dashboard-client';
import { apiClient } from '../lib/api';

jest.mock('../lib/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
  API_BASE_URL: 'https://fid-lepro-production.up.railway.app',
}));

jest.mock('../hooks/useOffline', () => ({
  useOffline: () => false,
}));
jest.mock('../hooks/useNotifications', () => () => undefined);

jest.spyOn(Alert, 'alert');
jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

const PROFIL_MOCK = { nom: 'Jean Dupont', qrCode: 'qr_jean_123' };
const TAMPONS_MOCK = [
  {
    carteId: 'carte1',
    carteName: 'Carte Café',
    commercant: { id: 'com1', nom: 'Le Bon Café' },
    nombreTampons: 3,
    maxTampons: 5,
    recompense: 10,
  },
  {
    carteId: 'carte2',
    carteName: 'Carte VIP',
    commercant: { id: 'com2', nom: 'La Pizzeria' },
    nombreTampons: 5,
    maxTampons: 5,
    recompense: null,
  },
];

const renderScreen = async () => {
  (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
    if (key === 'token') return Promise.resolve('tok_test');
    if (key === 'role') return Promise.resolve('client');
    return Promise.resolve(null);
  });
  (apiClient.get as jest.Mock).mockImplementation((url: string) => {
    if (url === '/api/client/profil') return Promise.resolve({ data: PROFIL_MOCK });
    if (url === '/api/client/tampons') return Promise.resolve({ data: TAMPONS_MOCK });
    return Promise.resolve({ data: [] });
  });

  render(
    <ThemeProvider>
      <AuthProvider>
        <DashboardClient />
      </AuthProvider>
    </ThemeProvider>
  );
  await waitFor(() => screen.getByText('Le Bon Café'));
};

describe('DashboardClient screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('affichage', () => {
    it('affiche le prenom du client dans le header', async () => {
      await renderScreen();
      expect(screen.getByText(/Bonjour.*Jean/)).toBeTruthy();
    });

    it('affiche les cartes de tampons', async () => {
      await renderScreen();
      expect(screen.getByText('Le Bon Café')).toBeTruthy();
      expect(screen.getByText('La Pizzeria')).toBeTruthy();
    });

    it('affiche les stats rapides dans le header', async () => {
      await renderScreen();
      expect(screen.getByText('2')).toBeTruthy(); // 2 cartes
    });

    it('affiche le badge Dispo sur une carte complete', async () => {
      await renderScreen();
      expect(screen.getByText('\uD83C\uDF81 Dispo')).toBeTruthy();
    });
  });

  describe('etat vide', () => {
    it('affiche le message vide si aucun tampon', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_test');
        return Promise.resolve(null);
      });
      (apiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/client/profil') return Promise.resolve({ data: PROFIL_MOCK });
        if (url === '/api/client/tampons') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      render(<AuthProvider><DashboardClient /></AuthProvider>);
      await waitFor(() => screen.getByText('Aucun tampon pour le moment'));
    });
  });

  describe('redirection', () => {
    it('redirige vers /login si pas de token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      render(<AuthProvider><DashboardClient /></AuthProvider>);
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('erreur API', () => {
    it('affiche un toast si le chargement echoue', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_test');
        return Promise.resolve(null);
      });
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network'));
      render(
        <ThemeProvider>
          <AuthProvider><DashboardClient /></AuthProvider>
        </ThemeProvider>
      );
      await waitFor(() => {
        expect(screen.getByText(/connexion|hors ligne/i)).toBeTruthy();
      });
    });

    it('affiche les données hors ligne si cache disponible', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_test');
        if (key === 'role') return Promise.resolve('client');
        return Promise.resolve(null);
      });
      // Pré-remplir le cache avec des données stale
      const entryProfil = { data: PROFIL_MOCK, timestamp: Date.now() - 999999, ttl: 1 };
      const entryTampons = { data: TAMPONS_MOCK, timestamp: Date.now() - 999999, ttl: 1 };
      await AsyncStorage.setItem('fidelepro_cache_client_profil', JSON.stringify(entryProfil));
      await AsyncStorage.setItem('fidelepro_cache_client_tampons', JSON.stringify(entryTampons));
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network'));

      render(
        <ThemeProvider>
          <AuthProvider><DashboardClient /></AuthProvider>
        </ThemeProvider>
      );
      await waitFor(() => screen.getByText('Le Bon Café'));
      expect(screen.getByText(/hors ligne/i)).toBeTruthy();
    });
  });

  describe('modal historique', () => {
    it('ouvre le modal en appuyant sur une carte et affiche l historique', async () => {
      await renderScreen();
      // Override mock APRÈS renderScreen — garde profil/tampons pour éviter remount FlatList
      (apiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/historique')) return Promise.resolve({ data: ['2024-01-15T10:00:00Z'] });
        if (url === '/api/client/profil') return Promise.resolve({ data: PROFIL_MOCK });
        if (url === '/api/client/tampons') return Promise.resolve({ data: TAMPONS_MOCK });
        return Promise.resolve({ data: [] });
      });
      fireEvent.press(screen.getByText('Le Bon Café'));
      await waitFor(() => {
        screen.getByText('Historique des visites');
        screen.getByText('+1 tampon');
      });
    });

    it('affiche Aucun historique si liste vide', async () => {
      await renderScreen();
      (apiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/historique')) return Promise.resolve({ data: [] });
        if (url === '/api/client/profil') return Promise.resolve({ data: PROFIL_MOCK });
        if (url === '/api/client/tampons') return Promise.resolve({ data: TAMPONS_MOCK });
        return Promise.resolve({ data: [] });
      });
      fireEvent.press(screen.getByText('Le Bon Café'));
      await waitFor(() => screen.getByText('Aucun historique disponible'));
    });

    it('ferme le modal avec le bouton Fermer', async () => {
      await renderScreen();
      (apiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/historique')) return Promise.resolve({ data: [] });
        if (url === '/api/client/profil') return Promise.resolve({ data: PROFIL_MOCK });
        if (url === '/api/client/tampons') return Promise.resolve({ data: TAMPONS_MOCK });
        return Promise.resolve({ data: [] });
      });
      fireEvent.press(screen.getByText('Le Bon Café'));
      await waitFor(() => screen.getByText('Historique des visites'));
      fireEvent.press(screen.getByText('Fermer'));
      await waitFor(() => expect(screen.queryByText('Historique des visites')).toBeNull());
    });
  });

  describe('modal avis', () => {
    it('ouvre le modal avis si pas de lien Google', async () => {
      await renderScreen();
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('no link'));
      fireEvent.press(screen.getAllByText('⭐ Laisser un avis')[0]);
      await waitFor(() => screen.getByText('Votre avis sur'));
    });

    it('ouvre Linking si lien Google disponible', async () => {
      await renderScreen();
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { lienGoogle: 'https://g.co/maps/abc' } });
      fireEvent.press(screen.getAllByText('⭐ Laisser un avis')[0]);
      await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith('https://g.co/maps/abc'));
    });

    it('alerte si note non sélectionnée à la soumission', async () => {
      await renderScreen();
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('no link'));
      fireEvent.press(screen.getAllByText('⭐ Laisser un avis')[0]);
      await waitFor(() => screen.getByText('Publier'));
      fireEvent.press(screen.getByText('Publier'));
      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Note manquante', expect.any(String)));
    });

    it('soumet l avis avec succès', async () => {
      await renderScreen();
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('no link'));
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});
      fireEvent.press(screen.getAllByText('⭐ Laisser un avis')[0]);
      await waitFor(() => screen.getAllByText('★').length > 0);
      fireEvent.press(screen.getAllByText('★')[3]); // 4e étoile
      fireEvent.press(screen.getByText('Publier'));
      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Merci !', expect.stringContaining('publié')));
    });

    it('affiche erreur si soumission échoue', async () => {
      await renderScreen();
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('no link'));
      (apiClient.post as jest.Mock).mockRejectedValueOnce({ response: { data: { message: 'Déjà noté' } } });
      fireEvent.press(screen.getAllByText('⭐ Laisser un avis')[0]);
      await waitFor(() => screen.getAllByText('★').length > 0);
      fireEvent.press(screen.getAllByText('★')[2]);
      fireEvent.press(screen.getByText('Publier'));
      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Déjà noté'));
    });

    it('ferme le modal avec Annuler', async () => {
      await renderScreen();
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('no link'));
      fireEvent.press(screen.getAllByText('⭐ Laisser un avis')[0]);
      await waitFor(() => screen.getByText('Annuler'));
      fireEvent.press(screen.getByText('Annuler'));
      await waitFor(() => expect(screen.queryByText('Votre avis sur')).toBeNull());
    });
  });

  describe('modal profil', () => {
    it('ouvre le modal profil sur tap avatar', async () => {
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Profil'));
      await waitFor(() => screen.getByText('Jean Dupont'));
    });

    it('ferme le modal profil', async () => {
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Profil'));
      await waitFor(() => screen.getByText('Fermer'));
      fireEvent.press(screen.getByText('Fermer'));
      await waitFor(() => expect(screen.queryByText('tampons total')).toBeNull());
    });

    it('bouton Paramètres navigue vers /profil', async () => {
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Profil'));
      await waitFor(() => screen.getByText('⚙️ Paramètres'));
      fireEvent.press(screen.getByText('⚙️ Paramètres'));
      expect(router.push).toHaveBeenCalledWith('/profil');
    });

    it('bouton Se déconnecter appelle logout', async () => {
      await renderScreen();
      fireEvent.press(screen.getByLabelText('Profil'));
      // Deux boutons "Se déconnecter" : modal (index 1) et footer (index 0)
      await waitFor(() => expect(screen.getAllByText('Se déconnecter').length).toBeGreaterThanOrEqual(2));
      const btns = screen.getAllByText('Se déconnecter');
      fireEvent.press(btns[1]); // bouton dans le modal profil
      await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    });
  });

  describe('filtres', () => {
    it('filtre Complètes affiche uniquement les cartes completes', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('🎁 Complètes'));
      await waitFor(() => {
        expect(screen.getByText('La Pizzeria')).toBeTruthy(); // complète (5/5)
        expect(screen.queryByText('Le Bon Café')).toBeNull(); // en cours (3/5)
      });
    });

    it('filtre En cours affiche uniquement les cartes actives', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('En cours'));
      await waitFor(() => {
        expect(screen.getByText('Le Bon Café')).toBeTruthy(); // en cours
        expect(screen.queryByText('La Pizzeria')).toBeNull(); // complète
      });
    });

    it('filtre Tout réaffiche toutes les cartes', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('🎁 Complètes'));
      fireEvent.press(screen.getByText('Tout'));
      await waitFor(() => {
        expect(screen.getByText('Le Bon Café')).toBeTruthy();
        expect(screen.getByText('La Pizzeria')).toBeTruthy();
      });
    });

    it('affiche le compteur de tampons sur chaque carte', async () => {
      await renderScreen();
      expect(screen.getByText('3/5 tampons')).toBeTruthy();
      expect(screen.getByText('5/5 tampons — Récompense disponible !')).toBeTruthy();
    });

    it('filtre En cours n affiche pas les cartes completes', async () => {
      await renderScreen();
      fireEvent.press(screen.getByText('En cours'));
      await waitFor(() => expect(screen.queryByText('La Pizzeria')).toBeNull());
    });

    it('affiche empty state si filtre sans résultat', async () => {
      // Toutes les cartes sont en cours → filtre Complètes → empty
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'token') return Promise.resolve('tok_test');
        if (key === 'role') return Promise.resolve('client');
        return Promise.resolve(null);
      });
      (apiClient.get as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/client/profil') return Promise.resolve({ data: PROFIL_MOCK });
        if (url === '/api/client/tampons') return Promise.resolve({
          data: [{ carteId: 'c1', carteName: 'Café', commercant: { id: '1', nom: 'CaféX' }, nombreTampons: 1, maxTampons: 5, recompense: null }],
        });
        return Promise.resolve({ data: [] });
      });
      render(<AuthProvider><DashboardClient /></AuthProvider>);
      await waitFor(() => screen.getByText('CaféX'));
      fireEvent.press(screen.getByText('🎁 Complètes'));
      await waitFor(() => screen.getByText('Aucune carte dans ce filtre'));
    });
  });
});

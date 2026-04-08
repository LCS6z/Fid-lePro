import { render, screen } from '@testing-library/react-native';
import React from 'react';

// La variable DOIT commencer par "mock" pour être autorisée dans jest.mock()
const mockOfflineReturn = { value: false };

jest.mock('@/hooks/useOffline', () => ({
  useOffline: () => mockOfflineReturn.value,
}));

import { OfflineBanner } from '../components/OfflineBanner';

describe('OfflineBanner', () => {
  beforeEach(() => { mockOfflineReturn.value = false; });

  it('contient le texte Pas de connexion (opacité 0 = caché mais présent)', () => {
    mockOfflineReturn.value = false;
    render(<OfflineBanner />);
    // L'élément est dans le DOM mais avec opacity=0
    expect(screen.getByText('Pas de connexion')).toBeTruthy();
  });

  it('affiche le texte et l icone quand offline', () => {
    mockOfflineReturn.value = true;
    render(<OfflineBanner />);
    expect(screen.getByText('Pas de connexion')).toBeTruthy();
    expect(screen.getByText('Vérifiez votre réseau')).toBeTruthy();
    expect(screen.getByText('📵')).toBeTruthy();
  });
});

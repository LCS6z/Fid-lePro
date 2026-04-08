import { render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import Index from '../app/index';

// Redirect est mocké via expo-router mock global
// On vérifie le href passé au composant Redirect

jest.mock('../app/index', () => {
  // On importe le vrai module pour tester la logique SecureStore
  return jest.requireActual('../app/index');
});

describe('app/index', () => {
  beforeEach(() => jest.clearAllMocks());

  it('redirige vers /login si onboarding déjà vu', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('true');
    const { UNSAFE_getByType } = render(React.createElement(require('../app/index').default));

    await waitFor(() => {
      const redirect = UNSAFE_getByType(require('expo-router').Redirect);
      expect(redirect.props.href).toBe('/login');
    });
  });

  it('redirige vers /onboarding si onboarding non vu', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    const { UNSAFE_getByType } = render(React.createElement(require('../app/index').default));

    await waitFor(() => {
      const redirect = UNSAFE_getByType(require('expo-router').Redirect);
      expect(redirect.props.href).toBe('/onboarding');
    });
  });

  it('affiche un écran vide pendant le chargement', () => {
    (SecureStore.getItemAsync as jest.Mock).mockReturnValue(new Promise(() => {})); // jamais résolu
    const { UNSAFE_queryByType } = render(React.createElement(require('../app/index').default));
    expect(UNSAFE_queryByType(require('expo-router').Redirect)).toBeNull();
  });
});

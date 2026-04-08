import { API_BASE_URL } from '../lib/api';

// lib/api est mocké via __mocks__/axios.js (axios mocké globalement)
// On teste ici uniquement les constantes et comportements observables

describe('apiClient config', () => {
  it('expose la bonne URL de base', () => {
    expect(API_BASE_URL).toBe('https://fid-lepro-production.up.railway.app');
  });
});

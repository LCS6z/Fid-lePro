import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// api.ts est importé avec le vrai code mais axios est auto-mocké via __mocks__/axios.js
// api.ts appelle mockAxios.interceptors.request.use(handler) au chargement du module
// On récupère les handlers depuis l'historique des appels du mock.
import '../lib/api';

const mockAxios = require('axios');

// Handlers enregistrés par api.ts lors de son import
const requestHandler: (config: any) => Promise<any> =
  (mockAxios.interceptors.request.use as jest.Mock).mock.calls[0][0];

const responseOkHandler: (res: any) => any =
  (mockAxios.interceptors.response.use as jest.Mock).mock.calls[0][0];

const responseErrHandler: (err: any) => Promise<any> =
  (mockAxios.interceptors.response.use as jest.Mock).mock.calls[0][1];

describe('api.ts — request interceptor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('injecte Authorization Bearer si token présent', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('mon_token_jwt');
    const config = { headers: {} as Record<string, string> };
    const result = await requestHandler(config);
    expect(result.headers.Authorization).toBe('Bearer mon_token_jwt');
  });

  it('ne modifie pas les headers si pas de token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    const config = { headers: {} as Record<string, string> };
    const result = await requestHandler(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('api.ts — response interceptor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passe la réponse telle quelle en cas de succès', () => {
    const fakeResponse = { data: { ok: true }, status: 200 };
    const result = responseOkHandler(fakeResponse);
    expect(result).toBe(fakeResponse);
  });

  it('redirige vers /login et efface le token sur erreur 401', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/api/test' },
    };
    await expect(responseErrHandler(error)).rejects.toMatchObject({ response: { status: 401 } });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('role');
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('ne boucle pas sur 401 si _retry401 déjà positionné', async () => {
    const error = {
      response: { status: 401 },
      config: { _retry401: true },
    };
    await expect(responseErrHandler(error)).rejects.toMatchObject({ response: { status: 401 } });
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('rejette l erreur sans redirection pour les autres statuts', async () => {
    const error = { response: { status: 500 }, config: { url: '/api/test' } };
    await expect(responseErrHandler(error)).rejects.toMatchObject({ response: { status: 500 } });
    expect(router.replace).not.toHaveBeenCalled();
  });
});

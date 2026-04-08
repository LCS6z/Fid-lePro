import { act, renderHook } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import { useBiometricLock } from '../hooks/useBiometricLock';

const BIOMETRIC_KEY = 'fidelepro_biometric_enabled';

// Capture the AppState listener so we can fire events manually
let appStateListener: ((state: string) => void) | null = null;
const mockRemove = jest.fn();

jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
  appStateListener = handler as (state: string) => void;
  return { remove: mockRemove } as any;
});

beforeEach(() => {
  jest.clearAllMocks();
  appStateListener = null;
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
});

describe('useBiometricLock', () => {
  it('démarre à idle, biométrie désactivée', async () => {
    const { result } = renderHook(() => useBiometricLock());
    expect(result.current.lockState).toBe('idle');
    expect(result.current.biometricEnabled).toBe(false);
  });

  it('charge la préférence depuis SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('true');
    const { result } = renderHook(() => useBiometricLock());
    await act(async () => {});
    expect(result.current.biometricEnabled).toBe(true);
  });

  it('verrouille après 30s en arrière-plan', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('true');
    const { result } = renderHook(() => useBiometricLock());
    await act(async () => {});

    // Va en background
    act(() => { appStateListener?.('background'); });

    // Simule 31 secondes
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 31_000);

    act(() => { appStateListener?.('active'); });

    expect(result.current.lockState).toBe('locked');
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('ne verrouille pas si < 30s en arrière-plan', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('true');
    const { result } = renderHook(() => useBiometricLock());
    await act(async () => {});

    act(() => { appStateListener?.('background'); });

    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 5_000);
    act(() => { appStateListener?.('active'); });

    expect(result.current.lockState).toBe('idle');
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('unlock() retourne true si biométrie réussit', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useBiometricLock());

    let ok: boolean;
    await act(async () => { ok = await result.current.unlock(); });

    expect(ok!).toBe(true);
    expect(result.current.lockState).toBe('unlocked');
  });

  it('unlock() retourne false si biométrie échoue', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: false });
    const { result } = renderHook(() => useBiometricLock());

    let ok: boolean;
    await act(async () => { ok = await result.current.unlock(); });

    expect(ok!).toBe(false);
    expect(result.current.lockState).toBe('idle');
  });

  it('enableBiometric() sauvegarde la préférence et retourne true', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useBiometricLock());

    let ok: boolean;
    await act(async () => { ok = await result.current.enableBiometric(); });

    expect(ok!).toBe(true);
    expect(result.current.biometricEnabled).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(BIOMETRIC_KEY, 'true');
  });

  it('enableBiometric() retourne false si pas de hardware', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useBiometricLock());

    let ok: boolean;
    await act(async () => { ok = await result.current.enableBiometric(); });

    expect(ok!).toBe(false);
    expect(result.current.biometricEnabled).toBe(false);
  });

  it('disableBiometric() supprime la préférence et remet à idle', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('true');
    const { result } = renderHook(() => useBiometricLock());
    await act(async () => {});

    await act(async () => { await result.current.disableBiometric(); });

    expect(result.current.biometricEnabled).toBe(false);
    expect(result.current.lockState).toBe('idle');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(BIOMETRIC_KEY);
  });
});

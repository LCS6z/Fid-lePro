import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { authStorage } from '@/lib/auth-storage';

const BIOMETRIC_KEY = 'fidelepro_biometric_enabled';
const LOCK_AFTER_MS = 30 * 1000; // verrouille après 30s en arrière-plan

export type BiometricLockState = 'idle' | 'locked' | 'unlocked';

export function useBiometricLock() {
  const [lockState, setLockState] = useState<BiometricLockState>('idle');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  // Charge la préférence au montage
  useEffect(() => {
    authStorage.getRaw(BIOMETRIC_KEY).then(val => {
      setBiometricEnabled(val === 'true');
    });
  }, []);

  // Surveille l'état de l'app
  useEffect(() => {
    if (!biometricEnabled) return;

    const handleChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (next === 'active') {
        const elapsed = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        if (elapsed >= LOCK_AFTER_MS) {
          setLockState('locked');
        }
        backgroundedAt.current = null;
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [biometricEnabled]);

  const unlock = async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouillez FidèlePro',
      cancelLabel: 'Annuler',
      fallbackLabel: 'Utiliser le mot de passe',
    });
    if (result.success) {
      setLockState('unlocked');
      return true;
    }
    return false;
  };

  const enableBiometric = async (): Promise<boolean> => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!compatible || !enrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirmer pour activer la biométrie',
      cancelLabel: 'Annuler',
    });
    if (result.success) {
      await authStorage.setRaw(BIOMETRIC_KEY, 'true');
      setBiometricEnabled(true);
      return true;
    }
    return false;
  };

  const disableBiometric = async () => {
    await authStorage.removeRaw(BIOMETRIC_KEY);
    setBiometricEnabled(false);
    setLockState('idle');
  };

  return { lockState, biometricEnabled, unlock, enableBiometric, disableBiometric };
}

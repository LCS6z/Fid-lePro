import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authStorage, type UserRole } from '@/lib/auth-storage';
import { cache } from '@/lib/cache';

type AuthState = {
  token: string | null;
  role: UserRole | null;
  /** true pendant le chargement initial depuis le stockage */
  isLoading: boolean;
  login: (token: string, role: UserRole, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recharge la session depuis le stockage au démarrage
  useEffect(() => {
    const restore = async () => {
      const [savedToken, savedRole] = await Promise.all([
        authStorage.getToken(),
        authStorage.getRole(),
      ]);
      setToken(savedToken);
      setRole(savedRole);
      setIsLoading(false);
    };
    restore();
  }, []);

  const login = useCallback(async (newToken: string, newRole: UserRole, refreshToken?: string) => {
    await authStorage.setSession(newToken, newRole, refreshToken);
    setToken(newToken);
    setRole(newRole);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([authStorage.clear(), cache.clear()]);
    setToken(null);
    setRole(null);
    router.replace('/login');
  }, []);

  return (
    <AuthContext.Provider value={{ token, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}

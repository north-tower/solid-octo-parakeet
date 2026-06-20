import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, hasAccessToken, setAccessToken } from '../api/client';

interface AuthContextValue {
  ready: boolean;
  isAuthenticated: boolean;
  userLabel: string;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName?: string;
    referralCode?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLabel, setUserLabel] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      if (!hasAccessToken()) {
        setReady(true);
        return;
      }

      try {
        const dashboard = await api.getDashboard();
        setUserLabel(dashboard.profile.displayName ?? dashboard.profile.email);
        setIsAuthenticated(true);
      } catch {
        setAccessToken(null);
      } finally {
        setReady(true);
      }
    };

    void bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isAuthenticated,
      userLabel,
      login: async (email, password) => {
        const response = await api.login(email, password);
        setAccessToken(response.accessToken);
        setUserLabel(response.user.displayName ?? response.user.email);
        setIsAuthenticated(true);
      },
      register: async (payload) => {
        const response = await api.register(payload);
        setAccessToken(response.accessToken);
        setUserLabel(response.user.displayName ?? response.user.email);
        setIsAuthenticated(true);
      },
      logout: () => {
        setAccessToken(null);
        setIsAuthenticated(false);
        setUserLabel('');
      },
    }),
    [ready, isAuthenticated, userLabel],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

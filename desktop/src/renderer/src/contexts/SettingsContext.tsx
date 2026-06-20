import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { desktopApi } from '../lib/desktopApi';
import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from '@shared/constants';

interface SettingsContextValue {
  settings: AppSettings;
  ready: boolean;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await desktopApi.settings.get();
        setSettings(loaded);
      } catch {
        setSettings(DEFAULT_APP_SETTINGS);
      } finally {
        setReady(true);
      }
    };

    void load();
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await desktopApi.settings.set(partial);
    setSettings(next);
  }, []);

  const value = useMemo(
    () => ({ settings, ready, updateSettings }),
    [settings, ready, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

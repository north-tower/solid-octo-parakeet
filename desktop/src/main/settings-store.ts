import { app } from 'electron';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from '../shared/constants';

const SETTINGS_FILE = join(app.getPath('userData'), 'app-settings.json');

function readSettingsFile(): AppSettings {
  try {
    if (!existsSync(SETTINGS_FILE)) {
      return { ...DEFAULT_APP_SETTINGS };
    }
    const raw = readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      notifications: {
        ...DEFAULT_APP_SETTINGS.notifications,
        ...parsed.notifications,
      },
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function getAppSettings(): AppSettings {
  return readSettingsFile();
}

export function setAppSettings(partial: Partial<AppSettings>): AppSettings {
  const current = readSettingsFile();
  const next: AppSettings = {
    ...current,
    ...partial,
    notifications: {
      ...current.notifications,
      ...partial.notifications,
    },
  };

  mkdirSync(app.getPath('userData'), { recursive: true });
  writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

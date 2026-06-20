/// <reference types="vite/client" />

import type {
  AppSettings,
  MinerStats,
  MiningStatusPayload,
} from '@shared/constants';

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    desktop: {
      mining: {
        start: (powerPercent: number) => Promise<MinerStats>;
        stop: () => Promise<MinerStats>;
        getState: () => Promise<MinerStats>;
        onStats: (callback: (stats: MinerStats) => void) => () => void;
      };
      settings: {
        get: () => Promise<AppSettings>;
        set: (partial: Partial<AppSettings>) => Promise<AppSettings>;
      };
      tray: {
        onStartMining: (callback: () => void) => () => void;
        onStopMining: (callback: () => void) => () => void;
        setMiningStatus: (status: MiningStatusPayload) => void;
      };
    };
  }
}

export {};

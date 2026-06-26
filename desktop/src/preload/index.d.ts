import type {
  AppSettings,
  MinerStats,
  MiningPoolConfig,
  MiningStatusPayload,
} from '../shared/constants';

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
      miningPool: {
        get: () => Promise<MiningPoolConfig>;
        set: (partial: Partial<MiningPoolConfig>) => Promise<MiningPoolConfig>;
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

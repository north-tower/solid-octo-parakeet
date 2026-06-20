import type { MinerStats } from '../shared/constants';

declare global {
  interface Window {
    desktop: {
      mining: {
        start: (powerPercent: number) => Promise<MinerStats>;
        stop: () => Promise<MinerStats>;
        getState: () => Promise<MinerStats>;
        onStats: (callback: (stats: MinerStats) => void) => () => void;
      };
    };
  }
}

export {};

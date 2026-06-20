import {
  DEFAULT_APP_SETTINGS,
  estimateRawMinedValue,
  type AppSettings,
  type MinerStats,
  type MiningStatusPayload,
} from '@shared/constants';

function emptyUnsubscribe() {
  return () => undefined;
}

function createSimulatedMinerState(
  running: boolean,
  powerPercent: number,
  startedAt: number | null,
): MinerStats {
  const totalSeconds = startedAt
    ? Math.floor((Date.now() - startedAt) / 1000)
    : 0;

  return {
    running,
    mode: 'simulated',
    powerPercent,
    hashrate: running ? powerPercent * 12.5 : 0,
    sharesAccepted: running ? Math.floor(totalSeconds / 30) : 0,
    totalSeconds,
    secondsAbove80Percent:
      running && powerPercent >= 80 ? totalSeconds : 0,
    avgPowerPercent: powerPercent,
    peakPowerPercent: powerPercent,
    rawMinedValue: estimateRawMinedValue(totalSeconds, powerPercent),
    lastError: null,
  };
}

let simulatedStartedAt: number | null = null;
let simulatedPower = DEFAULT_APP_SETTINGS.defaultCpuPower;

function getSimulatedMiningApi() {
  return {
    start: async (powerPercent: number) => {
      simulatedPower = powerPercent;
      simulatedStartedAt = Date.now();
      return createSimulatedMinerState(true, powerPercent, simulatedStartedAt);
    },
    stop: async () => {
      const stats = createSimulatedMinerState(
        false,
        simulatedPower,
        simulatedStartedAt,
      );
      simulatedStartedAt = null;
      return stats;
    },
    getState: async () =>
      createSimulatedMinerState(
        simulatedStartedAt !== null,
        simulatedPower,
        simulatedStartedAt,
      ),
    onStats: (callback: (stats: MinerStats) => void) => {
      const timer = window.setInterval(() => {
        if (simulatedStartedAt === null) {
          return;
        }
        callback(
          createSimulatedMinerState(true, simulatedPower, simulatedStartedAt),
        );
      }, 5_000);
      return () => window.clearInterval(timer);
    },
  };
}

function mergeSettings(partial: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_APP_SETTINGS,
    ...partial,
    notifications: {
      ...DEFAULT_APP_SETTINGS.notifications,
      ...partial.notifications,
    },
  };
}

let cachedSettings = { ...DEFAULT_APP_SETTINGS };

export const desktopApi = {
  mining: {
    start: (powerPercent: number) =>
      window.desktop?.mining?.start?.(powerPercent) ??
      getSimulatedMiningApi().start(powerPercent),
    stop: () =>
      window.desktop?.mining?.stop?.() ?? getSimulatedMiningApi().stop(),
    getState: () =>
      window.desktop?.mining?.getState?.() ?? getSimulatedMiningApi().getState(),
    onStats: (callback: (stats: MinerStats) => void) =>
      window.desktop?.mining?.onStats?.(callback) ??
      getSimulatedMiningApi().onStats(callback),
  },
  settings: {
    get: async () => {
      if (window.desktop?.settings?.get) {
        cachedSettings = await window.desktop.settings.get();
        return cachedSettings;
      }
      return cachedSettings;
    },
    set: async (partial: Partial<AppSettings>) => {
      if (window.desktop?.settings?.set) {
        cachedSettings = await window.desktop.settings.set(partial);
        return cachedSettings;
      }
      cachedSettings = mergeSettings({ ...cachedSettings, ...partial });
      return cachedSettings;
    },
  },
  tray: {
    setMiningStatus: (status: MiningStatusPayload) => {
      window.desktop?.tray?.setMiningStatus?.(status);
    },
    onStartMining: (callback: () => void) =>
      window.desktop?.tray?.onStartMining?.(callback) ?? emptyUnsubscribe(),
    onStopMining: (callback: () => void) =>
      window.desktop?.tray?.onStopMining?.(callback) ?? emptyUnsubscribe(),
  },
};

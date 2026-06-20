export const IPC_CHANNELS = {
  MINING_START: 'mining:start',
  MINING_STOP: 'mining:stop',
  MINING_GET_STATE: 'mining:get-state',
  MINING_STATS: 'mining:stats',
} as const;

export interface MinerStats {
  running: boolean;
  mode: 'xmrig' | 'simulated';
  powerPercent: number;
  hashrate: number;
  sharesAccepted: number;
  totalSeconds: number;
  secondsAbove80Percent: number;
  avgPowerPercent: number;
  peakPowerPercent: number;
  rawMinedValue: string;
  lastError: string | null;
}

export interface MiningStartOptions {
  powerPercent: number;
}

export const DEFAULT_API_URL = 'http://localhost:3000';
export const HEARTBEAT_INTERVAL_MS = 60_000;
export const RAW_VALUE_PER_HOUR_AT_FULL_POWER = 15;

export function estimateRawMinedValue(
  totalSeconds: number,
  avgPowerPercent: number,
): string {
  const hours = totalSeconds / 3600;
  const value = hours * (avgPowerPercent / 100) * RAW_VALUE_PER_HOUR_AT_FULL_POWER;
  return value.toFixed(8);
}

export const IPC_CHANNELS = {
  MINING_START: 'mining:start',
  MINING_STOP: 'mining:stop',
  MINING_GET_STATE: 'mining:get-state',
  MINING_STATS: 'mining:stats',
  APP_GET_SETTINGS: 'app:get-settings',
  APP_SET_SETTINGS: 'app:set-settings',
  APP_GET_MINING_POOL: 'app:get-mining-pool',
  APP_SET_MINING_POOL: 'app:set-mining-pool',
  APP_MINING_STATUS: 'app:mining-status',
  TRAY_START_MINING: 'tray:start-mining',
  TRAY_STOP_MINING: 'tray:stop-mining',
} as const;

export interface MiningPoolConfig {
  wallet: string;
  poolUrl: string;
}

export const DEFAULT_MINING_POOL_CONFIG: MiningPoolConfig = {
  wallet: '',
  poolUrl: 'pool.supportxmr.com:443',
};

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

export interface AppSettings {
  minimizeToTray: boolean;
  autoStartMining: boolean;
  defaultCpuPower: number;
  notifications: {
    levelUp: boolean;
    referralJoined: boolean;
    payoutProcessed: boolean;
    miningComplete: boolean;
  };
}

export interface MiningStatusPayload {
  running: boolean;
  hashrate: number;
  mode: 'xmrig' | 'simulated' | 'idle';
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  minimizeToTray: true,
  autoStartMining: false,
  defaultCpuPower: 50,
  notifications: {
    levelUp: true,
    referralJoined: true,
    payoutProcessed: true,
    miningComplete: true,
  },
};

export const DEFAULT_API_URL = 'http://localhost:3000';
export const HEARTBEAT_INTERVAL_MS = 60_000;
export const RAW_VALUE_PER_HOUR_AT_FULL_POWER = 15;
export const MIN_PAYOUT_COINS = 100;
export const COINS_PER_USER_REWARD_UNIT = 3.125;

export function estimateRawMinedValue(
  totalSeconds: number,
  avgPowerPercent: number,
): string {
  const hours = totalSeconds / 3600;
  const value = hours * (avgPowerPercent / 100) * RAW_VALUE_PER_HOUR_AT_FULL_POWER;
  return value.toFixed(8);
}

export const AVATAR_PRESETS = [
  { id: 'gradient-indigo', label: 'Indigo', color: '#6366f1' },
  { id: 'gradient-purple', label: 'Purple', color: '#a855f7' },
  { id: 'gradient-cyan', label: 'Cyan', color: '#06b6d4' },
  { id: 'gradient-emerald', label: 'Emerald', color: '#10b981' },
  { id: 'gradient-rose', label: 'Rose', color: '#f43f5e' },
  { id: 'gradient-amber', label: 'Amber', color: '#f59e0b' },
] as const;

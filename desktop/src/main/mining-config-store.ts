import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  DEFAULT_MINING_POOL_CONFIG,
  type MiningPoolConfig,
} from '../shared/constants';

const CONFIG_FILE = join(app.getPath('userData'), 'mining-pool.json');

function readMiningConfigFile(): MiningPoolConfig {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_MINING_POOL_CONFIG };
    }
    const parsed = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as Partial<MiningPoolConfig>;
    return {
      wallet: parsed.wallet?.trim() ?? '',
      poolUrl: parsed.poolUrl?.trim() || DEFAULT_MINING_POOL_CONFIG.poolUrl,
    };
  } catch {
    return { ...DEFAULT_MINING_POOL_CONFIG };
  }
}

export function getMiningPoolConfig(): MiningPoolConfig {
  return readMiningConfigFile();
}

export function setMiningPoolConfig(partial: Partial<MiningPoolConfig>): MiningPoolConfig {
  const current = readMiningConfigFile();
  const next: MiningPoolConfig = {
    wallet: partial.wallet !== undefined ? partial.wallet.trim() : current.wallet,
    poolUrl:
      partial.poolUrl !== undefined
        ? partial.poolUrl.trim() || DEFAULT_MINING_POOL_CONFIG.poolUrl
        : current.poolUrl,
  };

  mkdirSync(app.getPath('userData'), { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export function resolveMiningPoolSettings(): { wallet: string; poolUrl: string } {
  const file = readMiningConfigFile();

  const wallet =
    process.env.XMRIG_WALLET?.trim() ||
    process.env.VITE_XMRIG_WALLET?.trim() ||
    file.wallet ||
    import.meta.env.VITE_XMRIG_WALLET?.trim() ||
    '';

  const poolUrl =
    process.env.XMRIG_POOL_URL?.trim() ||
    process.env.VITE_XMRIG_POOL_URL?.trim() ||
    file.poolUrl ||
    import.meta.env.VITE_XMRIG_POOL_URL?.trim() ||
    DEFAULT_MINING_POOL_CONFIG.poolUrl;

  return { wallet, poolUrl };
}

const PLACEHOLDER_WALLETS = new Set([
  '',
  'YOUR_MONERO_WALLET_ADDRESS',
  'your_monero_wallet_address',
]);

export function isValidMoneroWallet(wallet: string): boolean {
  if (PLACEHOLDER_WALLETS.has(wallet.trim())) {
    return false;
  }
  return /^[48][1-9A-HJ-NP-Za-km-z]{94,105}$/.test(wallet.trim());
}

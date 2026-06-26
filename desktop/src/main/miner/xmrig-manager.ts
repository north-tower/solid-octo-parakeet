import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { app } from 'electron';
import {
  estimateRawMinedValue,
  type MinerStats,
  type MiningStartOptions,
} from '../../shared/constants';
import {
  isValidMoneroWallet,
  resolveMiningPoolSettings,
} from '../mining-config-store';

const QUALIFIED_POWER = 80;

export class XmrigManager {
  private process: ChildProcessWithoutNullStreams | null = null;
  private mode: MinerStats['mode'] = 'simulated';
  private powerPercent = 50;
  private startedAt: number | null = null;
  private hashrate = 0;
  private sharesAccepted = 0;
  private peakPowerPercent = 0;
  private weightedPowerSum = 0;
  private weightedSeconds = 0;
  private secondsAbove80 = 0;
  private lastSampleAt: number | null = null;
  private simulationTimer: NodeJS.Timeout | null = null;
  private lastError: string | null = null;

  start(options: MiningStartOptions): MinerStats {
    this.stop();
    this.powerPercent = options.powerPercent;
    this.startedAt = Date.now();
    this.hashrate = 0;
    this.sharesAccepted = 0;
    this.peakPowerPercent = options.powerPercent;
    this.weightedPowerSum = 0;
    this.weightedSeconds = 0;
    this.secondsAbove80 = 0;
    this.lastSampleAt = this.startedAt;
    this.lastError = null;

    const xmrigPath = this.resolveXmrigPath();
    const poolSettings = resolveMiningPoolSettings();

    if (!xmrigPath) {
      this.mode = 'simulated';
      this.lastError =
        'XMRig not found. Extract the full MSVC release zip into desktop/resources/xmrig/win/ (xmrig.exe and DLLs), then rebuild the app.';
      this.startSimulation(options.powerPercent);
      return this.getStats();
    }

    if (!isValidMoneroWallet(poolSettings.wallet)) {
      this.mode = 'simulated';
      this.lastError =
        'Set your Monero wallet in Settings → Mining pool to enable real XMRig mining.';
      this.startSimulation(options.powerPercent);
      return this.getStats();
    }

    this.mode = 'xmrig';
    this.startXmrig(xmrigPath, options.powerPercent, poolSettings);
    return this.getStats();
  }

  stop(): MinerStats {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }

    this.captureElapsedPower();
    const stats = this.getStats();
    this.startedAt = null;
    this.lastSampleAt = null;
    this.mode = 'simulated';
    this.lastError = null;
    return stats;
  }

  getStats(): MinerStats {
    this.captureElapsedPower();
    const totalSeconds = this.startedAt
      ? Math.floor((Date.now() - this.startedAt) / 1000)
      : 0;
    const avgPowerPercent =
      this.weightedSeconds > 0
        ? this.weightedPowerSum / this.weightedSeconds
        : this.powerPercent;

    return {
      running: this.startedAt !== null,
      mode: this.mode,
      powerPercent: this.powerPercent,
      hashrate: this.hashrate,
      sharesAccepted: this.sharesAccepted,
      totalSeconds,
      secondsAbove80Percent: this.secondsAbove80,
      avgPowerPercent,
      peakPowerPercent: this.peakPowerPercent,
      rawMinedValue: estimateRawMinedValue(totalSeconds, avgPowerPercent),
      lastError: this.lastError,
    };
  }

  private resolveXmrigPath(): string | null {
    const configured = import.meta.env.VITE_XMRIG_PATH?.trim();
    if (configured && existsSync(configured)) {
      return configured;
    }

    const binaryName = process.platform === 'win32' ? 'xmrig.exe' : 'xmrig';

    const bundled = join(process.resourcesPath, 'xmrig', binaryName);
    if (existsSync(bundled)) {
      return bundled;
    }

    const platformDir =
      process.platform === 'win32'
        ? 'win'
        : process.platform === 'darwin'
          ? 'mac'
          : 'linux';
    const devLocal = join(
      __dirname,
      '..',
      '..',
      '..',
      'resources',
      'xmrig',
      platformDir,
      binaryName,
    );
    if (existsSync(devLocal)) {
      return devLocal;
    }

    return null;
  }

  private startXmrig(
    xmrigPath: string,
    powerPercent: number,
    poolSettings: { wallet: string; poolUrl: string },
  ) {
    const configDir = join(app.getPath('userData'), 'xmrig');
    mkdirSync(configDir, { recursive: true });
    const configPath = join(configDir, 'config.json');
    const maxThreads = Math.max(1, Math.round((powerPercent / 100) * 8));

    const config = {
      api: {
        id: null,
        'worker-id': null,
        port: 0,
        'access-token': null,
        restricted: true,
      },
      cpu: {
        enabled: true,
        'max-threads-hint': maxThreads,
      },
      pools: [
        {
          url: poolSettings.poolUrl,
          user: poolSettings.wallet,
          pass: 'x',
          tls: true,
        },
      ],
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2));

    this.process = spawn(xmrigPath, ['--config', configPath, '--no-color'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: dirname(xmrigPath),
    });

    this.process.stdout.on('data', (chunk: Buffer) => {
      this.parseXmrigOutput(chunk.toString());
    });

    this.process.stderr.on('data', (chunk: Buffer) => {
      const message = chunk.toString().trim();
      if (message) {
        this.lastError = message;
      }
    });

    this.process.on('error', (error) => {
      this.lastError = `Failed to start XMRig: ${error.message}. Windows Defender may have blocked it — add an exclusion for the app install folder.`;
      this.process = null;
    });

    this.process.on('exit', (code) => {
      if (code && code !== 0) {
        this.lastError = `XMRig exited with code ${code}. Check antivirus exclusions and your wallet/pool settings.`;
      }
      this.process = null;
    });
  }

  private parseXmrigOutput(output: string) {
    const hashrateMatch =
      output.match(/speed\s+10s\/60s\/15m\s+([\d.]+)/i) ??
      output.match(/([\d.]+)\s+H\/s/i);
    if (hashrateMatch) {
      this.hashrate = Number.parseFloat(hashrateMatch[1]);
    }

    const acceptedMatch = output.match(/accepted\s+\((\d+)\/\d+\)/i);
    if (acceptedMatch) {
      this.sharesAccepted = Number.parseInt(acceptedMatch[1], 10);
    }
  }

  private startSimulation(powerPercent: number) {
    const baseHashrate = 2500;
    this.hashrate = Math.round(baseHashrate * (powerPercent / 100));

    this.simulationTimer = setInterval(() => {
      if (Math.random() > 0.3) {
        this.sharesAccepted += 1;
      }
      this.hashrate = Math.round(
        baseHashrate * (powerPercent / 100) * (0.95 + Math.random() * 0.1),
      );
    }, 15_000);
  }

  private captureElapsedPower() {
    if (!this.startedAt || this.lastSampleAt === null) {
      return;
    }

    const now = Date.now();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now - this.lastSampleAt) / 1000),
    );

    if (elapsedSeconds === 0) {
      return;
    }

    this.weightedPowerSum += this.powerPercent * elapsedSeconds;
    this.weightedSeconds += elapsedSeconds;

    if (this.powerPercent >= QUALIFIED_POWER) {
      this.secondsAbove80 += elapsedSeconds;
    }

    if (this.powerPercent > this.peakPowerPercent) {
      this.peakPowerPercent = this.powerPercent;
    }

    this.lastSampleAt = now;
  }
}

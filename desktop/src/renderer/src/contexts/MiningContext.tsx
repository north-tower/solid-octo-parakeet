import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { MinerStats } from '@shared/constants';
import { HEARTBEAT_INTERVAL_MS } from '@shared/constants';
import { api, type DashboardResponse } from '../api/client';
import { useToast } from '../components/Toast';
import { desktopApi } from '../lib/desktopApi';
import { useNotifications } from './NotificationsContext';
import { useSettings } from './SettingsContext';
import { formatCoins } from '../utils/format';

interface MiningContextValue {
  dashboard: DashboardResponse | null;
  power: number;
  sessionId: string | null;
  minerStats: MinerStats | null;
  busy: boolean;
  error: string | null;
  walletFlash: boolean;
  isMining: boolean;
  setPower: (value: number) => void;
  refreshDashboard: () => Promise<void>;
  startMining: () => Promise<void>;
  stopMining: () => Promise<void>;
  abortMining: () => Promise<void>;
}

const MiningContext = createContext<MiningContextValue | null>(null);

export function MiningProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { settings } = useSettings();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [power, setPower] = useState(settings.defaultCpuPower);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [minerStats, setMinerStats] = useState<MinerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [walletFlash, setWalletFlash] = useState(false);
  const previousBalance = useRef<string | null>(null);
  const autoStartAttempted = useRef(false);

  const refreshDashboard = useCallback(async () => {
    const data = await api.getDashboard();
    setDashboard(data);
    if (!sessionId) {
      setPower(data.profile.miningPowerPercent);
    }
    if (data.activeSession) {
      setSessionId(data.activeSession.id);
    }

    if (
      previousBalance.current !== null &&
      previousBalance.current !== data.wallet.coinBalance
    ) {
      setWalletFlash(true);
      window.setTimeout(() => setWalletFlash(false), 1200);
    }
    previousBalance.current = data.wallet.coinBalance;
  }, [sessionId]);

  useEffect(() => {
    void refreshDashboard().catch((refreshError) => {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Failed to load dashboard',
      );
    });
  }, [refreshDashboard]);

  useEffect(() => {
    setPower(settings.defaultCpuPower);
  }, [settings.defaultCpuPower]);

  useEffect(() => {
    const unsubscribe = desktopApi.mining.onStats((stats) => {
      setMinerStats(stats);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    desktopApi.tray.setMiningStatus({
      running: Boolean(sessionId && minerStats?.running),
      hashrate: minerStats?.hashrate ?? 0,
      mode: minerStats?.running ? minerStats.mode : 'idle',
    });
  }, [sessionId, minerStats]);

  useEffect(() => {
    if (!sessionId || !minerStats?.running) {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await api.sendHeartbeat(sessionId, {
          powerPercent: minerStats.powerPercent,
          hashrate: minerStats.hashrate.toFixed(8),
          sharesAccepted: minerStats.sharesAccepted,
        });
      } catch (heartbeatError) {
        const message =
          heartbeatError instanceof Error
            ? heartbeatError.message
            : 'Heartbeat failed';
        showToast(message, 'error');
      }
    };

    void sendHeartbeat();
    const timer = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [
    sessionId,
    minerStats?.running,
    minerStats?.powerPercent,
    minerStats?.hashrate,
    minerStats?.sharesAccepted,
    showToast,
  ]);

  const startMining = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      await api.updateMiningPower(power);
      const session = await api.startSession(power);
      setSessionId(session.id);
      const stats = await desktopApi.mining.start(power);
      setMinerStats(stats);
      showToast(
        stats.mode === 'xmrig'
          ? 'Mining started with XMRig'
          : 'Mining started in simulated mode',
        'info',
      );
      await refreshDashboard();
    } catch (startError) {
      const message =
        startError instanceof Error ? startError.message : 'Failed to start mining';
      setError(message);
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  }, [power, refreshDashboard, showToast]);

  const stopMining = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const stats = await desktopApi.mining.stop();
      setMinerStats(stats);

      const result = await api.completeSession(sessionId, {
        totalSeconds: stats.totalSeconds,
        secondsAbove80Percent: stats.secondsAbove80Percent,
        rawMinedValue: stats.rawMinedValue,
        avgPowerPercent: Number(stats.avgPowerPercent.toFixed(2)),
        peakPowerPercent: Number(stats.peakPowerPercent.toFixed(2)),
        hashrate: stats.hashrate.toFixed(8),
        sharesAccepted: stats.sharesAccepted,
      });

      setSessionId(null);
      const levelNote = result.progression.leveledUp ? ' Level up!' : '';
      showToast(
        `Session complete! +${formatCoins(result.rewards.coinAmount)} coins.${levelNote}`,
        'success',
      );

      if (settings.notifications.miningComplete) {
        addNotification({
          type: 'mining_complete',
          title: 'Mining session complete',
          message: `You earned ${formatCoins(result.rewards.coinAmount)} coins.`,
        });
      }

      if (result.progression.leveledUp && settings.notifications.levelUp) {
        addNotification({
          type: 'level_up',
          title: 'Level up!',
          message: `You reached level ${result.progression.currentLevel}.`,
        });
      }

      await refreshDashboard();
    } catch (stopError) {
      const message =
        stopError instanceof Error ? stopError.message : 'Failed to stop mining';
      setError(message);
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  }, [
    sessionId,
    refreshDashboard,
    showToast,
    addNotification,
    settings.notifications,
  ]);

  const abortMining = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await desktopApi.mining.stop();
      await api.abortSession(sessionId);
      setSessionId(null);
      setMinerStats(null);
      showToast('Mining session aborted', 'info');
      await refreshDashboard();
    } catch (abortError) {
      const message =
        abortError instanceof Error ? abortError.message : 'Failed to abort mining';
      setError(message);
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  }, [sessionId, refreshDashboard, showToast]);

  useEffect(() => {
    const unsubStart = desktopApi.tray.onStartMining(() => {
      if (!sessionId && !busy) {
        void startMining();
      }
    });
    const unsubStop = desktopApi.tray.onStopMining(() => {
      if (sessionId && !busy) {
        void stopMining();
      }
    });
    return () => {
      unsubStart();
      unsubStop();
    };
  }, [sessionId, busy, startMining, stopMining]);

  useEffect(() => {
    if (
      autoStartAttempted.current ||
      !dashboard ||
      sessionId ||
      !settings.autoStartMining
    ) {
      return;
    }

    autoStartAttempted.current = true;
    void startMining();
  }, [dashboard, sessionId, settings.autoStartMining, startMining]);

  const isMining = Boolean(sessionId && minerStats?.running);

  const value = useMemo(
    () => ({
      dashboard,
      power,
      sessionId,
      minerStats,
      busy,
      error,
      walletFlash,
      isMining,
      setPower,
      refreshDashboard,
      startMining,
      stopMining,
      abortMining,
    }),
    [
      dashboard,
      power,
      sessionId,
      minerStats,
      busy,
      error,
      walletFlash,
      isMining,
      refreshDashboard,
      startMining,
      stopMining,
      abortMining,
    ],
  );

  return (
    <MiningContext.Provider value={value}>{children}</MiningContext.Provider>
  );
}

export function useMining() {
  const context = useContext(MiningContext);
  if (!context) {
    throw new Error('useMining must be used within MiningProvider');
  }
  return context;
}

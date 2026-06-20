import { useEffect, useRef, useState } from 'react';
import type { MinerStats } from '@shared/constants';
import { HEARTBEAT_INTERVAL_MS } from '@shared/constants';
import { api, type DashboardResponse } from '../api/client';
import { AnimatedHashrate } from '../components/AnimatedHashrate';
import { PowerSlider } from '../components/PowerSlider';
import { ReferralModal } from '../components/ReferralModal';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../utils/validation';

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function formatCoins(value: string) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

function levelProgress(dashboard: DashboardResponse) {
  const { xp, currentLevelXpFloor, nextLevelXpTarget } = dashboard.progression;
  if (!nextLevelXpTarget) {
    return 100;
  }
  const span = nextLevelXpTarget - currentLevelXpFloor;
  if (span <= 0) {
    return 100;
  }
  return Math.min(100, Math.max(0, ((xp - currentLevelXpFloor) / span) * 100));
}

export function DashboardPage() {
  const { logout, userLabel } = useAuth();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [power, setPower] = useState(50);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [minerStats, setMinerStats] = useState<MinerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [walletFlash, setWalletFlash] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const previousBalance = useRef<string | null>(null);

  const refreshDashboard = async () => {
    const data = await api.getDashboard();
    setDashboard(data);
    setPower(data.profile.miningPowerPercent);
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
  };

  useEffect(() => {
    void refreshDashboard().catch((refreshError) => {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Failed to load dashboard',
      );
    });
  }, []);

  useEffect(() => {
    const unsubscribe = window.desktop.mining.onStats((stats) => {
      setMinerStats(stats);
    });
    return unsubscribe;
  }, []);

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

  const startMining = async () => {
    setBusy(true);
    setError(null);

    try {
      await api.updateMiningPower(power);
      const session = await api.startSession(power);
      setSessionId(session.id);
      const stats = await window.desktop.mining.start(power);
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
  };

  const stopMining = async () => {
    if (!sessionId) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const stats = await window.desktop.mining.stop();
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
      await refreshDashboard();
    } catch (stopError) {
      const message =
        stopError instanceof Error ? stopError.message : 'Failed to stop mining';
      setError(message);
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const abortMining = async () => {
    if (!sessionId) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await window.desktop.mining.stop();
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
  };

  if (!dashboard) {
    return <div className="loading">Loading dashboard…</div>;
  }

  const isMining = Boolean(sessionId && minerStats?.running);
  const isFirstRun =
    Number.parseFloat(dashboard.wallet.coinBalance) === 0 &&
    dashboard.mining.completedSessions === 0;
  const progress = levelProgress(dashboard);

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Gamer Mining Rewards</p>
          <h1>Dashboard</h1>
        </div>
        <div className="topbar-user">
          <div className="avatar" aria-hidden="true">
            {getInitials(userLabel)}
          </div>
          <div className="topbar-user-meta">
            <strong>{userLabel}</strong>
            <span className="muted">Level {dashboard.progression.level}</span>
          </div>
          <button className="ghost" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="grid">
        <article className={`panel wallet-hero ${walletFlash ? 'wallet-flash' : ''}`}>
          <h2>Wallet</h2>
          <p className="metric">{formatCoins(dashboard.wallet.coinBalance)}</p>
          <p className="metric-caption">coins available</p>
        </article>

        <article className="panel stat-card">
          <h2>Level {dashboard.progression.level}</h2>
          <p className="metric">{dashboard.progression.xp}</p>
          <p className="metric-caption">total XP earned</p>
          <div className="xp-progress">
            <div className="xp-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="muted xp-progress-label">
            {dashboard.progression.xpToNextLevel ?? 0} XP to next level
          </p>
        </article>

        <button
          type="button"
          className="panel stat-card stat-card-button"
          onClick={() => setReferralOpen(true)}
        >
          <h2>Referrals</h2>
          <p className="metric">{dashboard.profile.referralsCount}</p>
          <p className="metric-caption">friends invited</p>
          <p className="muted">Tap to share code {dashboard.profile.referralCode}</p>
        </button>
      </section>

      {isFirstRun && !isMining && (
        <div className="first-run-banner">
          Start your first mining session to earn coins
        </div>
      )}

      <section className="panel mining-panel">
        <div className="mining-header">
          <div>
            <h2>Mining control</h2>
            <p className="muted">
              {isMining
                ? `Active session ${sessionId?.slice(0, 8)}…`
                : 'Start a session to earn coins and XP'}
            </p>
          </div>
          <span className={`badge ${isMining ? 'live mining' : 'idle'}`}>
            {isMining ? 'mining' : 'idle'}
          </span>
        </div>

        <PowerSlider
          value={power}
          disabled={isMining || busy}
          onChange={setPower}
        />

        {minerStats && (
          <div className="stats-grid">
            <div>
              <span>Hashrate</span>
              <AnimatedHashrate value={minerStats.hashrate} active={isMining} />
            </div>
            <div>
              <span>Duration</span>
              <strong>{formatDuration(minerStats.totalSeconds)}</strong>
            </div>
            <div>
              <span>Shares</span>
              <strong>{minerStats.sharesAccepted}</strong>
            </div>
            <div>
              <span>Raw value</span>
              <strong>{minerStats.rawMinedValue}</strong>
            </div>
          </div>
        )}

        <div className="actions">
          {!isMining ? (
            <button
              className="primary"
              type="button"
              disabled={busy}
              onClick={() => void startMining()}
            >
              Start mining
            </button>
          ) : (
            <>
              <button
                className="primary"
                type="button"
                disabled={busy}
                onClick={() => void stopMining()}
              >
                Stop and settle
              </button>
              <button
                className="ghost"
                type="button"
                disabled={busy}
                onClick={() => void abortMining()}
              >
                Abort
              </button>
            </>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {minerStats?.lastError && <p className="error">{minerStats.lastError}</p>}
      </section>

      {referralOpen && (
        <ReferralModal
          referralCode={dashboard.profile.referralCode}
          referralsCount={dashboard.profile.referralsCount}
          onClose={() => setReferralOpen(false)}
        />
      )}
    </div>
  );
}

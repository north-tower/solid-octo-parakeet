import { useEffect, useState } from 'react';
import type { MinerStats } from '@shared/constants';
import { HEARTBEAT_INTERVAL_MS } from '@shared/constants';
import { api, type DashboardResponse } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function DashboardPage() {
  const { logout, userLabel } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [power, setPower] = useState(50);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [minerStats, setMinerStats] = useState<MinerStats | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshDashboard = async () => {
    const data = await api.getDashboard();
    setDashboard(data);
    setPower(data.profile.miningPowerPercent);
    if (data.activeSession) {
      setSessionId(data.activeSession.id);
    }
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
        setError(
          heartbeatError instanceof Error
            ? heartbeatError.message
            : 'Heartbeat failed',
        );
      }
    };

    void sendHeartbeat();
    const timer = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [sessionId, minerStats?.running, minerStats?.powerPercent, minerStats?.hashrate, minerStats?.sharesAccepted]);

  const startMining = async () => {
    setBusy(true);
    setError(null);
    setStatusMessage(null);

    try {
      await api.updateMiningPower(power);
      const session = await api.startSession(power);
      setSessionId(session.id);
      const stats = await window.desktop.mining.start(power);
      setMinerStats(stats);
      setStatusMessage(
        stats.mode === 'xmrig'
          ? 'Mining with XMRig'
          : 'Mining in simulated mode (XMRig not found)',
      );
      await refreshDashboard();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Failed to start mining');
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
      setStatusMessage(
        `Session complete. +${result.rewards.coinAmount} coins${result.progression.leveledUp ? ' and level up!' : '.'}`,
      );
      await refreshDashboard();
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : 'Failed to stop mining');
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
      setStatusMessage('Mining session aborted.');
      await refreshDashboard();
    } catch (abortError) {
      setError(abortError instanceof Error ? abortError.message : 'Failed to abort mining');
    } finally {
      setBusy(false);
    }
  };

  if (!dashboard) {
    return <div className="loading">Loading dashboard…</div>;
  }

  const isMining = Boolean(sessionId && minerStats?.running);

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Gamer Mining Rewards</p>
          <h1>{userLabel}</h1>
        </div>
        <button className="ghost" type="button" onClick={logout}>
          Sign out
        </button>
      </header>

      <section className="grid">
        <article className="panel highlight">
          <h2>Wallet</h2>
          <p className="metric">{dashboard.wallet.coinBalance}</p>
          <p className="muted">coins available</p>
        </article>

        <article className="panel">
          <h2>Level {dashboard.progression.level}</h2>
          <p className="metric">{dashboard.progression.xp} XP</p>
          <p className="muted">
            {dashboard.progression.xpToNextLevel ?? 0} XP to next level
          </p>
        </article>

        <article className="panel">
          <h2>Referrals</h2>
          <p className="metric">{dashboard.profile.referralsCount}</p>
          <p className="muted">code {dashboard.profile.referralCode}</p>
        </article>
      </section>

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
          <span className={`badge ${isMining ? 'live' : ''}`}>
            {isMining ? minerStats?.mode ?? 'active' : 'idle'}
          </span>
        </div>

        <label className="slider-label">
          CPU power: {power}%
          <input
            type="range"
            min={0}
            max={90}
            value={power}
            disabled={isMining || busy}
            onChange={(event) => setPower(Number(event.target.value))}
          />
        </label>

        {minerStats && (
          <div className="stats-grid">
            <div>
              <span>Hashrate</span>
              <strong>{minerStats.hashrate.toFixed(2)} H/s</strong>
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
            <button className="primary" type="button" disabled={busy} onClick={() => void startMining()}>
              Start mining
            </button>
          ) : (
            <>
              <button className="primary" type="button" disabled={busy} onClick={() => void stopMining()}>
                Stop and settle
              </button>
              <button className="ghost" type="button" disabled={busy} onClick={() => void abortMining()}>
                Abort
              </button>
            </>
          )}
        </div>

        {statusMessage && <p className="success">{statusMessage}</p>}
        {error && <p className="error">{error}</p>}
        {minerStats?.lastError && <p className="error">{minerStats.lastError}</p>}
      </section>
    </div>
  );
}

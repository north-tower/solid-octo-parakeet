import { AnimatedHashrate } from '../components/AnimatedHashrate';
import { PowerSlider } from '../components/PowerSlider';
import { useMining } from '../contexts/MiningContext';
import { formatCoins, formatDuration } from '../utils/format';

function levelProgress(dashboard: NonNullable<ReturnType<typeof useMining>['dashboard']>) {
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
  const {
    dashboard,
    power,
    sessionId,
    minerStats,
    busy,
    error,
    walletFlash,
    isMining,
    setPower,
    startMining,
    stopMining,
    abortMining,
  } = useMining();

  if (!dashboard) {
    return <div className="loading">Loading dashboard…</div>;
  }

  const isFirstRun =
    Number.parseFloat(dashboard.wallet.coinBalance) === 0 &&
    dashboard.mining.completedSessions === 0;
  const progress = levelProgress(dashboard);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
      </header>

      <section className="grid grid-4">
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

        <article className="panel stat-card">
          <h2>Sessions</h2>
          <p className="metric">{dashboard.mining.completedSessions}</p>
          <p className="metric-caption">completed mining runs</p>
          <p className="muted">
            {formatDuration(dashboard.mining.totalSecondsMined)} total mined
          </p>
        </article>

        <article className="panel stat-card">
          <h2>Referral rate</h2>
          <p className="metric">{dashboard.progression.referralPercent}%</p>
          <p className="metric-caption">commission on friend earnings</p>
          <p className="muted">{dashboard.profile.referralsCount} friends referred</p>
        </article>
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
    </div>
  );
}

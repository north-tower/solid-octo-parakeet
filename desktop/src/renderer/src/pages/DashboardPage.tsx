import { Clock, Trophy, Users } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useMining } from '../contexts/MiningContext';
import { formatDuration } from '../utils/format';
import { FirstRunCard, getFirstRunDismissed, setFirstRunDismissed } from '../components/dashboard/FirstRunCard';
import { MiningControlPanel } from '../components/dashboard/MiningControlPanel';
import { StatCard } from '../components/dashboard/StatCard';
import { WalletHeroCard } from '../components/dashboard/WalletHeroCard';
import { WeeklyActivityChart } from '../components/dashboard/WeeklyActivityChart';

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

  const [bannerDismissed, setBannerDismissed] = useState(getFirstRunDismissed);

  useEffect(() => {
    if (dashboard && dashboard.mining.completedSessions > 0) {
      setFirstRunDismissed();
      setBannerDismissed(true);
    }
  }, [dashboard?.mining.completedSessions]);

  const miningRingProgress = useMemo(() => {
    if (!isMining || !minerStats) {
      return 0;
    }
    return Math.min(100, minerStats.powerPercent + (minerStats.hashrate % 20));
  }, [isMining, minerStats]);

  if (!dashboard) {
    return <div className="loading">Loading dashboard…</div>;
  }

  const progress = levelProgress(dashboard);
  const isFirstRun =
    Number.parseFloat(dashboard.wallet.coinBalance) === 0 &&
    dashboard.mining.completedSessions === 0;

  const showFirstRun = isFirstRun && !isMining && !bannerDismissed;

  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
      </header>

      <section className="dashboard-hero-grid">
        <WalletHeroCard
          balance={dashboard.wallet.coinBalance}
          walletFlash={walletFlash}
          isMining={isMining}
          miningProgress={miningRingProgress}
          powerPercent={minerStats?.powerPercent ?? power}
        />

        <StatCard
          title={`Level ${dashboard.progression.level}`}
          value={dashboard.progression.xp}
          caption="total XP earned"
          icon={Trophy}
        >
          <div className="xp-progress xp-progress-lg">
            <div
              className="xp-progress-bar xp-progress-bar-shimmer"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="muted xp-progress-label">
            {dashboard.progression.xpToNextLevel ?? 0} XP to next level
          </p>
        </StatCard>

        <StatCard
          title="Sessions"
          value={dashboard.mining.completedSessions}
          caption="completed mining runs"
          icon={Clock}
          footer={
            <p className="muted">
              {formatDuration(dashboard.mining.totalSecondsMined)} total mined
            </p>
          }
        />

        <StatCard
          title="Referral rate"
          value={dashboard.progression.referralPercent}
          suffix="%"
          caption="commission on friend earnings"
          icon={Users}
          footer={
            <p className="muted">{dashboard.profile.referralsCount} friends referred</p>
          }
        />
      </section>

      <AnimatePresence>
        {showFirstRun && (
          <FirstRunCard
            visible
            onDismiss={() => {
              setFirstRunDismissed();
              setBannerDismissed(true);
            }}
          />
        )}
      </AnimatePresence>

      <MiningControlPanel
        isMining={isMining}
        busy={busy}
        power={power}
        sessionId={sessionId}
        minerStats={minerStats}
        error={error}
        onPowerChange={setPower}
        onStart={() => void startMining()}
        onStop={() => void stopMining()}
        onAbort={() => void abortMining()}
      />

      <WeeklyActivityChart />
    </div>
  );
}

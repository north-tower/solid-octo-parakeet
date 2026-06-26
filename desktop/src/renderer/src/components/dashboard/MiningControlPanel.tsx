import { Clock, Coins, Layers, Play, Square, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import type { MinerStats } from '@shared/constants';
import { PowerSlider, useButtonRipple } from '../PowerSlider';
import { AnimatedHashrate } from '../AnimatedHashrate';
import { formatDuration } from '../../utils/format';
import {
  estimateCoinsInMinutes,
  formatEstimatedCoins,
} from '../../utils/earnings';
import { CHART_COLORS, CHART_GRADIENT_ID } from '../../utils/chartTheme';

interface MiningControlPanelProps {
  isMining: boolean;
  busy: boolean;
  power: number;
  sessionId: string | null;
  minerStats: MinerStats | null;
  error: string | null;
  onPowerChange: (value: number) => void;
  onStart: () => void;
  onStop: () => void;
  onAbort: () => void;
}

interface HashratePoint {
  time: number;
  hashrate: number;
}

const MAX_HASHRATE_POINTS = 48;
const HASHRATE_SAMPLE_MS = 1500;

const IDLE_BASELINE: HashratePoint[] = Array.from({ length: 16 }, (_, index) => ({
  time: index,
  hashrate: 0,
}));

function MiningStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`mining-status-badge${active ? ' active' : ''}`}
      aria-live="polite"
    >
      <span className="mining-status-dot" aria-hidden="true" />
      {active ? 'Mining' : 'Idle'}
    </span>
  );
}

function HashrateChart({
  isMining,
  data,
  currentRate,
}: {
  isMining: boolean;
  data: HashratePoint[];
  currentRate: number;
}) {
  const chartData = isMining && data.length > 0 ? data : IDLE_BASELINE;
  const yMax = Math.max(1, ...chartData.map((point) => point.hashrate), currentRate);

  return (
    <div
      className={`dashboard-hashrate-chart${isMining ? ' live' : ' idle'}`}
    >
      <div className="dashboard-chart-label">
        <span>Session hashrate</span>
        {isMining && (
          <AnimatedHashrate value={currentRate} active />
        )}
      </div>

      <div className="dashboard-hashrate-chart-body">
        <ResponsiveContainer width="100%" height={112} minWidth={0}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`${CHART_GRADIENT_ID}-hash`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.accentStart} stopOpacity={0.32} />
                <stop offset="100%" stopColor={CHART_COLORS.accentEnd} stopOpacity={0.02} />
              </linearGradient>
              <filter id="hashrate-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke={CHART_COLORS.grid}
              strokeDasharray="4 6"
            />
            <YAxis hide domain={[0, yMax * 1.15]} />
            <Area
              type="monotone"
              dataKey="hashrate"
              stroke={isMining ? CHART_COLORS.accentStart : 'rgba(148, 163, 184, 0.35)'}
              strokeWidth={isMining ? 2.5 : 1.5}
              fill={isMining ? `url(#${CHART_GRADIENT_ID}-hash)` : 'rgba(148, 163, 184, 0.06)'}
              isAnimationActive={false}
              dot={false}
              activeDot={isMining ? { r: 3, fill: CHART_COLORS.accentEnd } : false}
              style={
                isMining
                  ? { filter: 'url(#hashrate-line-glow)' }
                  : undefined
              }
            />
          </AreaChart>
        </ResponsiveContainer>

        {!isMining && (
          <div className="dashboard-hashrate-idle-overlay">
            <p>Start mining to see live hashrate</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MiningStatStrip({
  minerStats,
  isMining,
}: {
  minerStats: MinerStats | null;
  isMining: boolean;
}) {
  const hashrate = minerStats?.hashrate ?? 0;
  const duration = minerStats?.totalSeconds ?? 0;
  const shares = minerStats?.sharesAccepted ?? 0;
  const rawValue = minerStats?.rawMinedValue ?? '0';

  const items: Array<{
    label: string;
    icon: typeof Zap;
    value: string;
    node?: ReactNode;
  }> = [
    {
      label: 'Hashrate',
      icon: Zap,
      value: isMining || hashrate > 0 ? '' : '—',
      node:
        isMining || hashrate > 0 ? (
          <AnimatedHashrate value={hashrate} active={isMining} />
        ) : undefined,
    },
    {
      label: 'Duration',
      icon: Clock,
      value: duration > 0 ? formatDuration(duration) : '—',
    },
    {
      label: 'Shares',
      icon: Layers,
      value: shares > 0 ? String(shares) : '—',
    },
    {
      label: 'Raw value',
      icon: Coins,
      value: Number.parseFloat(rawValue) > 0 ? rawValue : '—',
    },
  ];

  return (
    <div className="mining-stat-strip">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="mining-stat-item">
            {index > 0 && <span className="mining-stat-divider" aria-hidden="true" />}
            <Icon size={15} strokeWidth={1.75} className="mining-stat-icon" aria-hidden="true" />
            <span className="mining-stat-label">{item.label}</span>
            <span className="mining-stat-value">
              {item.node ?? item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MiningControlPanel({
  isMining,
  busy,
  power,
  sessionId,
  minerStats,
  error,
  onPowerChange,
  onStart,
  onStop,
  onAbort,
}: MiningControlPanelProps) {
  const [hashrateHistory, setHashrateHistory] = useState<HashratePoint[]>([]);
  const minerStatsRef = useRef(minerStats);
  minerStatsRef.current = minerStats;
  const tickRef = useRef(0);
  const { ripple, triggerRipple } = useButtonRipple();

  useEffect(() => {
    if (!isMining) {
      setHashrateHistory([]);
      tickRef.current = 0;
      return;
    }

    const pushPoint = () => {
      const rate = minerStatsRef.current?.hashrate ?? 0;
      tickRef.current += 1;
      setHashrateHistory((current) => {
        const next = [...current, { time: tickRef.current, hashrate: rate }];
        return next.slice(-MAX_HASHRATE_POINTS);
      });
    };

    pushPoint();
    const timer = window.setInterval(pushPoint, HASHRATE_SAMPLE_MS);
    return () => window.clearInterval(timer);
  }, [isMining]);

  const estimatedFiveMin = useMemo(
    () =>
      estimateCoinsInMinutes(
        5,
        isMining ? (minerStats?.powerPercent ?? power) : power,
      ),
    [isMining, minerStats?.powerPercent, power],
  );

  const currentRate = minerStats?.hashrate ?? 0;

  const handleStart = (event: MouseEvent<HTMLButtonElement>) => {
    triggerRipple(event);
    onStart();
  };

  const handleStop = (event: MouseEvent<HTMLButtonElement>) => {
    triggerRipple(event);
    onStop();
  };

  return (
    <section
      className={`panel dashboard-mining-panel${isMining ? ' mining-active' : ''}`}
    >
      {isMining && (
        <>
          <div className="mining-panel-scan" aria-hidden="true" />
          <div className="mining-panel-wave" aria-hidden="true" />
          <div className="mining-panel-particles" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <span key={index} style={{ '--i': index } as CSSProperties} />
            ))}
          </div>
        </>
      )}

      <div className="mining-header">
        <div>
          <h2>Mining control</h2>
          <p className="muted">
            {isMining
              ? `Active session ${sessionId?.slice(0, 8)}…`
              : 'Your cockpit — start a session to earn coins and XP'}
          </p>
        </div>
        <MiningStatusBadge active={isMining} />
      </div>

      <HashrateChart
        isMining={isMining}
        data={hashrateHistory}
        currentRate={currentRate}
      />

      <PowerSlider
        value={power}
        disabled={isMining || busy}
        onChange={onPowerChange}
        enhanced
        miningActive={isMining}
      />

      <p className="dashboard-estimated-earnings muted">
        Estimated earnings:{' '}
        <strong>
          ~{formatEstimatedCoins(estimatedFiveMin)} coins in the next 5 min
        </strong>{' '}
        at {isMining ? minerStats?.powerPercent ?? power : power}% CPU
      </p>

      <MiningStatStrip minerStats={minerStats} isMining={isMining} />

      <div className="actions">
        {!isMining ? (
          <div className="dashboard-earn-button-wrap">
            {ripple && (
              <span
                className="dashboard-earn-ripple"
                style={{ left: ripple.x, top: ripple.y }}
                aria-hidden="true"
              />
            )}
            <motion.button
              className="primary dashboard-earn-button dashboard-earn-start"
              type="button"
              disabled={busy}
              whileTap={{ scale: 0.96 }}
              onClick={handleStart}
            >
              <Play size={18} fill="currentColor" aria-hidden="true" />
              Start mining
            </motion.button>
          </div>
        ) : (
          <>
            <div className="dashboard-earn-button-wrap">
              {ripple && (
                <span
                  className="dashboard-earn-ripple stop"
                  style={{ left: ripple.x, top: ripple.y }}
                  aria-hidden="true"
                />
              )}
              <motion.button
                className="primary dashboard-earn-button dashboard-earn-stop"
                type="button"
                disabled={busy}
                whileTap={{ scale: 0.96 }}
                onClick={handleStop}
              >
                <Square size={16} fill="currentColor" aria-hidden="true" />
                Stop mining
              </motion.button>
            </div>
            <button
              className="ghost"
              type="button"
              disabled={busy}
              onClick={onAbort}
            >
              Abort
            </button>
          </>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {minerStats?.lastError && <p className="error">{minerStats.lastError}</p>}
    </section>
  );
}

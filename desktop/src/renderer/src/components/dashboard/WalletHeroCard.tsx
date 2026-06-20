import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';
import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { MiningActivityRing } from './MiningActivityRing';
import { CHART_COLORS, CHART_GRADIENT_ID } from '../../utils/chartTheme';
import { formatCoins } from '../../utils/format';

const BALANCE_HISTORY_KEY = 'gmr_balance_history';

interface HistoryPoint {
  date: string;
  balance: number;
}

function loadBalanceHistory(): HistoryPoint[] {
  try {
    const raw = localStorage.getItem(BALANCE_HISTORY_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as HistoryPoint[];
  } catch {
    return [];
  }
}

function saveBalanceHistory(points: HistoryPoint[]) {
  localStorage.setItem(BALANCE_HISTORY_KEY, JSON.stringify(points));
}

function buildChartData(balance: number) {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    keys.push(date.toISOString().slice(0, 10));
  }

  const history = loadBalanceHistory();
  const byDate = new Map(history.map((point) => [point.date, point.balance]));

  return keys.map((date) => ({
    date,
    label: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
    }),
    balance: byDate.get(date) ?? (date === keys.at(-1) ? balance : 0),
  }));
}

interface WalletHeroCardProps {
  balance: string;
  walletFlash: boolean;
  isMining: boolean;
  miningProgress: number;
  powerPercent: number;
}

export function WalletHeroCard({
  balance,
  walletFlash,
  isMining,
  miningProgress,
  powerPercent,
}: WalletHeroCardProps) {
  const numericBalance = Number.parseFloat(balance) || 0;
  const [chartData, setChartData] = useState(() => buildChartData(numericBalance));

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const history = loadBalanceHistory().filter((point) => {
      const age = Date.now() - new Date(`${point.date}T12:00:00`).getTime();
      return age < 8 * 24 * 60 * 60 * 1000;
    });

    const existing = history.find((point) => point.date === today);
    if (existing) {
      existing.balance = numericBalance;
    } else {
      history.push({ date: today, balance: numericBalance });
    }

    saveBalanceHistory(history);
    setChartData(buildChartData(numericBalance));
  }, [numericBalance]);

  return (
    <motion.article
      className={`panel dashboard-wallet-hero${walletFlash ? ' wallet-flash' : ''}`}
      layout
    >
      <div className="dashboard-wallet-glow" aria-hidden="true" />
      <div className="dashboard-card-icon" aria-hidden="true">
        <Coins size={20} strokeWidth={1.75} />
      </div>

      <div className="dashboard-wallet-body">
        <div className="dashboard-wallet-copy">
          <h2>Wallet</h2>
          <p className="dashboard-wallet-metric">
            <AnimatedNumber
              value={numericBalance}
              decimals={numericBalance % 1 === 0 ? 0 : 4}
              className="gradient-metric-text"
            />
          </p>
          <p className="metric-caption">coins available</p>
        </div>

        <MiningActivityRing
          active={isMining}
          progress={miningProgress}
          powerPercent={powerPercent}
        />
      </div>

      <div className="dashboard-wallet-sparkline">
        <ResponsiveContainer width="100%" height={72}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.accentStart} stopOpacity={0.45} />
                <stop offset="100%" stopColor={CHART_COLORS.accentEnd} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="balance"
              stroke={CHART_COLORS.accentStart}
              strokeWidth={2}
              fill={`url(#${CHART_GRADIENT_ID})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="dashboard-sparkline-caption muted">
          Balance trend · last 7 days · {formatCoins(balance)} today
        </p>
      </div>
    </motion.article>
  );
}

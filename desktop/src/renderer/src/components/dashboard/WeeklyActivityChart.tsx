import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../api/client';
import {
  CHART_COLORS,
  CHART_GRADIENT_ID,
  last7DayKeys,
  last7DayLabels,
} from '../../utils/chartTheme';
import { formatCoins } from '../../utils/format';

interface DayDatum {
  label: string;
  coins: number;
  dateKey: string;
}

function buildEmptyWeek(): DayDatum[] {
  const keys = last7DayKeys();
  const labels = last7DayLabels();
  return keys.map((dateKey, index) => ({
    dateKey,
    label: labels[index],
    coins: 0,
  }));
}

export function WeeklyActivityChart() {
  const [data, setData] = useState<DayDatum[]>(buildEmptyWeek);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .getSessionHistory(1, 100)
      .then((response) => {
        const buckets = new Map<string, number>();
        for (const key of last7DayKeys()) {
          buckets.set(key, 0);
        }

        for (const session of response.sessions) {
          const ended = session.endedAt ?? session.startedAt;
          const key = ended.slice(0, 10);
          if (!buckets.has(key)) {
            continue;
          }
          const coins = Number.parseFloat(session.coinsEarned) || 0;
          buckets.set(key, (buckets.get(key) ?? 0) + coins);
        }

        const keys = last7DayKeys();
        const labels = last7DayLabels();
        setData(
          keys.map((dateKey, index) => ({
            dateKey,
            label: labels[index],
            coins: buckets.get(dateKey) ?? 0,
          })),
        );
      })
      .catch(() => {
        setData(buildEmptyWeek());
      })
      .finally(() => setLoading(false));
  }, []);

  const maxCoins = useMemo(
    () => Math.max(1, ...data.map((day) => day.coins)),
    [data],
  );

  const hasActivity = data.some((day) => day.coins > 0);

  return (
    <section className="panel dashboard-weekly-chart">
      <div className="dashboard-weekly-header">
        <div>
          <h2>Weekly activity</h2>
          <p className="muted">Coins earned per day — last 7 days</p>
        </div>
      </div>

      {loading ? (
        <p className="muted dashboard-chart-loading">Loading activity…</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220} minWidth={0}>
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
              barCategoryGap="22%"
            >
              <defs>
                <linearGradient id={`${CHART_GRADIENT_ID}-bar`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.accentEnd} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={CHART_COLORS.accentStart} stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id={`${CHART_GRADIENT_ID}-bar-empty`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.accentStart} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={CHART_COLORS.accentEnd} stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke={CHART_COLORS.grid}
                strokeDasharray="4 6"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={40}
                domain={[0, maxCoins]}
                allowDecimals={maxCoins < 10}
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
              />
              <ReferenceLine y={0} stroke={CHART_COLORS.grid} />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                contentStyle={{
                  background: CHART_COLORS.tooltipBg,
                  border: `1px solid ${CHART_COLORS.grid}`,
                  borderRadius: 10,
                }}
                formatter={(value) => [formatCoins(Number(value ?? 0)), 'Coins']}
              />
              <Bar
                dataKey="coins"
                fill={
                  hasActivity
                    ? `url(#${CHART_GRADIENT_ID}-bar)`
                    : `url(#${CHART_GRADIENT_ID}-bar-empty)`
                }
                radius={[8, 8, 0, 0]}
                minPointSize={hasActivity ? 0 : 6}
                maxBarSize={48}
                isAnimationActive
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
          {!hasActivity && (
            <p className="dashboard-weekly-empty muted">
              No activity yet this week — start mining to fill the chart
            </p>
          )}
        </>
      )}
    </section>
  );
}

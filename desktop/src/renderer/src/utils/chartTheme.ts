export const CHART_COLORS = {
  accentStart: '#6366f1',
  accentEnd: '#a855f7',
  grid: 'rgba(148, 163, 184, 0.08)',
  axis: 'rgba(148, 163, 184, 0.35)',
  tooltipBg: 'rgba(15, 23, 42, 0.96)',
};

export const CHART_GRADIENT_ID = 'dashboard-accent-gradient';

export function last7DayLabels() {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(
      date.toLocaleDateString(undefined, { weekday: 'short' }),
    );
  }
  return labels;
}

export function last7DayKeys() {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    keys.push(date.toISOString().slice(0, 10));
  }
  return keys;
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function formatCoins(value: string | number) {
  const parsed =
    typeof value === 'number' ? value : Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return String(value);
  }
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

export function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatHashrate(hashrate: number | string | null) {
  if (hashrate === null || hashrate === undefined) {
    return '—';
  }
  const value = typeof hashrate === 'string' ? Number.parseFloat(hashrate) : hashrate;
  if (Number.isNaN(value)) {
    return '—';
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kH/s`;
  }
  return `${value.toFixed(2)} H/s`;
}

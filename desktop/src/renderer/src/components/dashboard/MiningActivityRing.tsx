import { motion } from 'framer-motion';

interface MiningActivityRingProps {
  active: boolean;
  progress: number;
  powerPercent: number;
}

export function MiningActivityRing({
  active,
  progress,
  powerPercent,
}: MiningActivityRingProps) {
  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div
      className={`mining-activity-ring${active ? ' active' : ''}`}
      aria-label={active ? `Mining at ${powerPercent}% power` : 'Mining idle'}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="mining-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle
          className="mining-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <motion.circle
          className="mining-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: active ? offset : circumference }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="mining-ring-center">
        <strong>{active ? `${Math.round(powerPercent)}%` : 'IDLE'}</strong>
        <span>{active ? 'CPU' : 'Ready'}</span>
      </div>
      {active && <div className="mining-ring-pulse" aria-hidden="true" />}
    </div>
  );
}

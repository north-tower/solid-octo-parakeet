import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  title: string;
  value: number;
  decimals?: number;
  suffix?: string;
  caption: string;
  footer?: ReactNode;
  icon: LucideIcon;
  children?: ReactNode;
}

export function StatCard({
  title,
  value,
  decimals = 0,
  suffix = '',
  caption,
  footer,
  icon: Icon,
  children,
}: StatCardProps) {
  return (
    <article className="panel dashboard-stat-card">
      <div className="dashboard-card-glow" aria-hidden="true" />
      <div className="dashboard-card-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <h2>{title}</h2>
      <p className="metric">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </p>
      <p className="metric-caption">{caption}</p>
      {footer && <div className="dashboard-stat-footer">{footer}</div>}
      {children}
    </article>
  );
}

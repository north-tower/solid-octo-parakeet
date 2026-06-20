import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

const ROUTE_META: Record<string, { section: string; title: string }> = {
  '/': { section: 'Overview', title: 'Dashboard' },
  '/history': { section: 'Activity', title: 'Mining history' },
  '/referrals': { section: 'Community', title: 'Referrals' },
  '/redeem': { section: 'Wallet', title: 'Redeem & withdraw' },
  '/profile': { section: 'Account', title: 'Profile' },
  '/settings': { section: 'Preferences', title: 'Settings' },
};

interface ShellHeaderProps {
  onNotificationsOpen?: () => void;
}

export function ShellHeader({ onNotificationsOpen }: ShellHeaderProps) {
  const { pathname } = useLocation();
  const meta = ROUTE_META[pathname] ?? { section: 'App', title: 'Gamer Mining Rewards' };

  return (
    <header className="shell-header">
      <nav className="shell-breadcrumb" aria-label="Breadcrumb">
        <span className="shell-breadcrumb-section">{meta.section}</span>
        <ChevronRight size={14} className="shell-breadcrumb-sep" aria-hidden="true" />
        <span className="shell-breadcrumb-title">{meta.title}</span>
      </nav>
      <NotificationBell onOpen={onNotificationsOpen} />
    </header>
  );
}

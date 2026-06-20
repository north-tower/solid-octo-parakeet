import {
  ChevronLeft,
  ChevronRight,
  Gift,
  History,
  LayoutDashboard,
  Settings,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { OnboardingModal } from '../components/OnboardingModal';
import { ShellHeader } from '../components/ShellHeader';
import { SidebarUserCard } from '../components/SidebarUserCard';
import { useNotifications } from '../contexts/NotificationsContext';
import { isOnboardingComplete } from '../utils/localPrefs';

const SIDEBAR_COLLAPSED_KEY = 'gmr_sidebar_collapsed';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history', label: 'History', icon: History },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/redeem', label: 'Redeem', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: User },
];

const SETTINGS_NAV: NavItem = {
  to: '/settings',
  label: 'Settings',
  icon: Settings,
};

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Gift size={18} strokeWidth={2.25} />
    </span>
  );
}

function SidebarNavLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `sidebar-link${isActive ? ' active' : ''}${collapsed ? ' collapsed' : ''}`
      }
    >
      <span className="sidebar-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      {!collapsed && <span className="sidebar-label">{item.label}</span>}
    </NavLink>
  );
}

export function AppShell() {
  const { markAllRead } = useNotifications();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  );
  const onboardingChecked = useRef(false);

  useEffect(() => {
    if (onboardingChecked.current) {
      return;
    }
    onboardingChecked.current = true;
    if (!isOnboardingComplete()) {
      setShowOnboarding(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <BrandMark />
            {!collapsed && (
              <p className="sidebar-wordmark">GAMER MINING REWARDS</p>
            )}
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleCollapsed}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="sidebar-nav-group">
            {MAIN_NAV.map((item) => (
              <SidebarNavLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="sidebar-divider" role="separator" />

          <div className="sidebar-nav-group sidebar-nav-bottom">
            <SidebarNavLink item={SETTINGS_NAV} collapsed={collapsed} />
          </div>
        </nav>

        <div className="sidebar-footer">
          <SidebarUserCard collapsed={collapsed} />
        </div>
      </aside>

      <div className="shell-main">
        <ShellHeader onNotificationsOpen={markAllRead} />
        <main className="shell-content">
          <div className="shell-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

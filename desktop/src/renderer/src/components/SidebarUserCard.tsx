import { ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarPreference } from '../utils/localPrefs';
import { getInitials } from '../utils/validation';

interface SidebarUserCardProps {
  collapsed: boolean;
}

export function SidebarUserCard({ collapsed }: SidebarUserCardProps) {
  const { userLabel, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const avatarPref = getAvatarPreference();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const avatarStyle =
    avatarPref?.startsWith('data:')
      ? {
          backgroundImage: `url(${avatarPref})`,
          backgroundSize: 'cover' as const,
          backgroundPosition: 'center' as const,
        }
      : undefined;

  return (
    <div
      className={`sidebar-user-card${collapsed ? ' collapsed' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="sidebar-user-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        title={collapsed ? userLabel : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="avatar avatar-sm" style={avatarStyle} aria-hidden="true">
          {!avatarPref?.startsWith('data:') && getInitials(userLabel)}
        </span>
        {!collapsed && (
          <>
            <span className="sidebar-user-label">{userLabel}</span>
            <ChevronDown
              size={16}
              className={`sidebar-user-chevron${open ? ' open' : ''}`}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {open && (
        <div className="sidebar-user-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/profile');
            }}
          >
            <User size={16} aria-hidden="true" />
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger-item"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

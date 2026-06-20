import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../contexts/NotificationsContext';
import { formatDate } from '../utils/format';

interface NotificationBellProps {
  onOpen?: () => void;
}

export function NotificationBell({ onOpen }: NotificationBellProps) {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      onOpen?.();
    }
  };

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className={`notification-trigger${open ? ' open' : ''}`}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell size={18} strokeWidth={1.75} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-dropdown-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <span className="notification-unread-label">{unreadCount} new</span>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="notification-empty muted">No notifications yet</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notification-item${item.read ? '' : ' unread'}`}
                    onClick={() => markRead(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                    <time className="muted">{formatDate(item.createdAt)}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

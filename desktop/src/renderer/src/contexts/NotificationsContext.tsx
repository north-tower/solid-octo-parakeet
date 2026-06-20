import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type NotificationType =
  | 'level_up'
  | 'referral_joined'
  | 'payout_processed'
  | 'mining_complete';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  addNotification: (
    notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>,
  ) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'welcome-1',
    type: 'level_up',
    title: 'Welcome aboard!',
    message: 'Complete mining sessions to level up and earn more rewards.',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] =
    useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markAllRead = useCallback(() => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
  }, []);

  const addNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
      setNotifications((current) => [
        {
          ...notification,
          id: crypto.randomUUID(),
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    },
    [],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      addNotification,
    }),
    [notifications, unreadCount, markAllRead, markRead, addNotification],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MiningProvider } from './contexts/MiningContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './components/Toast';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RedeemPage } from './pages/RedeemPage';
import { ReferralsPage } from './pages/ReferralsPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles/app.css';

function AuthenticatedApp() {
  return (
    <SettingsProvider>
      <NotificationsProvider>
        <MiningProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="referrals" element={<ReferralsPage />} />
              <Route path="redeem" element={<RedeemPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MiningProvider>
      </NotificationsProvider>
    </SettingsProvider>
  );
}

function AppRoutes() {
  const { ready, isAuthenticated } = useAuth();

  if (!ready) {
    return <div className="loading">Starting app…</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}

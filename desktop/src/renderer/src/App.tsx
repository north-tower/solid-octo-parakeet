import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import './styles/app.css';

function AppRoutes() {
  const { ready, isAuthenticated } = useAuth();

  if (!ready) {
    return <div className="loading">Starting app…</div>;
  }

  return isAuthenticated ? <DashboardPage /> : <LoginPage />;
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

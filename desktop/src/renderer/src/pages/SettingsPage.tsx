import { useEffect, useState } from 'react';
import { PowerSlider } from '../components/PowerSlider';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { api } from '../api/client';
import { desktopApi } from '../lib/desktopApi';
import { DEFAULT_MINING_POOL_CONFIG } from '@shared/constants';

export function SettingsPage() {
  const { logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [poolUrl, setPoolUrl] = useState(DEFAULT_MINING_POOL_CONFIG.poolUrl);
  const [savingPool, setSavingPool] = useState(false);

  useEffect(() => {
    void desktopApi.miningPool.get().then((config) => {
      setPoolUrl(config.poolUrl);
    });
  }, []);

  const saveMiningPool = async () => {
    setSavingPool(true);
    try {
      await desktopApi.miningPool.set({ poolUrl });
      showToast('Mining pool settings saved', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to save mining pool settings',
        'error',
      );
    } finally {
      setSavingPool(false);
    }
  };

  const updateNotification = async (
    key: keyof typeof settings.notifications,
    checked: boolean,
  ) => {
    await updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: checked,
      },
    });
  };

  const saveDefaultPower = async (value: number) => {
    await updateSettings({ defaultCpuPower: value });
    try {
      await api.updateMiningPower(value);
      showToast('Default CPU power saved', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to sync mining power',
        'error',
      );
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Preferences</p>
          <h1>Settings</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <h2>Mining</h2>
        <label className="toggle-row">
          <span>
            <strong>Auto-start mining on launch</strong>
            <small className="muted">Begin a session when the app opens</small>
          </span>
          <input
            type="checkbox"
            checked={settings.autoStartMining}
            onChange={(event) =>
              void updateSettings({ autoStartMining: event.target.checked })
            }
          />
        </label>

        <label className="toggle-row">
          <span>
            <strong>Minimize to system tray on close</strong>
            <small className="muted">Keep mining in the background when closing the window</small>
          </span>
          <input
            type="checkbox"
            checked={settings.minimizeToTray}
            onChange={(event) =>
              void updateSettings({ minimizeToTray: event.target.checked })
            }
          />
        </label>

        <div className="field">
          <span>Default CPU power for new sessions</span>
          <PowerSlider
            value={settings.defaultCpuPower}
            disabled={false}
            onChange={(value) => void saveDefaultPower(value)}
          />
        </div>
      </section>

      <section className="panel form-panel">
        <h2>Mining pool</h2>
        <p className="muted">
          Pool payouts use the platform wallet configured in the app. You can change the pool URL below.
        </p>
        <label className="field">
          <span>Pool URL</span>
          <input
            type="text"
            value={poolUrl}
            onChange={(event) => setPoolUrl(event.target.value)}
            placeholder="pool.supportxmr.com:443"
          />
        </label>
        <div className="actions">
          <button
            type="button"
            className="primary"
            disabled={savingPool}
            onClick={() => void saveMiningPool()}
          >
            Save pool URL
          </button>
        </div>
      </section>

      <section className="panel form-panel">
        <h2>Notifications</h2>
        <label className="toggle-row">
          <span>Level up alerts</span>
          <input
            type="checkbox"
            checked={settings.notifications.levelUp}
            onChange={(event) => void updateNotification('levelUp', event.target.checked)}
          />
        </label>
        <label className="toggle-row">
          <span>Referral joined</span>
          <input
            type="checkbox"
            checked={settings.notifications.referralJoined}
            onChange={(event) =>
              void updateNotification('referralJoined', event.target.checked)
            }
          />
        </label>
        <label className="toggle-row">
          <span>Payout processed</span>
          <input
            type="checkbox"
            checked={settings.notifications.payoutProcessed}
            onChange={(event) =>
              void updateNotification('payoutProcessed', event.target.checked)
            }
          />
        </label>
        <label className="toggle-row">
          <span>Mining session complete</span>
          <input
            type="checkbox"
            checked={settings.notifications.miningComplete}
            onChange={(event) =>
              void updateNotification('miningComplete', event.target.checked)
            }
          />
        </label>
      </section>

      <section className="panel danger-zone">
        <h2>Danger zone</h2>
        <p className="muted">
          Permanently delete your account and all associated data.
        </p>
        <div className="actions">
          <button type="button" className="ghost" onClick={() => setConfirmLogout(true)}>
            Log out
          </button>
          <button type="button" className="danger" onClick={() => setConfirmDelete(true)}>
            Delete account
          </button>
        </div>
      </section>

      {confirmLogout && (
        <ConfirmModal
          title="Log out?"
          message="You will need to sign in again to access your wallet and mining sessions."
          confirmLabel="Log out"
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => {
            setConfirmLogout(false);
            logout();
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete account?"
          message="This action cannot be undone. Please contact support to delete your account."
          confirmLabel="Contact support"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            showToast('Please contact support to delete your account', 'info');
          }}
        />
      )}
    </div>
  );
}

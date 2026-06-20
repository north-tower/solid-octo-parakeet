import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { AVATAR_PRESETS, COINS_PER_USER_REWARD_UNIT } from '@shared/constants';
import { api, type DashboardResponse, type UserProfileResponse } from '../api/client';
import { PasswordField } from '../components/PasswordField';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import {
  getAvatarPreference,
  setAvatarPreference,
} from '../utils/localPrefs';
import {
  validatePassword,
  validatePasswordConfirm,
  getInitials,
} from '../utils/validation';
import { formatCoins, formatDate } from '../utils/format';

export function ProfilePage() {
  const { userLabel } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(getAvatarPreference());
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([api.getProfile(), api.getDashboard()])
      .then(([profileData, dashboardData]) => {
        setProfile(profileData);
        setDashboard(dashboardData);
        setDisplayName(profileData.displayName ?? '');
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load profile',
        );
      });
  }, []);

  const lifetimeCoins = useMemo(() => {
    if (!dashboard) {
      return '0';
    }
    const raw = Number.parseFloat(dashboard.mining.totalRawMinedValue);
    if (Number.isNaN(raw)) {
      return '0';
    }
    const userReward = raw * 0.8;
    return (userReward * COINS_PER_USER_REWARD_UNIT).toFixed(4);
  }, [dashboard]);

  const avatarStyle = useMemo(() => {
    if (avatar?.startsWith('data:')) {
      return {
        backgroundImage: `url(${avatar})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    const preset = AVATAR_PRESETS.find((item) => item.id === avatar);
    if (preset) {
      return { background: preset.color };
    }
    return undefined;
  }, [avatar]);

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      setAvatar(value);
    };
    reader.readAsDataURL(file);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDisplayName(profile?.displayName ?? '');
    setAvatar(getAvatarPreference());
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const saveProfile = async () => {
    if (!profile) {
      return;
    }

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      showToast('Display name is required', 'error');
      return;
    }

    if (newPassword || currentPassword || confirmPassword) {
      const currentError = !currentPassword ? 'Current password is required' : null;
      const newError = validatePassword(newPassword);
      const confirmError = validatePasswordConfirm(newPassword, confirmPassword);
      const passwordError = currentError ?? newError ?? confirmError;
      if (passwordError) {
        showToast(passwordError, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      if (trimmedName !== (profile.displayName ?? '')) {
        const updated = await api.updateProfile(trimmedName);
        setProfile((current) =>
          current ? { ...current, displayName: updated.displayName } : current,
        );
      }

      if (newPassword && currentPassword) {
        await api.changePassword(currentPassword, newPassword);
        showToast('Password updated', 'success');
      }

      setAvatarPreference(avatar);
      showToast('Profile saved', 'success');
      setEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (saveError) {
      showToast(
        saveError instanceof Error ? saveError.message : 'Failed to save profile',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!profile || !dashboard) {
    return <div className="loading">Loading profile…</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </div>
        {!editing && (
          <button type="button" className="primary" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        )}
      </header>

      <section className="profile-hero panel">
        <div className="avatar avatar-lg" style={avatarStyle} aria-hidden="true">
          {!avatar?.startsWith('data:') && getInitials(userLabel)}
        </div>
        <div>
          <h2>{profile.displayName ?? profile.email}</h2>
          <p className="muted">{profile.email}</p>
          <p className="muted">Member since {formatDate(profile.createdAt)}</p>
        </div>
      </section>

      <section className="grid grid-4">
        <article className="panel stat-card">
          <h2>Lifetime coins</h2>
          <p className="metric">{formatCoins(lifetimeCoins)}</p>
        </article>
        <article className="panel stat-card">
          <h2>Sessions</h2>
          <p className="metric">{dashboard.mining.completedSessions}</p>
        </article>
        <article className="panel stat-card">
          <h2>Level</h2>
          <p className="metric">{profile.level}</p>
        </article>
        <article className="panel stat-card">
          <h2>Rank</h2>
          <p className="metric">—</p>
          <p className="metric-caption muted">Global leaderboard</p>
        </article>
      </section>

      {editing && (
        <section className="panel form-panel">
          <h2>Edit profile</h2>
          <label className="field">
            <span>Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={64}
            />
          </label>

          <div className="field">
            <span>Avatar</span>
            <div className="avatar-picker">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`avatar-option${avatar === preset.id ? ' selected' : ''}`}
                  style={{ background: preset.color }}
                  aria-label={preset.label}
                  onClick={() => setAvatar(preset.id)}
                />
              ))}
            </div>
            <label className="upload-label">
              Upload image
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>

          <label className="field">
            <span>Email</span>
            <input value={profile.email} readOnly disabled />
            <small className="muted">Contact support to change your email address.</small>
          </label>

          <h3>Change password</h3>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />

          <div className="actions">
            <button
              type="button"
              className="primary"
              disabled={saving}
              onClick={() => void saveProfile()}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="ghost" disabled={saving} onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

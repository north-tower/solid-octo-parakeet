import { useEffect, useState } from 'react';
import { api, type ReferralsDashboardResponse } from '../api/client';
import { useToast } from '../components/Toast';
import { formatCoins, formatDate } from '../utils/format';

export function ReferralsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<ReferralsDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .getReferrals()
      .then(setData)
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load referrals',
        );
      });
  }, []);

  const copyCode = async () => {
    if (!data) {
      return;
    }
    await navigator.clipboard.writeText(data.profile.referralCode);
    showToast('Referral code copied', 'success');
  };

  if (error) {
    return (
      <div className="page">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="loading">Loading referrals…</div>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Community</p>
          <h1>Referrals</h1>
        </div>
      </header>

      <section className="grid grid-2">
        <article className="panel">
          <h2>Your code</h2>
          <div className="referral-code-box">
            <code>{data.profile.referralCode}</code>
            <button type="button" className="primary" onClick={() => void copyCode()}>
              Copy
            </button>
          </div>
          <p className="muted">
            Earn {data.progression.referralPercent}% commission when friends earn.
          </p>
        </article>

        <article className="panel stat-card">
          <h2>Total earned</h2>
          <p className="metric">{formatCoins(data.earnings.totalEarned)}</p>
          <p className="metric-caption">
            from {data.earnings.totalSessions} referral sessions
          </p>
          <p className="muted">{data.profile.referralsCount} friends referred</p>
        </article>
      </section>

      <section className="panel">
        <h2>Referred users</h2>
        {data.referredUsers.length === 0 ? (
          <div className="empty-state compact">
            <p className="muted">No referrals yet. Share your code to get started.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Joined</th>
                  <th>Sessions</th>
                  <th>Earned from user</th>
                </tr>
              </thead>
              <tbody>
                {data.referredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.displayName ?? user.email}</td>
                    <td>{formatDate(user.joinedAt)}</td>
                    <td>{user.sessionsCount}</td>
                    <td>{formatCoins(user.totalEarnedFromUser)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.recentEarnings.length > 0 && (
        <section className="panel">
          <h2>Recent earnings</h2>
          <ul className="simple-list">
            {data.recentEarnings.map((earning) => (
              <li key={earning.id}>
                <strong>{formatCoins(earning.amountEarned)} coins</strong>
                <span className="muted">
                  from {earning.referredUser.displayName ?? earning.referredUser.email}
                </span>
                <time className="muted">{formatDate(earning.createdAt)}</time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

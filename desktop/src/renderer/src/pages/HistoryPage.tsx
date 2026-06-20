import { useEffect, useState } from 'react';
import { api, type SessionHistoryResponse } from '../api/client';
import { formatCoins, formatDate, formatDuration, formatHashrate } from '../utils/format';

export function HistoryPage() {
  const [data, setData] = useState<SessionHistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void api
      .getSessionHistory(page, 15)
      .then(setData)
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load session history',
        );
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Activity</p>
          <h1>Mining history</h1>
        </div>
      </header>

      <section className="panel">
        {loading && <div className="loading-inline">Loading sessions…</div>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && data && data.sessions.length === 0 && (
          <div className="empty-state">
            <h2>No sessions yet</h2>
            <p className="muted">
              Complete your first mining session from the Dashboard to see it here.
            </p>
          </div>
        )}

        {!loading && !error && data && data.sessions.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Hashrate</th>
                    <th>Shares</th>
                    <th>Coins earned</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{formatDate(session.endedAt ?? session.startedAt)}</td>
                      <td>{formatDuration(session.totalSeconds)}</td>
                      <td>{formatHashrate(session.hashrate)}</td>
                      <td>{session.sharesAccepted}</td>
                      <td>{formatCoins(session.coinsEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                type="button"
                className="ghost"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span className="muted">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                type="button"
                className="ghost"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api } from '../api';

function formatHours(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function Dashboard() {
  const [range, setRange] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setData(await api.getDashboard(range));
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const maxProjectSeconds = data?.byProject?.[0]?.totalSeconds || 1;

  return (
    <div>
      <div className="range-toggle" role="group" aria-label="Time range">
        <button
          className={`range-btn ${range === 'today' ? 'active' : ''}`}
          onClick={() => setRange('today')}
          aria-pressed={range === 'today'}
        >
          Today
        </button>
        <button
          className={`range-btn ${range === 'week' ? 'active' : ''}`}
          onClick={() => setRange('week')}
          aria-pressed={range === 'week'}
        >
          This Week
        </button>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {loading && <div className="loading">Loading dashboard…</div>}

      {data && !loading && (
        <>
          {/* ── Summary stats ── */}
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-label">Total Time</div>
              <div className="stat-value" aria-label={`Total time: ${formatHours(data.totalSeconds)}`}>
                {formatHours(data.totalSeconds)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Projects</div>
              <div className="stat-value">{data.byProject.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tasks</div>
              <div className="stat-value">{data.byTask.length}</div>
            </div>
          </div>

          {/* ── By project ── */}
          <div className="card">
            <div className="card-title">By Project</div>
            {data.byProject.length === 0 ? (
              <div className="empty-state">
                No time logged {range === 'today' ? 'today' : 'this week'} yet.
              </div>
            ) : (
              data.byProject.map(p => (
                <div key={p.projectName} className="breakdown-row">
                  <span className="breakdown-name">{p.projectName}</span>
                  <div className="breakdown-track" aria-hidden="true">
                    <div
                      className="breakdown-fill"
                      style={{ width: `${(p.totalSeconds / maxProjectSeconds) * 100}%` }}
                    />
                  </div>
                  <span className="breakdown-duration">{formatHours(p.totalSeconds)}</span>
                </div>
              ))
            )}
          </div>

          {/* ── By task ── */}
          <div className="card">
            <div className="card-title">By Task</div>
            {data.byTask.length === 0 ? (
              <div className="empty-state">
                No time logged {range === 'today' ? 'today' : 'this week'} yet.
              </div>
            ) : (
              <table className="entries-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Type</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byTask.map((t, i) => (
                    <tr key={i}>
                      <td>{t.taskName}</td>
                      <td>{t.projectName}</td>
                      <td><span className={`badge badge-${t.type}`}>{t.type}</span></td>
                      <td>{formatHours(t.totalSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

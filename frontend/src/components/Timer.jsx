import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Timer({ onRunningChange }) {
  const [tasks, setTasks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [running, setRunning] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [t, e, r] = await Promise.all([
        api.getTasks(),
        api.getEntries(),
        api.getRunning(),
      ]);
      setTasks(t);
      setEntries(e);
      setRunning(r);
      onRunningChange?.(r);
      if (r) setElapsed(Math.floor((Date.now() - new Date(r.startedAt)) / 1000));
    } catch {
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [onRunningChange]);

  useEffect(() => { load(); }, [load]);

  // Tick elapsed time while timer is running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(running.startedAt)) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const handleStart = async () => {
    if (!selectedTaskId) return;
    setError('');
    try {
      await api.startTimer(selectedTaskId);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to start timer');
    }
  };

  const handleStop = async () => {
    if (!running) return;
    setError('');
    try {
      await api.stopTimer(running.id);
      setRunning(null);
      setElapsed(0);
      onRunningChange?.(null);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to stop timer');
    }
  };

  // Switch task: start() auto-stops the current entry and opens a new one
  const handleSwitch = async () => {
    if (!selectedTaskId || String(selectedTaskId) === String(running?.taskId)) return;
    await handleStart();
  };

  if (loading) return <div className="loading">Loading timer…</div>;

  const isSameTask = running && String(selectedTaskId) === String(running.taskId);

  return (
    <div>
      {error && <div className="error-banner" role="alert">{error}</div>}

      {/* ── Clock display ── */}
      <div className={`timer-display ${running ? 'timer-active' : ''}`} aria-live="polite">
        <div className="timer-clock" aria-label={`Elapsed time: ${formatDuration(elapsed)}`}>
          {formatDuration(elapsed)}
        </div>
        {running ? (
          <div className="timer-task-label">
            <span className="pulse-dot" aria-hidden="true" />
            <span className="task-name">{running.taskName}</span>
            {running.projectName && (
              <span className="project-name">· {running.projectName}</span>
            )}
          </div>
        ) : (
          <div className="timer-task-label timer-idle">No timer running — select a task below</div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="timer-controls">
        <div>
          <label htmlFor="timer-task-select">Select Task</label>
          <select
            id="timer-task-select"
            className="task-select"
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            aria-label="Select task to track"
            style={{ marginTop: 6 }}
          >
            <option value="">— Choose a task —</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.type}{t.projectName ? ` (${t.projectName})` : ' (No Project)'}
              </option>
            ))}
          </select>
        </div>

        <div className="timer-buttons">
          {!running ? (
            <button
              className="btn btn-success"
              onClick={handleStart}
              disabled={!selectedTaskId}
              aria-label="Start timer"
            >
              Start Timer
            </button>
          ) : (
            <>
              <button className="btn btn-danger" onClick={handleStop} aria-label="Stop timer">
                Stop Timer
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSwitch}
                disabled={!selectedTaskId || isSameTask}
                aria-label="Switch to selected task"
                title="Stops current entry and immediately starts a new one — no gaps"
              >
                Switch Task
              </button>
            </>
          )}
        </div>

        {running && (
          <p className="timer-hint">
            <strong>Switching tasks</strong> stops the current entry and starts the new one immediately — no zero-minute entries are created.
          </p>
        )}

        {tasks.length === 0 && (
          <p className="timer-hint">No tasks yet — go to the <strong>Tasks</strong> tab to create one.</p>
        )}
      </div>

      {/* ── Recent entries ── */}
      <div className="card">
        <div className="card-title">Recent Entries</div>
        {entries.length === 0 ? (
          <div className="empty-state">No time entries yet. Start a timer above.</div>
        ) : (
          <table className="entries-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Start</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 30).map(e => (
                <tr key={e.id} className={!e.stoppedAt ? 'entry-running' : ''}>
                  <td>{e.taskName}</td>
                  <td>{e.projectName || 'No Project'}</td>
                  <td>{formatTime(e.startedAt)}</td>
                  <td>
                    {e.stoppedAt
                      ? formatDuration(e.durationSeconds)
                      : <span className="running-badge">Running</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

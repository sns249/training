import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const TASK_TYPES = ['module', 'prep', 'delivery', 'follow-up'];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'module', projectId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([api.getTasks(), api.getProjects()]);
      setTasks(t);
      setProjects(p);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createTask({
        name: form.name.trim(),
        type: form.type,
        projectId: form.projectId || null,
      });
      setForm(f => ({ ...f, name: '' }));
      load();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, taskName) => {
    if (!confirm(`Delete "${taskName}"? All time entries for this task will also be deleted.`)) return;
    setError('');
    try {
      await api.deleteTask(id);
      load();
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    }
  };

  if (loading) return <div className="loading">Loading tasks…</div>;

  return (
    <div>
      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="card">
        <div className="card-title">New Task</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ flex: 3 }}>
              <label htmlFor="task-name">Task Name</label>
              <input
                id="task-name"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Module 1 Delivery"
                maxLength={100}
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="task-type">Type</label>
              <select
                id="task-type"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                aria-label="Task type"
              >
                {TASK_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-project">Project</label>
              <select
                id="task-project"
                value={form.projectId}
                onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                aria-label="Assign to project"
              >
                <option value="">No Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting || !form.name.trim()}>
            {submitting ? 'Adding…' : 'Add Task'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">Tasks ({tasks.length})</div>
        {tasks.length === 0 ? (
          <div className="empty-state">No tasks yet. Create one above to start tracking time.</div>
        ) : (
          <div className="item-list">
            {tasks.map(t => (
              <div key={t.id} className="item-row">
                <div className="item-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="item-name">{t.name}</span>
                    <span className={`badge badge-${t.type}`}>{t.type}</span>
                  </div>
                  <span className="item-meta">{t.projectName || 'No Project'}</span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDelete(t.id, t.name)}
                  aria-label={`Delete task ${t.name}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setProjects(await api.getProjects());
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createProject(name.trim());
      setName('');
      load();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, projectName) => {
    if (!confirm(`Delete "${projectName}"? Tasks will be moved to No Project.`)) return;
    setError('');
    try {
      await api.deleteProject(id);
      load();
    } catch (err) {
      setError(err.message || 'Failed to delete project');
    }
  };

  if (loading) return <div className="loading">Loading projects…</div>;

  return (
    <div>
      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="card">
        <div className="card-title">New Project</div>
        <form onSubmit={handleSubmit} className="form-row">
          <div className="form-group" style={{ flex: 3 }}>
            <label htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. React Fundamentals"
              maxLength={100}
              aria-required="true"
            />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label>&nbsp;</label>
            <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
              {submitting ? 'Adding…' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">Projects ({projects.length})</div>
        {projects.length === 0 ? (
          <div className="empty-state">No projects yet. Create one above to get started.</div>
        ) : (
          <div className="item-list">
            {projects.map(p => (
              <div key={p.id} className="item-row">
                <div className="item-info">
                  <span className="item-name">{p.name}</span>
                  <span className="item-meta">Created {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDelete(p.id, p.name)}
                  aria-label={`Delete project ${p.name}`}
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

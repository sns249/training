const BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Projects
  getProjects: () => request('/projects'),
  createProject: (name) => request('/projects', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: () => request('/tasks'),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Entries
  getEntries: () => request('/entries'),
  getRunning: () => request('/entries/running'),
  startTimer: (taskId) => request('/entries/start', { method: 'POST', body: JSON.stringify({ taskId }) }),
  stopTimer: (entryId) => request('/entries/stop', { method: 'POST', body: JSON.stringify({ entryId }) }),

  // Dashboard
  getDashboard: (range) => request(`/dashboard?range=${range}`),
};

/**
 * Pure-JavaScript file-backed store.
 * Data is kept in memory and flushed to data/tracker.json on every write.
 * No native compilation required.
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'tracker.json');

// ── In-memory state ───────────────────────────────────────────────────────────
let _data = {
  projects: [],
  tasks: [],
  entries: [],
  _seq: { projects: 0, tasks: 0, entries: 0 },
};

if (fs.existsSync(dbPath)) {
  try {
    _data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch (e) {
    console.warn('Could not parse tracker.json — starting fresh.', e.message);
  }
}

function save() {
  fs.writeFileSync(dbPath, JSON.stringify(_data, null, 2));
}

function nextId(table) {
  _data._seq[table] = (_data._seq[table] || 0) + 1;
  return String(_data._seq[table]); // string IDs for consistency with Firestore
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function withProject(task) {
  const p = _data.projects.find(p => p.id === task.projectId);
  return { ...task, projectName: p ? p.name : null };
}

function withTaskAndProject(entry) {
  const t = _data.tasks.find(t => t.id === entry.taskId);
  const p = t ? _data.projects.find(p => p.id === t.projectId) : null;
  return { ...entry, taskName: t ? t.name : 'Unknown', projectName: p ? p.name : null };
}

// ── Public API ────────────────────────────────────────────────────────────────
const db = {
  projects: {
    all() {
      return [..._data.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    get(id) {
      return _data.projects.find(p => p.id === id) || null;
    },
    insert(name) {
      const p = { id: nextId('projects'), name, createdAt: new Date().toISOString() };
      _data.projects.push(p);
      save();
      return p;
    },
    delete(id) {
      _data.tasks.forEach(t => { if (t.projectId === id) t.projectId = null; });
      _data.projects = _data.projects.filter(p => p.id !== id);
      save();
    },
  },

  tasks: {
    all() {
      return [..._data.tasks]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(withProject);
    },
    get(id) {
      const t = _data.tasks.find(t => t.id === id);
      return t ? withProject(t) : null;
    },
    insert(name, type, projectId) {
      const t = {
        id: nextId('tasks'),
        projectId: projectId || null,
        name,
        type,
        createdAt: new Date().toISOString(),
      };
      _data.tasks.push(t);
      save();
      return withProject(t);
    },
    delete(id) {
      _data.tasks = _data.tasks.filter(t => t.id !== id);
      _data.entries = _data.entries.filter(e => e.taskId !== id);
      save();
    },
  },

  entries: {
    all() {
      return [..._data.entries]
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, 100)
        .map(withTaskAndProject);
    },
    get(id) {
      return _data.entries.find(e => e.id === id) || null;
    },
    getRunning() {
      const e = _data.entries.find(e => !e.stoppedAt);
      return e ? withTaskAndProject(e) : null;
    },
    insert(taskId, startedAt) {
      const e = { id: nextId('entries'), taskId, startedAt, stoppedAt: null, durationSeconds: null };
      _data.entries.push(e);
      save();
      return e;
    },
    stop(id, now, durationSeconds) {
      const e = _data.entries.find(e => e.id === id);
      if (e) { e.stoppedAt = now; e.durationSeconds = durationSeconds; save(); }
      return e;
    },
    deleteById(id) {
      _data.entries = _data.entries.filter(e => e.id !== id);
      save();
    },
    dashboard(startISO) {
      const completed = _data.entries.filter(e => e.stoppedAt && e.startedAt >= startISO);

      const taskMap = {};
      const projectMap = {};
      let totalSeconds = 0;

      for (const e of completed) {
        const t = _data.tasks.find(t => t.id === e.taskId);
        const p = t ? _data.projects.find(p => p.id === t.projectId) : null;
        const secs = e.durationSeconds || 0;
        totalSeconds += secs;

        if (t) {
          const tk = e.taskId;
          if (!taskMap[tk]) taskMap[tk] = { taskName: t.name, type: t.type, projectName: p ? p.name : 'No Project', totalSeconds: 0 };
          taskMap[tk].totalSeconds += secs;
        }

        const pk = t?.projectId ?? 'none';
        if (!projectMap[pk]) projectMap[pk] = { projectName: p ? p.name : 'No Project', totalSeconds: 0 };
        projectMap[pk].totalSeconds += secs;
      }

      return {
        totalSeconds,
        byTask: Object.values(taskMap).sort((a, b) => b.totalSeconds - a.totalSeconds),
        byProject: Object.values(projectMap).sort((a, b) => b.totalSeconds - a.totalSeconds),
      };
    },
  },
};

module.exports = db;

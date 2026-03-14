const admin = require('firebase-admin');

admin.initializeApp();
const firestore = admin.firestore();

// ── helpers ───────────────────────────────────────────────────────────────────

async function fetchProjectName(projectId) {
  if (!projectId) return null;
  const doc = await firestore.collection('projects').doc(projectId).get();
  return doc.exists ? doc.data().name : null;
}

async function fetchTaskInfo(taskId) {
  if (!taskId) return { taskName: 'Unknown', projectName: null };
  const doc = await firestore.collection('tasks').doc(taskId).get();
  if (!doc.exists) return { taskName: 'Unknown', projectName: null };
  const d = doc.data();
  return { taskName: d.name, projectName: await fetchProjectName(d.projectId) };
}

// Batch-fetch project names for a list of projectIds
async function batchFetchProjects(ids) {
  const map = {};
  const unique = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 10) {
    const slice = unique.slice(i, i + 10);
    const snap = await firestore
      .collection('projects')
      .where(admin.firestore.FieldPath.documentId(), 'in', slice)
      .get();
    snap.docs.forEach(d => { map[d.id] = d.data().name; });
  }
  return map;
}

// Batch-fetch task data for a list of taskIds
async function batchFetchTasks(ids) {
  const map = {};
  const unique = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 10) {
    const slice = unique.slice(i, i + 10);
    const snap = await firestore
      .collection('tasks')
      .where(admin.firestore.FieldPath.documentId(), 'in', slice)
      .get();
    snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
  }
  return map;
}

// ── Projects ──────────────────────────────────────────────────────────────────
const projects = {
  async all() {
    const snap = await firestore.collection('projects').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async get(id) {
    const doc = await firestore.collection('projects').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async insert(name) {
    const data = { name, createdAt: new Date().toISOString() };
    const ref = await firestore.collection('projects').add(data);
    return { id: ref.id, ...data };
  },

  async delete(id) {
    const batch = firestore.batch();
    const tasksSnap = await firestore.collection('tasks').where('projectId', '==', id).get();
    tasksSnap.docs.forEach(d => batch.update(d.ref, { projectId: null }));
    batch.delete(firestore.collection('projects').doc(id));
    await batch.commit();
  },
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
const tasks = {
  async all() {
    const snap = await firestore.collection('tasks').orderBy('createdAt', 'desc').get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const projectMap = await batchFetchProjects(docs.map(t => t.projectId));
    return docs.map(t => ({ ...t, projectName: t.projectId ? (projectMap[t.projectId] || null) : null }));
  },

  async get(id) {
    const doc = await firestore.collection('tasks').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return { id: doc.id, ...data, projectName: await fetchProjectName(data.projectId) };
  },

  async insert(name, type, projectId) {
    const data = { name, type, projectId: projectId || null, createdAt: new Date().toISOString() };
    const ref = await firestore.collection('tasks').add(data);
    return { id: ref.id, ...data, projectName: await fetchProjectName(projectId) };
  },

  async delete(id) {
    const batch = firestore.batch();
    const entriesSnap = await firestore.collection('entries').where('taskId', '==', id).get();
    entriesSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(firestore.collection('tasks').doc(id));
    await batch.commit();
  },
};

// ── Entries ───────────────────────────────────────────────────────────────────
const entries = {
  async all() {
    const snap = await firestore.collection('entries').orderBy('startedAt', 'desc').limit(100).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const taskMap = await batchFetchTasks(docs.map(e => e.taskId));
    const projectMap = await batchFetchProjects(Object.values(taskMap).map(t => t.projectId));
    return docs.map(e => {
      const t = taskMap[e.taskId];
      return {
        ...e,
        taskName: t ? t.name : 'Unknown',
        projectName: t?.projectId ? (projectMap[t.projectId] || null) : null,
      };
    });
  },

  async get(id) {
    const doc = await firestore.collection('entries').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async getRunning() {
    const snap = await firestore.collection('entries').where('running', '==', true).limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    const e = { id: d.id, ...d.data() };
    const { taskName, projectName } = await fetchTaskInfo(e.taskId);
    return { ...e, taskName, projectName };
  },

  async insert(taskId, startedAt) {
    const data = { taskId, startedAt, stoppedAt: null, durationSeconds: null, running: true };
    const ref = await firestore.collection('entries').add(data);
    return { id: ref.id, ...data };
  },

  async stop(id, now, durationSeconds) {
    await firestore.collection('entries').doc(id).update({ stoppedAt: now, durationSeconds, running: false });
    const doc = await firestore.collection('entries').doc(id).get();
    return { id: doc.id, ...doc.data() };
  },

  async deleteById(id) {
    await firestore.collection('entries').doc(id).delete();
  },

  async dashboard(startISO) {
    // Fetch entries from startISO; filter completed in memory to avoid composite index
    const snap = await firestore.collection('entries')
      .where('startedAt', '>=', startISO)
      .orderBy('startedAt', 'desc')
      .get();

    const completed = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => !e.running && e.stoppedAt);

    const taskMap = await batchFetchTasks(completed.map(e => e.taskId));
    const projectMap = await batchFetchProjects(Object.values(taskMap).map(t => t.projectId));

    let totalSeconds = 0;
    const taskAgg = {};
    const projectAgg = {};

    for (const e of completed) {
      const secs = e.durationSeconds || 0;
      totalSeconds += secs;
      const t = taskMap[e.taskId];
      if (!t) continue;
      const pName = t.projectId ? (projectMap[t.projectId] || 'No Project') : 'No Project';
      const pk = t.projectId || 'none';

      if (!taskAgg[e.taskId]) taskAgg[e.taskId] = { taskName: t.name, type: t.type, projectName: pName, totalSeconds: 0 };
      taskAgg[e.taskId].totalSeconds += secs;

      if (!projectAgg[pk]) projectAgg[pk] = { projectName: pName, totalSeconds: 0 };
      projectAgg[pk].totalSeconds += secs;
    }

    return {
      totalSeconds,
      byTask: Object.values(taskAgg).sort((a, b) => b.totalSeconds - a.totalSeconds),
      byProject: Object.values(projectAgg).sort((a, b) => b.totalSeconds - a.totalSeconds),
    };
  },
};

module.exports = { projects, tasks, entries };

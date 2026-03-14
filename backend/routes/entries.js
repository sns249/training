const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (_req, res) => {
  res.json(db.entries.all());
});

router.get('/running', (_req, res) => {
  res.json(db.entries.getRunning());
});

// Start a timer — auto-stops any currently running entry
router.post('/start', (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  const task = db.tasks.get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const now = new Date().toISOString();

  // Stop any running entry — skip zero-second entries
  const running = db.entries.getRunning();
  if (running) {
    const duration = Math.floor((new Date(now) - new Date(running.startedAt)) / 1000);
    if (duration < 1) {
      db.entries.deleteById(running.id);
    } else {
      db.entries.stop(running.id, now, duration);
    }
  }

  res.status(201).json(db.entries.insert(taskId, now));
});

// Stop a running timer
router.post('/stop', (req, res) => {
  const { entryId } = req.body;
  if (!entryId) return res.status(400).json({ error: 'entryId is required' });

  const entry = db.entries.get(entryId);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  if (entry.stoppedAt) return res.status(400).json({ error: 'Entry already stopped' });

  const now = new Date().toISOString();
  const duration = Math.floor((new Date(now) - new Date(entry.startedAt)) / 1000);

  if (duration < 1) {
    db.entries.deleteById(entryId);
    return res.json({ deleted: true });
  }

  res.json(db.entries.stop(entryId, now, duration));
});

module.exports = router;

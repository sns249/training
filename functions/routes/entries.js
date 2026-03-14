const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (_req, res) => {
  try { res.json(await db.entries.all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/running', async (_req, res) => {
  try { res.json(await db.entries.getRunning()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Start timer — auto-stops any running entry
router.post('/start', async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });
  try {
    const task = await db.tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const now = new Date().toISOString();

    const running = await db.entries.getRunning();
    if (running) {
      const duration = Math.floor((new Date(now) - new Date(running.startedAt)) / 1000);
      if (duration < 1) {
        await db.entries.deleteById(running.id);
      } else {
        await db.entries.stop(running.id, now, duration);
      }
    }

    res.status(201).json(await db.entries.insert(taskId, now));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stop running timer
router.post('/stop', async (req, res) => {
  const { entryId } = req.body;
  if (!entryId) return res.status(400).json({ error: 'entryId is required' });
  try {
    const entry = await db.entries.get(entryId);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    if (entry.stoppedAt) return res.status(400).json({ error: 'Entry already stopped' });

    const now = new Date().toISOString();
    const duration = Math.floor((new Date(now) - new Date(entry.startedAt)) / 1000);

    if (duration < 1) {
      await db.entries.deleteById(entryId);
      return res.json({ deleted: true });
    }

    res.json(await db.entries.stop(entryId, now, duration));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_TYPES = ['module', 'prep', 'delivery', 'follow-up'];

router.get('/', async (_req, res) => {
  try { res.json(await db.tasks.all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { name, type, projectId } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });
  try { res.status(201).json(await db.tasks.insert(name.trim(), type, projectId || null)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.tasks.delete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

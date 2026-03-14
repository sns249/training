const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_TYPES = ['module', 'prep', 'delivery', 'follow-up'];

router.get('/', (_req, res) => {
  res.json(db.tasks.all());
});

router.post('/', (req, res) => {
  const { name, type, projectId } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });
  res.status(201).json(db.tasks.insert(name.trim(), type, projectId || null));
});

router.delete('/:id', (req, res) => {
  db.tasks.delete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

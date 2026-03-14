const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (_req, res) => {
  res.json(db.projects.all());
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  res.status(201).json(db.projects.insert(name.trim()));
});

router.delete('/:id', (req, res) => {
  db.projects.delete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const range = req.query.range === 'week' ? 'week' : 'today';

  const now = new Date();
  let startDate;

  if (range === 'week') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday as week start
    startDate = new Date(now);
    startDate.setDate(now.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  }

  const { totalSeconds, byTask, byProject } = db.entries.dashboard(startDate.toISOString());
  res.json({ range, totalSeconds, byTask, byProject });
});

module.exports = router;

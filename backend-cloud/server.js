const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: [
    'https://learning-74e8e.web.app',
    'https://learning-74e8e.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3001',
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

app.use('/api/projects',  require('./routes/projects'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/entries',   require('./routes/entries'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Cloud backend running on port ${PORT}`));

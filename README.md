# Training Batch Time Tracker

A local web app for tracking training session time across projects and tasks.

## Features

- **Projects** — create and manage client/training projects
- **Tasks** — categorise work as `module`, `prep`, `delivery`, or `follow-up`
- **Timer** — start, stop, and switch tasks (auto-stops the current entry; no zero-minute gaps)
- **Dashboard** — today and this-week totals broken down by project and task
- **Persistent storage** — JSON file stored locally at `backend/data/tracker.json` (no native compilation needed)

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18 or higher |
| npm | 8 or higher |

No native compilation required — the backend uses a pure-JavaScript JSON file store.

## Setup & Run

### Option A — Run both together (recommended)

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start backend + frontend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Option B — Run separately

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm install
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm install
npm run dev
```

## Project Structure

```
trainingtimetracker/
├── backend/                Express + SQLite API (port 3001)
│   ├── db.js               In-memory store with JSON file persistence
│   ├── server.js           Express entry point
│   ├── data/               tracker.json (auto-created on first run)
│   └── routes/
│       ├── projects.js
│       ├── tasks.js
│       ├── entries.js
│       └── dashboard.js
├── frontend/               Vite + React (port 5173)
│   └── src/
│       ├── api.js          API client
│       ├── App.jsx         Root layout + navigation
│       └── components/
│           ├── Projects.jsx
│           ├── Tasks.jsx
│           ├── Timer.jsx
│           └── Dashboard.jsx
└── README.md
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create a project `{ name }` |
| DELETE | /api/projects/:id | Delete project (tasks moved to No Project) |
| GET | /api/tasks | List all tasks |
| POST | /api/tasks | Create a task `{ name, type, projectId? }` |
| DELETE | /api/tasks/:id | Delete task + all entries |
| POST | /api/entries/start | Start timer `{ taskId }` — auto-stops running |
| POST | /api/entries/stop | Stop timer `{ entryId }` |
| GET | /api/entries/running | Currently running entry |
| GET | /api/dashboard | Totals `?range=today\|week` |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3001 already in use | Change `PORT` in `backend/server.js` or kill the occupying process |
| Frontend shows "Failed to load data" | Ensure the backend is running on port 3001 before starting the frontend |
| Timer keeps counting after page refresh | The running entry is persisted in `tracker.json` — refresh the Timer tab to resync |
| Want to reset all data | Delete `backend/data/tracker.json` and restart the backend |

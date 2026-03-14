# Copilot Instructions — Training Batch Time Tracker

## Stack
- **Backend:** Node.js, Express, better-sqlite3 (synchronous API), port 3001
- **Frontend:** Vite, React 18 (hooks only, no class components), port 5173
- **Proxy:** Vite proxies `/api` to `http://localhost:3001` — use relative paths in frontend

## Code quality
- Prefer simple, readable code over cleverness.
- Add loading, empty, and error states for every screen.
- Add basic accessibility: `htmlFor`/`id` pairs on all inputs, `aria-label` on icon-only buttons, `role="alert"` on error banners.
- No inline styles — use the global CSS classes in `src/index.css`.

## Architecture
- Keep UI components small; move reusable logic to custom hooks or service modules.
- Centralise all database access in `backend/db.js` — do not write SQL inline in route handlers.
- Each route file in `backend/routes/` handles one resource only.
- The frontend `api.js` is the single point of contact with the backend — never `fetch` directly from components.

## Naming conventions
- React components: PascalCase files and function names.
- Backend route files: lowercase, matching the resource (e.g. `tasks.js`).
- CSS class names: kebab-case.
- Database columns: camelCase.

## Validation
- If you change business logic (timer start/stop, duration calculation), add or update tests.
- Before saying "done", run the app (`npm run dev` from root) and confirm no console errors in browser or terminal.
- Do not add new `npm` packages without a clear reason — prefer using what is already installed.

## Adding new commands
Whenever you introduce a new `npm` script, add a row to the README table under "Setup & Run".

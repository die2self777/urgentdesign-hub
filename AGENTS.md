# Base44 Setup Notes

## What this is
A full-stack EdTech hub — student login, dynamic app directory with SSO outbound routing, public activity receiver API, PQP submission system, and an omniscient admin dashboard with automated changelog tracking. Built on Node.js + Express + SQLite.

## How it runs
Node.js + Express server via `docker-compose.base44.yml` on host port 3000. Uses `Dockerfile.dev` (node:22-slim + build tools for better-sqlite3). Source is bind-mounted; `nodemon` watches server-side `.js`/`.json` files and restarts on change. Frontend static files in `public/` are served by Express.

## Stack
- **Backend:** Node.js + Express (ESM, `"type": "module"`)
- **Database:** SQLite via `better-sqlite3` (file at `data/hub.db`, auto-created)
- **Frontend:** Vanilla HTML/CSS/JS (no framework), Tabler icons, Inter + JetBrains Mono fonts

## Database schema
Tables: `users`, `apps`, `student_activity`, `pqp_submissions`, `pqp_feedback`, `changelog`. Schema is auto-created on startup in `db.js`. Apps are seeded from `apps.json` on first boot.

## Secrets (required at boot)
- `ADMIN_PASSWORD` — password for the `/admin` dashboard login
- `GEMINI_API_KEY` — Google Gemini API key for `services/geminiService.js`
Both have generated development placeholders; user replaces with real values via the dashboard.

## API endpoints
- `POST /api/auth/login` — student login (class + name, auto-creates user, sets session cookie)
- `GET /api/auth/session` — check student session
- `POST /api/auth/logout` — student logout
- `POST /api/auth/admin-login` — admin login (password)
- `GET /api/auth/admin-session` — check admin session
- `POST /api/auth/admin-logout` — admin logout
- `GET /api/apps` — list active apps (requires student session)
- `GET /api/apps/all` — list all apps (admin only)
- `POST/PUT/PATCH/DELETE /api/apps[/:id]` — app CRUD (admin only, auto-logs to changelog)
- `POST /api/log-activity` — receive activity from external apps (permissive CORS: `*`)
- `POST /api/pqp/submit` — submit writing (permissive CORS)
- `POST /api/pqp/feedback` — submit PQP feedback (permissive CORS)
- `GET /api/admin/users|activity|pqp|changelog` — admin data endpoints (admin only)

## Verify
- `curl -sf http://localhost:3000/` returns the login page
- `curl -sf http://localhost:3000/admin` returns the admin login page
- Login as student → `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"class_name":"P5","student_name":"Test"}'`
- Admin login → POST to `/api/auth/admin-login` with the `ADMIN_PASSWORD` env value

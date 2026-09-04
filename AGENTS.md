# Base44 Setup Notes

## What this is
A static single-page site (`index.html` + `apps.json`) — an EdTech micro-app directory. No build step, no backend, no dependencies.

## How it runs
Served by `nginx:alpine` via `docker-compose.base44.yml` on host port 3000. The repo root is bind-mounted read-only into nginx's html dir, so edits to `index.html` / `apps.json` appear on reload.

## No secrets required
The site is purely static. `apps.json` links out to external hosted apps but needs no credentials itself.

## Verify
`curl -sf http://localhost:3000/` returns the HTML page; `curl -sf http://localhost:3000/apps.json` returns the JSON.

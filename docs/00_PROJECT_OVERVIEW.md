# Project Overview (Production Audit)

Last updated: 2026-03-16  
Audit type: read-only, based on real server state and real repositories.

## System At A Glance

- Server public IP: `85.117.235.93`
- OS: Ubuntu 24.04.4 LTS
- Main stack: Nginx + PHP-FPM + Laravel + Redis + MariaDB + Supervisor + React/Vite static build
- Backend project (Laravel): `/var/www/online-parser.siteaacess.store`
- Frontend project (React/Vite): `/var/www/siteaacess.store`

## Domains And Roles

- `https://siteaacess.store` (and `www.siteaacess.store`) -> main frontend SPA (`/var/www/siteaacess.store/dist`)
- `https://online-parser.siteaacess.store` -> Laravel backend API + parser admin backend (`/var/www/online-parser.siteaacess.store/public`)
- `http://api.siteaacess.store` -> placeholder API vhost (HTTP only, static + `/api/` stub)
- `http://photos.siteaacess.store` -> static photos host

## High-Level Architecture

```text
User Browser
   |
   v
Frontend SPA (siteaacess.store, React+Vite, static dist via Nginx)
   |
   | HTTPS fetch (VITE_API_URL)
   v
Backend API (online-parser.siteaacess.store, Laravel)
   |
   +--> MariaDB (sadavod_parser)
   +--> Redis (cache/queue/session)
   +--> Supervisor queue workers (parser/photos/default)
   +--> Reverb websocket process (artisan reverb:start)
   |
   +--> External donor: sadovodbaza.ru (via parser HTTP client, optional proxy)
```

## Data/Control Planes

- Data plane:
  - Public catalog APIs under `/api/v1/public/*` (menu, products, sellers, search)
  - Admin APIs under `/api/v1/*` guarded by JWT middleware
- Control/ops plane:
  - Health endpoints: `/api/v1/up`, `/api/v1/system/health`, `/api/v1/parser/health`
  - Parser operations: `/api/v1/parser/*` (start/stop/status/diagnostics/settings)
  - Scheduled watchdog/recovery commands via cron + Laravel scheduler

## Repositories (Production Remotes)

- Backend remote: `git@github.com:letoceiling-coder/cheepy-backend.git`
- Frontend remote: `git@github.com:letoceiling-coder/cheepy-frontend.git`
- Deployed branch for both: `main`

## Current Operational Model

- Deployment is primarily script-driven on server (`/var/www/deploy.sh`) and also wired to GitHub Actions workflows.
- Queue workers and websocket service are managed by Supervisor.
- Frontend is static and served by Nginx; backend is PHP-FPM Laravel app.

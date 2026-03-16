# Deployment Flow (Observed in Production)

This document describes the real deployment mechanisms currently present.

## Deployment Modes

Two active modes exist in parallel:

- GitHub Actions (per repo)
- Server-side orchestrator script (`/var/www/deploy.sh`)

## A) GitHub Actions Deploy

## Backend (`cheepy-backend`)

Workflow: `.github/workflows/deploy-backend.yml`

Trigger:

- push to `main`
- manual `workflow_dispatch`

Server actions:

1. `cd /var/www/online-parser.siteaacess.store`
2. `git fetch origin`
3. `git reset --hard origin/main`
4. `composer install --no-dev --optimize-autoloader`
5. `php artisan migrate --force`
6. `php artisan optimize:clear`
7. `php artisan config:cache`
8. `php artisan queue:restart`
9. permission fix (`storage`, `bootstrap/cache`)
10. `supervisorctl restart all`
11. `systemctl reload nginx`
12. health check (`/api/v1/up`)

## Frontend (`cheepy-frontend`)

Workflow: `.github/workflows/deploy-frontend.yml`

Trigger:

- push to `main` with path filter (src/public/package/vite/scripts)
- manual `workflow_dispatch`

Server actions:

1. copy `scripts/deploy.sh` and `scripts/rollback.sh` to `/var/www/`
2. run `bash /var/www/deploy.sh frontend`

## B) Server Orchestrator Deploy

Main script on server: `/var/www/deploy.sh`

Behavior:

- Supports partial deploy by `$PART` (`backend`, `frontend`, `all`)
- Backend:
  - reset to `origin/main`
  - validate/generate `JWT_SECRET` if missing/short
  - install deps, migrate, clear/refresh cache
  - `php artisan queue:restart`
- Frontend:
  - backup current `dist` into `dist.backup.<timestamp>`
  - reset repo, install deps, run build
  - verify `dist/index.html`, rollback backup on failure
- Services:
  - `supervisorctl restart all` (for all/backend)
  - `systemctl reload nginx`
- Post-check:
  - checks frontend URL + backend `/api/v1/up`

## C) Backend Internal Deploy Script (Repo)

File: `/var/www/online-parser.siteaacess.store/scripts/deploy.sh`

Sequence:

1. `php artisan system:preflight` (hard gate)
2. `config:clear`, `route:clear`, `cache:clear`
3. `php artisan migrate --force`
4. `config:cache`, `route:cache`
5. `php artisan queue:restart`

Note: this script exists in backend repo, but the top-level `/var/www/deploy.sh` is the script currently used by frontend workflow and manual operations.

## Rollback

Server script: `/var/www/rollback.sh`

- Frontend rollback: restore latest `dist.backup.*`, reload nginx
- Backend rollback: `git reset --hard HEAD~1`, reinstall deps, partial rollback step, queue restart, supervisor restart

## Final deployment architecture (production)

**Frontend (siteaacess.store):**

| Item | Value |
|------|--------|
| Project path | `/var/www/siteaacess.store` |
| Build output (frontend) | `/var/www/siteaacess.store/dist` |
| Nginx root | `/var/www/siteaacess.store/dist` |
| **Recommended deploy** | `npm run build` then `npm run deploy:frontend` (local build + upload to server dist) |
| Server-side deploy | `bash /var/www/deploy.sh frontend` (git pull + npm run build on server) |

**Local build + upload (recommended):** `scripts/deploy-frontend-upload.cjs` packs local `dist/`, uploads to server `/var/www/siteaacess.store/dist`, reloads nginx. Ensures the exact build you produced is what runs (no cache/old JS).

Nginx must use `root /var/www/siteaacess.store/dist`. All frontend routes (/, /person, /account, /cart, etc.) are public; only `/admin/*` requires authentication (AdminAuthGuard → `/admin/login`).

**Backend (online-parser.siteaacess.store):** `/var/www/online-parser.siteaacess.store`. Workers managed by supervisor. Deploy: `bash /var/www/deploy.sh backend` or `all`.

## Deployment Ownership / Triggering

- Automated on push via GitHub Actions.
- Also manually executable by server SSH (`root`) via `/var/www/deploy.sh [frontend|backend|all]`.
- Script accepts first argument: `PART="${1:-all}"` (e.g. `deploy.sh frontend`).

## Production Risks To Track

- `git reset --hard origin/main` in production scripts drops tracked local hotfixes if not committed.
- Deployment runs as `root`.
- Frontend and backend deployment logic is split across multiple scripts, which can diverge over time.

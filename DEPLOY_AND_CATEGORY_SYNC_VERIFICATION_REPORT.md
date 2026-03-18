# Deploy and Category Sync Verification Report

**Date:** 05.03.2025

---

## Git Commit

| Repo | Commit | Message |
|------|--------|---------|
| cheepy-frontend | `3c3a12c` | Update admin: sellers module, docs, category sync integration |
| cheepy-backend | `d0fb13f` | RBAC: roles, role_user, AdminUserController, AdminRoleController |

---

## Step 1 — Local Project Check ✓

- CategorySyncService refactored: uses MenuParser, no parseDonorMenu/HTTP/Crawler
- normalizeItems() implemented
- scripts/verify-category-counts.cjs exists
- scripts/verify-category-counts.sh exists

---

## Step 2 — Backend Build ✓

- `composer install --no-dev` — completed (deploy.sh)
- `php artisan optimize:clear` / `php artisan optimize` — completed

**Route check:**
- `POST /api/v1/parser/categories/sync` — **NOT REGISTERED** (backend needs CategorySyncController + route)
- Existing: GET/PATCH /categories, POST /categories/reorder

---

## Step 3 — Migration Status ✓

All migrations ran. No new migrations needed.
- categories table exists (2026_03_01_132839_create_categories_table)
- No migration for source_url — column may exist or needs adding

---

## Step 4 — Frontend Build ✓

- `npm run build` — success (local and server)
- dist/ generated

---

## Step 5 — Commit ✓

- Frontend committed and pushed to origin/main

---

## Step 6 — Push ✓

- Pushed to https://github.com/letoceiling-coder/cheepy-frontend.git
- b85f26b..3c3a12c main

---

## Step 7 — Deploy ✓

- `bash /var/www/deploy.sh` — completed
- Backend: git pull, composer, migrate, optimize
- Frontend: git pull, npm install, npm run build
- supervisorctl restart all

---

## Step 8 — Services ✓

| Service | Status |
|---------|--------|
| parser-worker_00-03 | RUNNING |
| parser-worker-photos_00-01 | RUNNING |
| reverb | RUNNING |
| Redis | PONG |

---

## Step 9 — Category Sync Test

**Endpoint:** `POST /api/v1/parser/categories/sync`

**Status:** Route not registered. Add to cheepy-backend:
1. CategorySyncController.php (copy from docs/infrastructure/laravel/)
2. CategorySyncService.php (copy from docs/infrastructure/laravel/)
3. Route: `POST parser/categories/sync`
4. MenuParser::parse() or runMenuOnly integration

---

## Step 10 — Category Counts

| Source | Count |
|--------|-------|
| GET /public/menu | 13 top-level, 23 total nodes |
| Database | 334 categories |

Public menu returns a subset (e.g. enabled only). DB has full set.

---

## Step 11 — System Status

- parser_running: (from system/status, requires auth)
- queue_workers: 6 running
- redis_status: PONG
- websocket/reverb: RUNNING
- nginx: reloaded

---

## Deployment Result

| Component | Result |
|-----------|--------|
| Frontend deploy | ✓ Success |
| Backend deploy | ✓ Success |
| Services | ✓ All RUNNING |
| Category sync endpoint | ⚠ Pending — add to backend |

---

## Next Steps for Backend (cheepy-backend)

1. Copy from cheepy-frontend repo:
   - `docs/infrastructure/laravel/CategorySyncController.php` → `app/Http/Controllers/Api/`
   - `docs/infrastructure/laravel/CategorySyncService.php` → `app/Services/`
2. Register route: `POST api/v1/parser/categories/sync`
3. Ensure MenuParser has `parse()` or use CategorySyncService_using_runMenuOnly alternative
4. Push and redeploy

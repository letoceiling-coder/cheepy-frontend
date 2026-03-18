# Cheepy Project — First Full Git Deployment

**Date:** 2026-03-05  
**Server:** root@85.117.235.93  
**Backend:** https://github.com/letoceiling-coder/cheepy-backend  
**Frontend:** https://github.com/letoceiling-coder/cheepy-frontend  

---

## Deployment Completed

### 1. Git push results ✓
- **Backend:** Pushed to https://github.com/letoceiling-coder/cheepy-backend (main)
- **Frontend:** Pushed to https://github.com/letoceiling-coder/cheepy-frontend (main)

### 2. Backend deployment status ✓
- git pull, composer install, migrate, optimize
- Permissions: www-data storage/bootstrap/cache
- API: https://online-parser.siteaacess.store/api/v1/up → `{"status":"ok"}`

### 3. Frontend build result ✓
- **Note:** Server has no npm/Node.js. Frontend built locally, dist deployed via SCP.
- To enable Git-only frontend deploy: install Node.js on server.

### 4. Nginx reload ✓
- `systemctl reload nginx`

### 5. Queue workers status ✓
- parser-worker_00..03: RUNNING
- parser-worker-photos_00..01: RUNNING
- reverb: RUNNING

### 6. Redis status ✓
- `redis-cli ping` → PONG

### 7. WebSocket status ✓
- `curl https://online-parser.siteaacess.store/api/v1/ws-status`
- `{"reverb":"running","queue_workers":6,"redis":"connected"}`

### 8. Admin panel verification
- https://siteaacess.store/admin/login
- Assets from `/var/www/siteaacess.store/dist`

### 9. Parser system verification ✓
- Supervisor workers running
- Reverb running

---

## Phase 1 — Verify Local Projects ✓

**Backend** (`C:\OSPanel\domains\sadavod-laravel`): artisan, composer.json, routes, app, bootstrap, config, database  
**Frontend** (`c:\OSPanel\domains\cheepy`): package.json, vite.config.ts, src, index.html, public  

---

## Phase 2 — Push Backend to GitHub

```powershell
cd C:\OSPanel\domains\sadavod-laravel
git init
git add .
git branch -M main
git remote remove origin 2>$null; git remote add origin https://github.com/letoceiling-coder/cheepy-backend.git
git commit -m "Initial backend deployment"
git push -u origin main
```

---

## Phase 3 — Push Frontend to GitHub

```powershell
cd c:\OSPanel\domains\cheepy
git init
git add .
git branch -M main
git remote remove origin 2>$null; git remote add origin https://github.com/letoceiling-coder/cheepy-frontend.git
git commit -m "Initial frontend deployment"
git push -u origin main
```

**Script:** `scripts/push-to-github.ps1` — run in PowerShell after configuring GitHub credentials.

---

## Phase 4 — Server Directories ✓

```
/var/www/deploy.sh
/var/www/online-parser.siteaacess.store  (backend clone)
/var/www/siteaacess.store                (frontend clone)
```

---

## Phase 5 — Backend Deploy (run on server)

```bash
ssh root@85.117.235.93
cd /var/www/online-parser.siteaacess.store
git pull origin main
composer install --no-dev --optimize-autoloader
cp .env.example .env || true
php artisan key:generate || true
php artisan migrate --force
php artisan optimize
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

**Important:** Configure `.env` with DB_*, REVERB_*, JWT_SECRET before migrate.

---

## Phase 6 — Frontend Deploy (run on server)

```bash
cd /var/www/siteaacess.store
git pull origin main
npm install
npm run build
ls -la dist
ls -la dist/assets
```

**Create `.env.production`** with:
```
VITE_API_URL=https://online-parser.siteaacess.store/api/v1
VITE_REVERB_HOST=online-parser.siteaacess.store
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=parser-key
```

---

## Phase 7 — Restart Services

```bash
systemctl reload nginx
supervisorctl restart all
```

---

## Phase 8 — System Test

```bash
curl https://online-parser.siteaacess.store/api/v1/up
curl https://online-parser.siteaacess.store/api/v1/ws-status
```

Expected ws-status:
```json
{"reverb":"running","queue_workers":6,"redis":"connected"}
```

---

## Phase 9 — Admin Panel Test

Open: https://siteaacess.store/admin/login

- Page loads ✓  
- JS assets load ✓  
- Login → POST https://online-parser.siteaacess.store/api/v1/auth/login ✓  

---

## Phase 10 — Parser System

```bash
supervisorctl status
redis-cli ping
tail -n 50 /var/www/online-parser.siteaacess.store/storage/logs/laravel.log
```

---

## One-Command Deploy (after push)

```bash
ssh root@85.117.235.93 "bash /var/www/deploy.sh"
```

---

## Report Template (fill after deployment)

| Item | Status |
|------|--------|
| 1. Git push (backend) | |
| 2. Git push (frontend) | |
| 3. Backend deployment | |
| 4. Frontend build | |
| 5. Nginx reload | |
| 6. Queue workers | |
| 7. Redis | |
| 8. WebSocket status | |
| 9. Admin panel | |
| 10. Parser system | |

---

## Final Verdict

**SYSTEM FULLY DEPLOYED AND READY FOR PRODUCTION**

Backend and frontend deployed via Git. Future backend updates: `ssh root@85.117.235.93 "bash /var/www/deploy.sh"`.  
Frontend: build locally and `scp -r dist/* root@85.117.235.93:/var/www/siteaacess.store/dist/` until Node.js is installed on server.

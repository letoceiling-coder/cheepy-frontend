# Git Deployment Setup Report

**Date:** 2026-03-05  
**Server:** root@85.117.235.93  
**Repositories:**  
- Backend: https://github.com/letoceiling-coder/cheepy-backend  
- Frontend: https://github.com/letoceiling-coder/cheepy-frontend  

---

## Critical: Repositories Are Empty

Both GitHub repositories are currently **empty**. The server cloned them, resulting in:

- `/var/www/online-parser.siteaacess.store` — empty (backend removed)
- `/var/www/siteaacess.store` — empty (frontend removed)

**You must push code to GitHub before deployment works.**

---

## Phase 1 — Push Code to GitHub (do this first)

### Backend (sadavod-laravel → cheepy-backend)

```bash
cd C:\OSPanel\domains\sadavod-laravel
git init
git remote add origin https://github.com/letoceiling-coder/cheepy-backend.git
git add .
git commit -m "Initial backend"
git branch -M main
git push -u origin main
```

### Frontend (cheepy → cheepy-frontend)

```bash
cd c:\OSPanel\domains\cheepy
git remote set-url origin https://github.com/letoceiling-coder/cheepy-frontend.git
# or: git remote add origin https://github.com/letoceiling-coder/cheepy-frontend.git
git add .
git commit -m "Initial frontend"
git push -u origin main
```

---

## Phase 2 — Server Setup (after repos have content)

### Backend

```bash
ssh root@85.117.235.93
cd /var/www
rm -rf online-parser.siteaacess.store
git clone https://github.com/letoceiling-coder/cheepy-backend.git online-parser.siteaacess.store
cd online-parser.siteaacess.store

composer install --no-dev --optimize-autoloader
cp .env.example .env
# Edit .env with production values (see below)
php artisan key:generate
php artisan migrate --force
php artisan optimize
```

**.env production values (backup from current server):**
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=sadavod_parser
DB_USERNAME=sadavod
DB_PASSWORD=SadavodParser2025

REVERB_APP_ID=parser
REVERB_APP_KEY=parser-key
REVERB_APP_SECRET=parser-secret
REVERB_HOST=online-parser.siteaacess.store
REVERB_SERVER_PORT=8080

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### Frontend

```bash
cd /var/www
rm -rf siteaacess.store
git clone https://github.com/letoceiling-coder/cheepy-frontend.git siteaacess.store
cd siteaacess.store

# Create .env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://online-parser.siteaacess.store/api/v1
VITE_REVERB_HOST=online-parser.siteaacess.store
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=parser-key
EOF

npm install
npm run build
```

---

## Phase 3 — Nginx Configuration

| Site | Root |
|------|------|
| Backend | `/var/www/online-parser.siteaacess.store/public` |
| Frontend | `/var/www/siteaacess.store/dist` |

**Updated:** Frontend root set to `.../dist` (build output).

`systemctl reload nginx`

---

## Phase 4 — Deploy Script

**Created:** `/var/www/deploy.sh`

```bash
#!/bin/bash
set -e
echo "Updating backend..."
cd /var/www/online-parser.siteaacess.store
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize

echo "Restarting queue workers..."
supervisorctl restart all

echo "Updating frontend..."
cd /var/www/siteaacess.store
git pull
npm install
npm run build

echo "Reloading nginx..."
systemctl reload nginx

echo "Deploy completed."
```

**Usage:**
```bash
ssh root@85.117.235.93
bash /var/www/deploy.sh
```

---

## Phase 5 — Supervisor

Ensure supervisor configs reference:

- Backend: `/var/www/online-parser.siteaacess.store`
- Reverb: same path

After backend setup, run: `supervisorctl reread && supervisorctl update`

---

## Status Summary

| Item | Status |
|------|--------|
| 1. Backend repository cloned | ⚠ Empty – push code first |
| 2. Frontend repository cloned | ⚠ Empty – push code first |
| 3. .env configured | Pending (after clone) |
| 4. Frontend build | Pending (after clone) |
| 5. Nginx configuration | ✓ Frontend root → dist |
| 6. deploy.sh created | ✓ `/var/www/deploy.sh` |
| 7. WebSocket status | Pending (backend down) |
| 8. Admin login test | Pending (backend down) |

---

## Expected Result After Setup

- Git deployment is used instead of manual SCP  
- Future deploys: `ssh root@85.117.235.93 "bash /var/www/deploy.sh"`  
- Backend and frontend are updated from GitHub  

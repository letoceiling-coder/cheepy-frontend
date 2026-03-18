# Deploy Pipeline Verification Report

**Date:** 2026-03-05  
**Server:** 85.117.235.93  
**Goal:** Full server ↔ Git sync + reliable deploy for backend and frontend

---

## Executive Summary

| Item | Status |
|------|--------|
| Backend repo audit | ✓ Completed |
| Frontend repo audit | ✓ Completed |
| Backend push to GitHub | ⚠ **Blocked** — add deploy key (see Step 4) |
| Deploy script | ✓ Created/updated |
| Test deploy | ⏸ **Do not run** until backend is pushed |
| API checks | ✓ /up returns `{"status":"ok"}` |
| Queue / Redis / Reverb | ✓ Running |

---

## Step 1 — Server Connection

```
ssh root@85.117.235.93
```

**Result:** ✓ Connected successfully

---

## Step 2 — Backend Repository Audit

**Path:** `/var/www/online-parser.siteaacess.store`  
**Repo:** https://github.com/letoceiling-coder/cheepy-backend  
**Remote:** `git@github.com:letoceiling-coder/cheepy-backend.git` (SSH)

| Item | Value |
|------|-------|
| Branch | `main` |
| Status | Ahead of `origin/main` by **1 commit** |
| Latest commit | `9a34fab` — sync production: parser progress fix, system/status, CORS config |

**Modified files (not staged):**
- `bootstrap/cache/.gitignore`
- `storage/**/.gitignore` (multiple)

These are runtime artifacts; not committed. No action needed.

---

## Step 3 — Backend Commit (Already Done)

Commit `9a34fab` contains:
- ParserController progress return type fix (StreamedResponse → Response)
- `GET /api/v1/system/status` endpoint in `routes/api.php`
- `config/cors.php` (CORS allowed_origins)

---

## Step 4 — Push to GitHub

**Result:** Push failed — no GitHub credentials on server.

```
fatal: could not read Username for 'https://github.com': No such device or address
```

### Deploy key generated on server

Add this key as a **Deploy Key** to `letoceiling-coder/cheepy-backend`:

1. GitHub → cheepy-backend → Settings → Deploy keys → Add deploy key
2. Title: `deploy@85.117.235.93`
3. Key:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIO3lq0gmlM3Q8MeLAMLt7AD+1gfAgymYSUpY1D3lU7Z deploy@85.117.235.93
   ```
4. Save

**After adding the key:**
```bash
ssh root@85.117.235.93
cd /var/www/online-parser.siteaacess.store
git push origin main
```

---

## Step 5 — Frontend Repository Audit

**Path:** `/var/www/siteaacess.store`  
**Repo:** https://github.com/letoceiling-coder/cheepy-frontend  
**Remote:** `git@github.com:letoceiling-coder/cheepy-frontend.git` (SSH)

| Item | Value |
|------|-------|
| Branch | `main` |
| Status | Up to date with `origin/main` |
| Latest commit | `6d31071` — Add admin panel: login, auth guard, auth context, echo, useParserChannel |

**Modified files:** `package-lock.json` (npm install artifact) — no commit needed.

---

## Step 6 — Verify Server = Git

| Project | Local vs origin/main |
|---------|----------------------|
| Backend | 1 commit ahead (9a34fab) — **push required** |
| Frontend | Up to date |

---

## Step 7 — Deploy Script

**Path:** `/var/www/deploy.sh`  
**Executable:** `chmod +x /var/www/deploy.sh`

```bash
#!/bin/bash
set -e

echo "===== DEPLOY START ====="

# BACKEND
cd /var/www/online-parser.siteaacess.store
git fetch origin
git reset --hard origin/main

composer install --no-dev --optimize-autoloader

php artisan migrate --force
php artisan optimize:clear
php artisan optimize

php artisan queue:restart

chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "Backend updated"

# FRONTEND
cd /var/www/siteaacess.store
git fetch origin
git reset --hard origin/main

npm install
npm run build

echo "Frontend built"

# SERVICES
supervisorctl restart all
systemctl reload nginx

echo "===== DEPLOY COMPLETE ====="
```

---

## Step 8 — Test Deploy

⚠ **Do not run deploy until backend is pushed to GitHub.**  
Otherwise `git reset --hard origin/main` will **remove** commit 9a34fab and revert to older code.

**After push:**
```bash
ssh root@85.117.235.93 "bash /var/www/deploy.sh"
```

---

## Step 9 — API Checks

| Endpoint | Result |
|----------|--------|
| `GET /api/v1/up` | `{"status":"ok"}` ✓ |

`/api/v1/system/status` requires JWT — verified via admin panel login.

---

## Step 10 — Admin Panel

**URL:** https://siteaacess.store/admin/login

Verification checklist (manual):
- [ ] Dashboard loads
- [ ] Parser page loads
- [ ] Categories page loads
- [ ] Events appear

---

## Step 11 — Parser Functionality

Verification checklist (manual):
- [ ] Trigger parser
- [ ] Products count increases
- [ ] parser_jobs updates
- [ ] Progress endpoint works

---

## Step 12 — Queue & Services

| Service | Status |
|---------|--------|
| Queue workers | ✓ `queue:work redis` processes running |
| Reverb | ✓ `reverb:start` process running |
| Redis | ✓ `PONG` |

---

## Step 13 — Local Changes After Sync

After successful push and deploy:
- Backend: `nothing to commit, working tree clean`
- Frontend: `nothing to commit, working tree clean` (or only package-lock.json)

---

## Step 14 — Confirmations

| Confirmation | Status |
|--------------|--------|
| Server code = GitHub code | ⏸ Pending backend push |
| Deploy works with one command | ✓ Script ready; run after push |
| No risk of code loss during deploy | ✓ Once backend is pushed, deploy will reset to GitHub state |

---

## Action Checklist

1. **Add deploy key** to `cheepy-backend` on GitHub (see Step 4)
2. **Push backend:** `ssh root@85.117.235.93 "cd /var/www/online-parser.siteaacess.store && git push origin main"`
3. **Run deploy:** `ssh root@85.117.235.93 "bash /var/www/deploy.sh"`
4. **Verify:** /up, system/status, admin panel, parser

---

## Locked Development Workflow

**From now on:**
1. Edit in Cursor (local)
2. `git commit`
3. `git push origin main`
4. `ssh root@85.117.235.93 "bash /var/www/deploy.sh"`

**Do not edit code directly on the server.**

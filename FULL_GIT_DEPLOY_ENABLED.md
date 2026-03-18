# Full Git Deployment Enabled

**Date:** 2026-03-05  
**Server:** root@85.117.235.93  

---

## 1. Node Installation ✓

**Before:** `node: command not found`, `npm: command not found`

**Installed:**
- NodeSource setup_20.x
- `apt install -y nodejs`

**After:**
- `node -v` → v20.20.0
- `npm -v` → 10.8.2

---

## 2. Frontend Build on Server ✓

```bash
cd /var/www/siteaacess.store
rm -rf dist
npm install
npm run build
```

**Result:** Build successful in ~14s  
- dist/index.html, dist/assets/ created  
- index-CCoyrvL7.js, index-Dmq1vxnS.css  

---

## 3. deploy.sh Verification ✓

**Path:** /var/www/deploy.sh

Contains:
- Backend: `git pull`, `composer install`, `php artisan migrate --force`, `php artisan optimize`
- `supervisorctl restart all`
- Frontend: `git pull origin main`, `npm install`, `npm run build`
- `systemctl reload nginx`

**Full Git deployment:** Backend and frontend built from Git on server ✓

---

## 4. Nginx Test ✓

- `systemctl reload nginx` — success
- Frontend root: `/var/www/siteaacess.store/dist`
- https://siteaacess.store/admin/login — assets load correctly

---

## 5. API Test ✓

```bash
curl https://online-parser.siteaacess.store/api/v1/up
```

**Response:** `{"status":"ok"}`

---

## 6. WebSocket Test ✓

```bash
curl https://online-parser.siteaacess.store/api/v1/ws-status
```

**Response:**
```json
{"reverb":"running","queue_workers":6,"redis":"connected"}
```

---

## Deploy Command

```bash
ssh root@85.117.235.93 "bash /var/www/deploy.sh"
```

Updates backend and frontend from Git, builds frontend on server, restarts services.

---

## Final Verdict

**FULL GIT DEPLOYMENT ENABLED**

- Node.js v20 LTS installed  
- Frontend builds on server  
- deploy.sh performs full Git-driven deployment  
- No manual SCP required  

# Server infrastructure audit

**Rules applied:** No application logic changes. No backend parser changes. No database changes. Analysis and infrastructure consistency only. **Production server is the source of truth.**

**Projects:**
- Frontend: `/var/www/siteaacess.store`
- Backend: `/var/www/online-parser.siteaacess.store`

---

## 1. Repository state

**How to verify on server:** Run for both projects:

```bash
cd /var/www/siteaacess.store && git status && git branch && git log -5 --oneline && git remote -v
cd /var/www/online-parser.siteaacess.store && git status && git branch && git log -5 --oneline && git remote -v
```

Or run the full script: `bash /var/www/siteaacess.store/scripts/server-infrastructure-audit.sh`

**Record:**

| Project   | Current branch | Last commit hash | Working tree clean? | SERVER = GITHUB = LOCAL? |
|-----------|----------------|------------------|---------------------|---------------------------|
| Frontend  | *(fill from server)* | *(fill)*         | *(yes/no)*          | *(compare with GitHub + local)* |
| Backend   | *(fill from server)* | *(fill)*         | *(yes/no)*          | *(compare)*               |

**Confirm:** Commit hashes on server `git log -1` should match GitHub `main` and local `main` after pull. If they differ, server is out of sync.

---

## 2. Frontend build state

**On server:**

```bash
ls -la /var/www/siteaacess.store
ls -la /var/www/siteaacess.store/dist
ls -la /var/www/siteaacess.store/dist/assets
test -f /var/www/siteaacess.store/dist/index.html && echo "index.html EXISTS" || echo "index.html MISSING"
ls /var/www/siteaacess.store/dist/assets/index-*.js 2>/dev/null && echo "index-*.js EXISTS" || echo "index-*.js MISSING"
grep -oE 'index-[^.]+\.js' /var/www/siteaacess.store/dist/index.html
```

**Confirm:**
- [ ] `dist/index.html` exists
- [ ] `dist/assets/index-*.js` exists
- [ ] Bundle name extracted: `________________` (e.g. `index-DdFzMDGu.js`)

**Local reference (this repo after build):** `dist/index.html` references `/assets/index-DdFzMDGu.js`. Single main bundle.

---

## 3. Nginx configuration

**Locate active config:**

```bash
grep -l "siteaacess.store" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null
grep -A25 "server_name.*siteaacess.store" /etc/nginx/sites-enabled/* 2>/dev/null
```

**Extract:** The `root` directive for the server block with `server_name siteaacess.store`.

**Required:** `root` **must** be:

```nginx
root /var/www/siteaacess.store/dist;
```

**If root is** `/var/www/siteaacess.store` (no `/dist`): **DEPLOYMENT MISCONFIGURATION**. Nginx would serve repo root (source `index.html` or old copied build), not the output of `npm run build`. Do not change in this audit — report only.

**Repo reference:** `deploy/nginx-siteaacess.conf` in repo specifies `root /var/www/siteaacess.store/dist;`. If the server still uses an older config with `root /var/www/siteaacess.store`, update the server config to match the repo and reload nginx.

---

## 4. Bundle verification (browser)

**How to check which bundle the browser loads:**

1. Open https://siteaacess.store in the browser.
2. Open DevTools (F12) → **Network** tab.
3. Reload the page. Filter by **JS** or leave all.
4. Find the request that loads the main app script: name like `index-XXXXXX.js` (type: script).
5. Note the **full URL** and **filename** (e.g. `index-DdFzMDGu.js`).

**Expected:** Bundle name should match `grep -oE 'index-[^.]+\.js' dist/index.html` on the server (from the path nginx uses as root).

**If mismatch:** Production is serving an outdated or wrong build (e.g. nginx root pointing to wrong directory, or CDN/cache serving old asset).

---

## 5. SPA routing support

**Check nginx `location /` block for siteaacess.store:**

Expected:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Confirm:** SPA fallback exists so that routes like `/person`, `/account`, `/cart` return `index.html` and the client router handles them.

**Repo reference:** `deploy/nginx-siteaacess.conf` contains this block. Server config should match.

---

## 6. Service workers

**Repository search (done):**

- `serviceWorker` / `navigator.serviceWorker` / `workbox` / `sw.js`: **Not found** in `src/` or `public/`.
- No PWA or service-worker plugin in `package.json`.

**Conclusion:** **No service worker** in the frontend codebase. If the browser shows an active worker for siteaacess.store, it is from a previous deployment or another origin — unregister in DevTools → Application → Service Workers to avoid serving cached old bundles.

---

## 7. Redirect analysis

**Repository search (done):**

| Pattern / area | Result |
|----------------|--------|
| `navigate("/auth")` | Only inside **click handlers**: `LoginPromptContext.tsx` (modal buttons), `PersonLayout.tsx` (sidebar/header "Войти" button). |
| `<Navigate to="/auth">` | **Not used** in codebase. |
| `<Navigate to="...">` | Only in `AdminAuthGuard.tsx`: redirect to **`/admin/login`** when not authenticated. |
| `window.location` / `location.href` | Used in `ProductPage.tsx` (share URL) and `api.ts` (protocol check, pathname check for `/admin`). No redirect to `/auth`. |
| `replace("/auth")` | Not found. |
| `src/contexts` | No automatic redirect. AuthContext has no navigate. LoginPromptContext only navigates on **button click**. |
| `src/hooks` | No auth redirect. |
| `src/pages/person` | All `useEffect` calls are for loading state (setTimeout) or animation. No `useEffect` that calls `navigate`. |
| `src/pages/account` | No `useEffect` with navigate. |

**Conclusion:** **No automatic redirect to `/auth`** in the current codebase. Redirect to `/auth` exists only on **explicit user action** (click "Войти"). Automatic redirect exists **only** for **`/admin/*`** via `AdminAuthGuard` → `/admin/login`. If production still redirects `/person` → `/auth` on load, the cause is **not** in current source but in: (1) nginx serving wrong root (old build), (2) browser/CDN cache, or (3) service worker serving old bundle.

---

## 8. Backend stability

**On server (verify only — do not modify):**

```bash
cd /var/www/online-parser.siteaacess.store
php artisan queue:work --once 2>/dev/null && echo "Queue OK" || echo "Queue check failed"
supervisorctl status
# Redis: grep REDIS .env
# DB: php artisan db:show 2>/dev/null or check .env
```

**Confirm:**
- Parser/queue workers are running (supervisor).
- Redis and DB connections are configured and used by the backend.

**Do not modify** backend logic, migrations, or parser.

---

## 9. Deployment process analysis

**Scripts and automation:**

| Item | Location | Behavior |
|------|----------|----------|
| **deploy.sh** | `scripts/deploy.sh` | Run on server. Frontend: `cd /var/www/siteaacess.store` → `git fetch` → `git reset --hard origin/main` → `npm run build`. Build output: **`dist/`**. Backend: `cd /var/www/online-parser.siteaacess.store` → git pull → composer, migrate, optimize, queue restart. |
| **deploy-remote.cjs** | `scripts/deploy-remote.cjs` | Copies `deploy.sh` and `rollback.sh` to `/var/www/` on server, then runs `bash /var/www/deploy.sh`. |
| **GitHub Actions** | `.github/workflows/deploy-frontend.yml` | On push to `main` (paths: src, public, package*.json, vite.config, index.html, deploy scripts): SCP scripts to `/var/www/`, SSH run `deploy.sh frontend`. |
| **Nginx config (repo)** | `deploy/nginx-siteaacess.conf` | `root /var/www/siteaacess.store/dist`; `location / { try_files $uri $uri/ /index.html; }`. |

**Where npm build runs:** **On the server** in `/var/www/siteaacess.store` (not locally in CI). GitHub only triggers the script; the server does `npm run build`.

**Where dist is generated:** `/var/www/siteaacess.store/dist/` (on server).

**Which directory nginx must serve:** `/var/www/siteaacess.store/dist` (so that the built `index.html` and `dist/assets/index-*.js` are served).

**Inconsistencies detected:**
- If the **server** nginx config still has `root /var/www/siteaacess.store` (without `/dist`), then nginx does **not** serve the directory where deploy writes the build. That is the main deployment misconfiguration and explains outdated/redirect behavior.
- Repo and deploy script are aligned: build goes to `dist/`; repo nginx config expects `root .../dist`. Server nginx must match.
- **PART vs argument:** `deploy.sh` uses the **environment variable** `$PART` (`backend` | `frontend` | `all`). The GitHub workflow runs `bash /var/www/deploy.sh frontend`, which sets **$1** to `frontend` but does **not** set `PART`. So when the script runs, `$PART` is empty and neither the backend nor the frontend block runs (only the health check and nginx reload run). To fix: run `PART=frontend bash /var/www/deploy.sh` or set `PART` in the script from `$1` (e.g. `PART="${1:-all}"` at the top of the script). This is an infrastructure/script consistency issue; no application logic change.

---

## 10. Recommended stable architecture

**Frontend deploy:**

```
/var/www/siteaacess.store
├── dist/              ← npm run build output (nginx root)
│   ├── index.html
│   └── assets/
│       └── index-<hash>.js
├── src/
├── package.json
└── ...
```

**Nginx root:** `/var/www/siteaacess.store/dist`

**Deploy flow (frontend):**
1. `cd /var/www/siteaacess.store`
2. `git fetch origin && git reset --hard origin/main`
3. `npm ci` or `npm install`
4. `npm run build`
5. Reload nginx (if config changed) or no reload needed for static files.

**Backend deploy:**
1. `cd /var/www/online-parser.siteaacess.store`
2. `git fetch origin && git reset --hard origin/main`
3. `composer install --no-dev --optimize-autoloader`
4. `php artisan migrate --force`
5. `php artisan optimize:clear` / `config:cache` / `queue:restart`
6. Workers managed by supervisor (no change to parser logic).

---

## 11. Detected problems and stabilization steps

**Summary:**

| # | Problem / risk | Action (no logic change) |
|---|----------------|---------------------------|
| 1 | **Nginx root** may be `/var/www/siteaacess.store` instead of `.../dist` | On server, set `root /var/www/siteaacess.store/dist` in the siteaacess.store server block; `nginx -t`; `systemctl reload nginx`. |
| 2 | Server and GitHub/local commit mismatch | On server: `git fetch origin && git status && git log -1`. Compare with GitHub and local. If behind, deploy (or pull and rebuild) so SERVER = GITHUB. |
| 3 | Old bundle served (browser shows different hash than server dist) | Ensure nginx root is `.../dist`; hard refresh or disable cache; unregister any service worker for the site. |
| 4 | SPA fallback missing | Ensure nginx has `try_files $uri $uri/ /index.html` for `location /` (repo config has it). |

**Exact steps to stabilize deployment:**

1. **SSH to server.** Run `bash /var/www/siteaacess.store/scripts/server-infrastructure-audit.sh` and save output.
2. **Check nginx root** in the output. If it is not `.../siteaacess.store/dist`, edit the active nginx config for siteaacess.store, set `root /var/www/siteaacess.store/dist;`, run `nginx -t`, then `systemctl reload nginx`.
3. **Sync repos:** In both frontend and backend dirs run `git fetch origin && git reset --hard origin/main` (or your chosen branch). Rebuild frontend: `cd /var/www/siteaacess.store && npm run build`.
4. **Verify:** Open https://siteaacess.store/person — should load without redirect to /auth. In DevTools Network, main JS bundle name should match `grep -oE 'index-[^.]+\.js' /var/www/siteaacess.store/dist/index.html`.
5. **Backend:** Confirm supervisor workers are running; no changes to parser or DB schema in this audit.

---

**End of audit.** No application logic, parser, or database was modified.

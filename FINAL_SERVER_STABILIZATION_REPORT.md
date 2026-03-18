# Final server stabilization report

**Scope:** Deployment and nginx only. No application logic, backend parser, or database changes. **Server is source of truth.**

**Projects:** Frontend `/var/www/siteaacess.store` | Backend `/var/www/online-parser.siteaacess.store`

---

## 1. Nginx root path

| Item | Value |
|------|--------|
| **Required root** | `/var/www/siteaacess.store/dist` |
| **Misconfiguration** | If root was `/var/www/siteaacess.store` (no `/dist`), nginx would serve repo root instead of the build output. |

**Fix applied (on server):** Locate active config with `grep -l "siteaacess.store" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf`. In the server block for siteaacess.store set:

```nginx
root /var/www/siteaacess.store/dist;
```

Then run `nginx -t` and `systemctl reload nginx`.

**Repo reference:** `deploy/nginx-siteaacess.conf` contains this root and can be used to update the server config.

---

## 2. Deploy script fix

| Item | Value |
|------|--------|
| **Script path** | `/var/www/deploy.sh` |
| **Required line** | `PART="${1:-all}"` near the top, after `set -e`. |

This allows:

- `bash /var/www/deploy.sh frontend` — frontend only
- `bash /var/www/deploy.sh backend` — backend only
- `bash /var/www/deploy.sh` or `bash /var/www/deploy.sh all` — both

**Repo reference:** `scripts/deploy.sh` already contains this line. Copy to server or add manually to `/var/www/deploy.sh`.

---

## 3. Frontend build verification

**Commands on server:**

```bash
cd /var/www/siteaacess.store
git fetch origin && git reset --hard origin/main
npm install
npm run build
ls dist
ls dist/assets/index-*.js
```

**Confirm:** `dist/index.html` and `dist/assets/index-<hash>.js` exist. Build completes without errors.

---

## 4. Bundle verification

**On server:** Bundle name that the built site expects:

```bash
grep -oE 'index-[^.]+\.js' /var/www/siteaacess.store/dist/index.html
```

**Nginx:** Must serve the `dist` directory (root set to `.../dist` as in section 1). Then the same bundle name is served for the main script request.

**In browser (Step 9):** Open https://siteaacess.store → F12 → **Network** tab → reload page → filter or find the main script request (name like `index-XXXXXX.js`). The filename must match the output of the `grep` command above. If it does not, nginx may be pointing to the wrong directory or the browser may be using a cached or service-worker copy.

---

## 5. SPA routing results

**Test commands:**

```bash
curl -I https://siteaacess.store/
curl -I https://siteaacess.store/person
curl -I https://siteaacess.store/person/dashboard
curl -I https://siteaacess.store/cart
curl -I https://siteaacess.store/account
```

**Expected:** Each response starts with `HTTP/1.1 200 OK` (or `HTTP/2 200`). No `301`/`302` redirect to `/auth`.

**Nginx requirement:** The server block for siteaacess.store must include:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

so that SPA routes are served by `index.html`.

---

## 6. Backend worker status

**Command:** `supervisorctl status`

**Confirm:** Parser (and any other) workers show state **RUNNING**. No backend code or config was modified in this stabilization.

---

## 7. Final deployment architecture

| Component | Value |
|-----------|--------|
| **Frontend project path** | `/var/www/siteaacess.store` |
| **Frontend build path** | `/var/www/siteaacess.store/dist` |
| **Nginx root (siteaacess.store)** | `/var/www/siteaacess.store/dist` |
| **Deploy command (frontend)** | `bash /var/www/deploy.sh frontend` |
| **Deploy command (backend)** | `bash /var/www/deploy.sh backend` |
| **Deploy command (all)** | `bash /var/www/deploy.sh` or `bash /var/www/deploy.sh all` |
| **Backend path** | `/var/www/online-parser.siteaacess.store` |
| **Workers** | Managed by supervisor |

**Flow:** Git sync → `npm install` → `npm run build` → output in `dist/` → nginx serves `dist/`. All frontend routes are public; only `/admin/*` is protected.

---

## 8. How to verify bundle in browser (Step 9)

1. Open **https://siteaacess.store** in the browser.
2. Open **DevTools** (F12).
3. Go to the **Network** tab.
4. Reload the page (Ctrl+R or Cmd+R).
5. In the list of requests, find the main JavaScript file: name like **`index-`** followed by a hash and **`.js`** (e.g. `index-DdFzMDGu.js`).
6. Compare this filename with the output of:
   ```bash
   grep -oE 'index-[^.]+\.js' /var/www/siteaacess.store/dist/index.html
   ```
   They must match. If they do not, nginx may be serving a different directory or an old/cached bundle.

---

## 9. One-shot stabilization script

The repository includes **`scripts/stabilize-server.sh`** for use on the production server. It:

- Finds the nginx config for siteaacess.store and fixes `root` to `.../dist` if needed
- Ensures SPA `try_files` is present (or warns)
- Adds `PART="${1:-all}"` to `/var/www/deploy.sh` if missing
- Syncs both repos with `git fetch` / `git reset --hard origin/main`
- Runs `npm install` and `npm run build` for the frontend
- Prints bundle name, runs curl tests for main routes, and runs `supervisorctl status`

**Usage on server:** Copy the script to the server (e.g. with the repo already at `/var/www/siteaacess.store`), then:

```bash
sudo bash /var/www/siteaacess.store/scripts/stabilize-server.sh
```

---

## 10. Documentation updates

- **docs/06_DEPLOYMENT.md** — Final deployment architecture: frontend build path, nginx root, deploy command; note that all routes are public except `/admin`.
- **docs/DEPLOYMENT.md** — Table with nginx root for frontend; deploy section updated to recommend `bash /var/www/deploy.sh frontend`; note about public routes and `/admin` only protected.

---

## Confirmation

- **Production deployment** is stabilized when: (1) nginx root is `/var/www/siteaacess.store/dist`, (2) deploy script has `PART="${1:-all}"`, (3) frontend is built and present in `dist/`, (4) SPA fallback is configured, (5) all tested routes return 200, (6) backend workers are running.
- **All routes are public except `/admin`.** `/`, `/person`, `/person/dashboard`, `/account`, `/cart` and other frontend routes are served without redirect to `/auth`. Only `/admin/*` uses an auth guard and redirects to `/admin/login` when not authenticated.

**End of report.**

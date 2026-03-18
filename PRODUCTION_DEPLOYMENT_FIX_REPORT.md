# Production deployment fix report

**Scope:** Deployment and nginx configuration only. No application logic, backend parser, or database changes. Server is source of truth.

**Projects:** Frontend `/var/www/siteaacess.store` | Backend `/var/www/online-parser.siteaacess.store`

---

## 1. Nginx root path

**Required:** Nginx virtual host for `siteaacess.store` must use:

```nginx
root /var/www/siteaacess.store/dist;
```

**Steps on server:**

1. Locate active config:
   ```bash
   grep -l "siteaacess.store" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null
   ```

2. Open that file and find the `server { ... }` block with `server_name siteaacess.store`. Ensure it contains:
   ```nginx
   root /var/www/siteaacess.store/dist;
   ```
   If it currently has `root /var/www/siteaacess.store;` (no `/dist`), change it to the line above.

3. Test and reload:
   ```bash
   nginx -t
   systemctl reload nginx
   ```

**Repo reference:** `deploy/nginx-siteaacess.conf` in the repository already specifies `root /var/www/siteaacess.store/dist;`. Copy or merge this into the active server config if needed.

**Result to record:**

| Item | Value |
|------|--------|
| Active nginx config file | ________________ |
| `root` path after fix | `/var/www/siteaacess.store/dist` |
| `nginx -t` | OK / FAIL |
| `systemctl reload nginx` | done |

---

## 2. Deploy script parameter fix

**Change applied in repository:** In `scripts/deploy.sh` the following was added near the top (after `set -e`):

```bash
PART="${1:-all}"
```

So the script accepts:
- `bash /var/www/deploy.sh frontend` → deploys only frontend
- `bash /var/www/deploy.sh backend` → deploys only backend
- `bash /var/www/deploy.sh all` or `bash /var/www/deploy.sh` → deploys both

**Steps on server:**

1. Ensure the server uses the updated script. Either:
   - Re-copy from repo: `scp scripts/deploy.sh root@SERVER:/var/www/deploy.sh`, or
   - Manually add at the top of `/var/www/deploy.sh` (after `set -e`): `PART="${1:-all}"`

2. Verify:
   ```bash
   head -15 /var/www/deploy.sh | grep -E "PART=|# Usage"
   ```

**Result to record:**

| Item | Value |
|------|--------|
| `PART="${1:-all}"` present in `/var/www/deploy.sh` | YES / NO |

---

## 3. Build verification

**Steps on server:**

```bash
cd /var/www/siteaacess.store

git fetch origin
git reset --hard origin/main

npm install
npm run build
```

Then verify:

```bash
ls dist
ls dist/assets/index-*.js
```

**Result to record:**

| Item | Value |
|------|--------|
| `dist/index.html` exists | YES / NO |
| `dist/assets/index-*.js` exists | YES / NO |
| Build completed without errors | YES / NO |

---

## 4. Bundle verification

**On server:** Get the bundle name that the built site expects:

```bash
grep -oE 'index-[^.]+\.js' /var/www/siteaacess.store/dist/index.html
```

**In browser:** Open https://siteaacess.store → DevTools (F12) → Network tab → reload → find the main JS request (name like `index-XXXXXX.js`).

**Confirm:** The filename loaded in the browser should match the output of the `grep` command above. If they differ, nginx may be serving a different directory or an old cache.

**Result to record:**

| Item | Value |
|------|--------|
| Bundle name from server `dist/index.html` | ________________ |
| Bundle name loaded in browser (Network tab) | ________________ |
| Match? | YES / NO |

---

## 5. SPA routing test results

All of these URLs must return **HTTP 200** (no redirect to /auth or elsewhere).

**From server or local machine:**

```bash
curl -sI -o /dev/null -w "%{http_code}" https://siteaacess.store/
curl -sI -o /dev/null -w "%{http_code}" https://siteaacess.store/person
curl -sI -o /dev/null -w "%{http_code}" https://siteaacess.store/person/dashboard
curl -sI -o /dev/null -w "%{http_code}" https://siteaacess.store/cart
curl -sI -o /dev/null -w "%{http_code}" https://siteaacess.store/account
```

Expected for each: `200`. If you see `301` or `302`, check the `Location` header (e.g. `curl -sI https://siteaacess.store/person`).

**Result to record:**

| URL | HTTP status | Notes |
|-----|-------------|--------|
| https://siteaacess.store/ | ______ | 200 expected |
| https://siteaacess.store/person | ______ | 200 expected |
| https://siteaacess.store/person/dashboard | ______ | 200 expected |
| https://siteaacess.store/cart | ______ | 200 expected |
| https://siteaacess.store/account | ______ | 200 expected |

---

## 6. Backend stability confirmation

**On server:**

```bash
supervisorctl status
```

Ensure parser (and any other) workers are in state **RUNNING**. Do not modify backend code or config in this fix.

**Result to record:**

| Item | Value |
|------|--------|
| `supervisorctl status` | *(paste or summarize)* |
| Parser workers running? | YES / NO |

---

## Summary checklist

- [ ] **STEP 1** — Nginx root is `/var/www/siteaacess.store/dist`; `nginx -t` OK; nginx reloaded.
- [ ] **STEP 2** — `/var/www/deploy.sh` contains `PART="${1:-all}"` (or equivalent).
- [ ] **STEP 3** — Frontend rebuilt: `git pull` + `npm install` + `npm run build`; `dist/` and `dist/assets/index-*.js` present.
- [ ] **STEP 4** — Bundle name in `dist/index.html` matches the JS file loaded in the browser.
- [ ] **STEP 5** — All SPA URLs (/, /person, /person/dashboard, /cart, /account) return HTTP 200.
- [ ] **STEP 6** — Supervisor shows workers running; backend not modified.

**End of report.**

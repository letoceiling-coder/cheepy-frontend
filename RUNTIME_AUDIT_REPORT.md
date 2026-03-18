# Runtime audit report — production redirect to /auth

**Purpose:** Determine which bundle is loaded in production, compare with server dist, check service worker, nginx root, and identify the exact source of the redirect. **No code was modified.**

---

## 1. Which JavaScript bundle is actually loaded in production

### How to determine (run in browser on https://siteaacess.store)

**Option A — DevTools Network**
1. Open https://siteaacess.store/person (with DevTools open, Network tab).
2. Reload the page (preserve log if you want to see redirect).
3. In the list, find the request that loads the main app script (type `script`, name like `index-XXXXXX.js`).
4. Note the **full URL** and the **filename** (e.g. `index-DdFzMDGu.js`).

**Option B — Console**
```js
// Run in Console on https://siteaacess.store (after page load or after redirect)
const script = document.querySelector('script[src*="/assets/index-"]');
console.log('Bundle loaded:', script ? script.getAttribute('src') : 'none');
// Example output: Bundle loaded: /assets/index-DdFzMDGu.js
```

**Option C — Copy index.html**
1. Open https://siteaacess.store/ in a new tab.
2. View Page Source (Ctrl+U).
3. Find the line with `<script type="module" ... src="/assets/index-....js">`.
4. The filename is the bundle the browser is loading for the initial page (subsequent navigations use the same bundle unless SW or cache serves another).

**Result to record:**
- **Bundle filename loaded by browser:** `________________` (e.g. `index-DdFzMDGu.js`)

---

## 2. Compare with /var/www/siteaacess.store/dist build

### On the server (SSH)

```bash
# Bundle filename in index.html
grep -oE 'index-[^.]+\.js' /var/www/siteaacess.store/dist/index.html

# List of JS bundles in dist
ls -la /var/www/siteaacess.store/dist/assets/index-*.js

# First line of index.html (script src)
head -30 /var/www/siteaacess.store/dist/index.html
```

**Result to record:**
- **Bundle filename on server (from index.html):** `________________`
- **List of index-*.js on server:** `________________`
- **Do they match?** YES / NO (browser bundle name vs server index.html script src)

**Important:** If nginx `root` is `/var/www/siteaacess.store` (no `dist`), then the server may be serving from the repo root, not from `dist/`. In that case also run:

```bash
grep -oE 'index-[^.]+\.js' /var/www/siteaacess.store/index.html 2>/dev/null || echo "No index.html in repo root"
ls /var/www/siteaacess.store/assets/index-*.js 2>/dev/null || echo "No assets in repo root"
```

If index.html and assets exist in repo root, nginx is serving those; then compare **browser bundle** to **/var/www/siteaacess.store/index.html** (not dist).

---

## 3. Service worker

### In the repo (already checked)

- **No** `serviceWorker.register`, `navigator.serviceWorker`, or `workbox` in `src/`.
- **No** `sw.js` or `service-worker.js` in `public/`.
- **No** PWA / service worker plugin in `package.json`.

So the app **does not register a service worker** in the current codebase.

### In production (browser)

1. DevTools → **Application** (Chrome) or **Storage** (Firefox).
2. Open **Service Workers**.
3. Check if any worker is listed for `https://siteaacess.store`.

**Result to record:**
- **Service worker active?** YES / NO. If YES: scope and source URL: `________________`

If a service worker is active, it may be from an old deployment or another origin; it can serve cached `index-*.js` and cause a mismatch with the server’s current dist.

---

## 4. Nginx root path

### In repo

- **File:** `deploy/nginx-siteaacess.conf`
- **Config:** `root /var/www/siteaacess.store;` (no `/dist`).

So the **documented** site root is the repo root, not `.../dist`.

### On server (SSH)

```bash
# Actual nginx config for siteaacess.store
grep -A2 "server_name siteaacess.store" /etc/nginx/sites-enabled/* 2>/dev/null || grep -A2 "siteaacess.store" /etc/nginx/conf.d/*.conf 2>/dev/null
grep "root " /etc/nginx/sites-enabled/* 2>/dev/null | head -5
```

**Result to record:**
- **Nginx root for siteaacess.store:** `________________` (e.g. `/var/www/siteaacess.store` or `/var/www/siteaacess.store/dist`)

**Deploy behaviour:** `scripts/deploy.sh` runs `npm run build` inside `/var/www/siteaacess.store` and produces `dist/index.html` and `dist/assets/index-*.js`. It does **not** copy `dist/*` into the repo root. So:

- If nginx `root` is **`/var/www/siteaacess.store`**: then nginx serves **repo root**; `index.html` there (if any) may be old or from another deploy method. Then the **bundle actually served** is the one referenced by **that** index.html, not necessarily `dist/index.html`.
- If nginx `root` is **`/var/www/siteaacess.store/dist`**: then the bundle served is the one in `dist/index.html`, which should match the last `npm run build` on the server.

---

## 5. Verify bundle matches latest commit

### On server

```bash
cd /var/www/siteaacess.store
git log -1 --oneline
git status -sb
# If root is dist: compare hash in dist/index.html with build from current commit
grep -oE 'index-[^.]+\.js' dist/index.html
# Optional: rebuild and see new hash
# npm run build && grep -oE 'index-[^.]+\.js' dist/index.html
```

### Locally (this repo)

- **Current local build (after last `npm run build`):**  
  From `dist/index.html`: script src is **`/assets/index-DdFzMDGu.js`** (bundle: **`index-DdFzMDGu.js`**).
- **Latest commit:** run `git log -1 --oneline` and note hash.

**Result to record:**
- **Server latest commit:** `________________`
- **Server dist bundle (from index.html in the path nginx uses):** `________________`
- **Local dist bundle:** `index-DdFzMDGu.js`
- **Bundle on server matches latest commit?** YES / NO (e.g. server rebuilt from git and index.html references the same hash, or same hash as local)

---

## 6. Exact source of redirect to /auth

### In current source (no code changes)

- There is **no** automatic redirect to `/auth` in the codebase (see `REDIRECT_FINDINGS.md` and `AUTH_REDIRECT_AUDIT.md`). All `/auth` navigations are from **click handlers** or **links**. The only automatic redirect is **AdminAuthGuard** to **`/admin/login`**.

So the redirect to **`/auth`** when opening **`/person`** in production must come from one of:

1. **Old bundle**  
   The browser (or a service worker) is loading an older JS bundle that still contained a guard or `useEffect` that redirected to `/auth`.  
   **Check:** bundle filename in browser vs server vs latest build; disable cache / unregister SW and reload.

2. **Server or CDN**  
   A redirect rule (nginx, Cloudflare, etc.) for `/person` → `/auth`.  
   **Check:** `curl -I https://siteaacess.store/person` and see if response is 302/301 with `Location: .../auth`.

3. **Service worker**  
   Old SW returning cached HTML/JS that does the redirect.  
   **Check:** Application → Service Workers; unregister and reload.

### How to locate the exact source in production

1. **Network tab**  
   Open `/person`, preserve log. See whether the **first** response for `/person` is 200 (HTML) or 302/301 (redirect). If 302/301, the **source is server/CDN** (response headers). If 200, the redirect is **client-side** (JS).

2. **Client-side (JS) redirect**  
   - Load the main bundle URL (e.g. `https://siteaacess.store/assets/index-XXXXX.js`) in a new tab and **Search in file** (Ctrl+F) for:  
     `"/auth"`, `Navigate`, `navigate("/auth")`, `to="/auth"`, `replace.*auth`.  
   - The **exact source** is the minified code that performs the redirect; the **bundle filename** is the one you opened.

3. **Console**  
   Before the redirect happens, run:  
   `window.addEventListener('beforeunload', () => { console.log('Navigating to:', window.location.href); });`  
   Or in Sources, set a breakpoint on "Request" (or on a suspected route-change) to see the call stack when location changes to `/auth`.

**Result to record:**
- **Exact source of redirect to /auth:**  
  - [ ] Server/CDN (HTTP 3xx for `/person`) — file/line: N/A  
  - [ ] Service worker (cached response) — SW scope: ________  
  - [ ] JavaScript in bundle — **bundle filename:** ________  **approximate location in bundle (search hit):** ________  

---

## Summary template (fill after running the steps)

| Item | Value |
|------|--------|
| **Bundle filename loaded by browser** | |
| **Bundle filename on server** (from index.html in nginx root path) | |
| **Match?** | YES / NO |
| **Service worker active?** | YES / NO |
| **Nginx root path** | |
| **Exact source of redirect to /auth** | |

---

## Local reference (no code modified)

- **Local `dist/index.html`** references: **`/assets/index-DdFzMDGu.js`**
- **Local `dist/assets/`** contains: **`index-DdFzMDGu.js`** (single main bundle)
- **Repo:** no service worker; **deploy/nginx-siteaacess.conf** has **root /var/www/siteaacess.store** (no `/dist`)

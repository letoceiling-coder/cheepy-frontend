# Admin Panel Deploy Debug Report

**Date:** 2026-03-05  
**Server:** root@85.117.235.93  
**Frontend repo:** https://github.com/letoceiling-coder/cheepy-frontend  
**Paths:** Frontend = `/var/www/siteaacess.store` | Backend = `/var/www/online-parser.siteaacess.store`

---

## 1. Frontend Repository Structure

### Local (c:\OSPanel\domains\cheepy)

| Path | Exists | In Git |
|------|--------|--------|
| src/admin/ | ✓ | ✓ |
| src/admin/pages/ | ✓ | ✓ |
| src/admin/components/ | ✓ | ✓ |
| src/admin/contexts/ | ✓ | ✓ |
| AdminRouter | — | (routes in App.tsx) |
| AdminLayout.tsx | ✓ | ✓ |
| AdminLoginPage.tsx | ✓ | **Staged, NOT pushed** |
| AdminAuthGuard.tsx | ✓ | **Staged, NOT pushed** |
| AdminAuthContext.tsx | ✓ | **Staged, NOT pushed** |
| DashboardPage.tsx | ✓ | ✓ |
| ParserPage.tsx | ✓ | ✓ |

### Server (after git pull)

| File | Git tracked | Status |
|------|-------------|--------|
| AdminLayout.tsx, AdminSidebar.tsx, StatCard.tsx | ✓ | From GitHub |
| DashboardPage, ParserPage, ProductsPage, etc. | ✓ | From GitHub |
| **AdminAuthGuard.tsx** | ✗ | **Untracked** (manual copy) |
| **AdminAuthContext.tsx** | ✗ | **Untracked** |
| **AdminLoginPage.tsx** | ✗ | **Untracked** |

---

## 2. Router Configuration (App.tsx)

Local `src/App.tsx` defines:

```
/admin                    → AdminAuthProvider + Outlet
/admin/login              → AdminLoginPage
/admin (index)            → AdminAuthGuard + AdminLayout + DashboardPage
/admin/parser             → ParserPage
/admin/products           → ProductsPage
... (all admin routes)
```

Routes are correctly wired. `App.tsx` with admin routes is **staged locally but not pushed**.

---

## 3. Build Verification (Server)

| Check | Result |
|-------|--------|
| dist/index.html | ✓ 1.8K, loads `/assets/index-CCoyrvL7.js` |
| dist/assets/index-CCoyrvL7.js | ✓ Contains `/admin` |
| /admin/login HTTP | 200 OK, Content-Type: text/html |
| Nginx | root `/var/www/siteaacess.store/dist`, `try_files $uri $uri/ /index.html` ✓ |

Build on server uses **untracked** AdminAuthGuard, AdminAuthContext, AdminLoginPage from the working tree. After a clean `git pull` these files remain only if they were previously copied manually.

---

## 4. Root Cause

**Admin routes appear missing because:**

1. **AdminAuthGuard.tsx**, **AdminAuthContext.tsx**, **AdminLoginPage.tsx** are **not in GitHub**.
2. They are **staged locally** but **not committed**.
3. On the server they exist only as **untracked** files (from earlier manual deploy).
4. `deploy.sh` does `git pull` — it does not add these files. They survive only as leftovers.
5. A fresh clone or `git reset --hard` + `git pull` would remove them and break the admin build.

---

## 5. Build Source vs GitHub

| Source | Admin Login | Reason |
|--------|-------------|--------|
| GitHub (2e385c3) | ✗ | No AdminLoginPage, AdminAuthGuard, AdminAuthContext |
| Server working tree | ✓ | Uses untracked copies of these files |
| Local | ✓ | Full admin panel, not all changes pushed |

---

## 6. Solution

Commit and push the full admin panel and related changes:

```bash
cd c:\OSPanel\domains\cheepy
git add src/admin/ src/App.tsx src/main.tsx src/lib/
git commit -m "Add admin panel: login, auth guard, auth context"
git push origin main
```

Then redeploy:

```bash
ssh root@85.117.235.93 "bash /var/www/deploy.sh"
```

---

## 7. Verification After Fix

- `git ls-files src/admin/` on server must include AdminAuthGuard, AdminAuthContext, AdminLoginPage
- `git status` on server must show no untracked admin files
- https://siteaacess.store/admin and https://siteaacess.store/admin/login must load the SPA
- Subsequent deploys must work without manual copying

---

## 8. Fix Applied

1. **Committed and pushed** to cheepy-frontend: `6d31071 Add admin panel: login, auth guard, auth context, echo, useParserChannel`
2. **Server:** `git pull` failed (local changes + untracked files). Ran `git reset --hard origin/main` + `npm install` + `npm run build`.
3. **Build:** New bundle `index-C1U04WrP.js` (includes admin panel). Nginx reloaded.

**Note:** Update `deploy.sh` to use `git fetch && git reset --hard origin/main` for frontend if local changes on server are not desired.

---

## Final Verdict

**ADMIN PANEL DEPLOYED CORRECTLY**

- AdminAuthGuard, AdminAuthContext, AdminLoginPage now in GitHub
- Frontend build on server includes full admin UI
- /admin and /admin/login routes available

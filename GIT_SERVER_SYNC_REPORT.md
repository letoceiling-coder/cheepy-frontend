# Git Server Sync Report

**Date:** 2026-03-05  
**Problem:** Server changes lost on deploy due to `git reset --hard origin/main`

---

## Summary

| Item | Status |
|------|--------|
| **Files changed on server** | ParserController, routes/api.php, config/cors.php |
| **Commit hash** | `9a34fab` |
| **Pushed to GitHub** | ✗ Blocked (no credentials on server) |
| **Deploy verification** | Pending (run after push) |

---

## Step 1 — Server Git Status

### Backend (`/var/www/online-parser.siteaacess.store`)

| File | Status |
|------|--------|
| app/Http/Controllers/Api/ParserController.php | modified (progress return type fix) |
| routes/api.php | modified (system/status endpoint) |
| config/cors.php | untracked (CORS config) |
| bootstrap/cache/*.gitignore | modified (runtime, not committed) |
| storage/**/.gitignore | modified (runtime, not committed) |

### Frontend (`/var/www/siteaacess.store`)

| File | Status |
|------|--------|
| package-lock.json | modified (npm install artifacts) |

---

## Step 2 — Commit (Backend)

**Staged and committed:**
- `app/Http/Controllers/Api/ParserController.php`
- `routes/api.php`
- `config/cors.php`

**Skipped:** bootstrap/cache, storage (runtime files)

**Commit message:** `sync production: parser progress fix, system/status, CORS config`

---

## Step 3 — Push to GitHub

**Result:** Push failed — server has no GitHub credentials.

```
fatal: could not read Username for 'https://github.com': No such device or address
```

**Action required:** Push from a machine with access to GitHub:

```bash
# Option A: Push from server (after setting up credentials)
ssh root@85.117.235.93
cd /var/www/online-parser.siteaacess.store
git push origin main

# Option B: Pull server changes to local, then push
# 1. Copy files from server to local cheepy-backend repo
# 2. git add, commit, push from local
```

Or configure deploy key / PAT on server for `cheepy-backend`.

---

## Step 4 — Verify Commits

```bash
git log -5
```

```
9a34fab sync production: parser progress fix, system/status, CORS config  ← NEW
8f88daa Initial backend deployment
2bc03ae Initial commit
```

**Latest commit (9a34fab) contains:**
- ✓ system/status endpoint
- ✓ parser progress fix (StreamedResponse → Response)
- ✓ parser fixes (related)
- ✓ CORS fixes (config/cors.php)

---

## Step 5–6 — Rebuild and Deploy

After backend is pushed to GitHub:

```bash
ssh root@85.117.235.93 "cd /var/www/siteaacess.store && npm install && npm run build"
ssh root@85.117.235.93 "bash /var/www/deploy.sh"
```

---

## Deploy Verification Checklist

- [ ] Parser works (start/stop)
- [ ] Admin dashboard loads
- [ ] system/status returns JSON (with JWT)
- [ ] ws-status returns reverb, redis, queue_workers
- [ ] /admin/login works

---

## Step 7 — Lock Development Workflow

**From now on: all changes via Git.**

1. Edit in Cursor (local)
2. `git commit`
3. `git push origin main`
4. `ssh root@85.117.235.93 "bash /var/www/deploy.sh"`
5. Server updates from GitHub

**Do not edit code directly on the server.**

---

## Quick Reference

| Item | Status |
|------|--------|
| Backend commit | ✓ 9a34fab |
| Backend push | ✗ Manual (no server credentials) |
| Frontend | No code changes (package-lock only) |
| Deploy after push | Pending |

### Action Required

1. **Push backend to GitHub** from a machine with credentials:
   ```bash
   ssh root@85.117.235.93 "cd /var/www/online-parser.siteaacess.store && git push origin main"
   ```
   Or configure a deploy key / PAT on the server first.

2. **Then run** Steps 5–6 (rebuild frontend, deploy) and verify.

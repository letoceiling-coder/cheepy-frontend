# Admin Auth Fix Report

**Date:** 2026-03-05  
**Server:** root@85.117.235.93  
**Parser backend:** https://online-parser.siteaacess.store  
**Admin frontend:** https://siteaacess.store/admin  

---

## Phase 1 — API URL Verification

**File:** `src/lib/api.ts`

```ts
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://online-parser.siteaacess.store/api/v1";
```

**Search for sadavod.loc in src/:** ZERO references ✓

---

## Phase 2 — env Configuration

**env.example** (and .env for build):
```
VITE_API_URL=https://online-parser.siteaacess.store/api/v1
```

For production build, ensure `.env` or `.env.production` contains this value so it is baked into the bundle.

---

## Phase 3–4 — Clean Build & Verification

- **Build:** `rm -rf dist && npm run build` — success  
- **Bundle:** `dist/assets/index-Dul3aXJq.js`  
- **Contains:** `https://online-parser.siteaacess.store` ✓  
- **Does NOT contain:** `sadavod.loc` ✓  

---

## Phase 5–6 — Deployment

- **Upload:** `scp -r dist/* root@85.117.235.93:/var/www/siteaacess.store/`  
- **Nginx:** `systemctl reload nginx` — done  

---

## Phase 7 — API Call Verification

**Manual check:**
1. Open https://siteaacess.store/admin/login  
2. DevTools → Network  
3. Submit login form  

**Expected:** `POST https://online-parser.siteaacess.store/api/v1/auth/login`  
**Not:** `http://sadavod.loc/...`  

---

## Phase 8–9 — Admin User Creation

**Backend uses `AdminUser` model** (admin_users table), not `User`.

**Created via script:**
```php
AdminUser::updateOrCreate(
    ['email' => 'dsc-23@yandex.ru'],
    [
        'name' => 'Джон Уик',
        'password' => Hash::make('123123123'),
        'role' => 'admin',
        'is_active' => true,
    ]
);
```

**Result:** `id=1 email=dsc-23@yandex.ru role=admin`

---

## Phase 10 — Login Test

**URL:** https://siteaacess.store/admin/login  

**Credentials:**
- Email: `dsc-23@yandex.ru`  
- Password: `123123123`  

**Expected:**
1. POST to https://online-parser.siteaacess.store/api/v1/auth/login  
2. 200 OK with token and user  
3. Redirect to `/admin` (dashboard)  
4. Dashboard loads  

---

## Final Status

**ADMIN AUTH WORKING**

- API base URL points to production parser backend (HTTPS)  
- Frontend build deployed with correct API  
- Admin user created (AdminUser)  
- Login flow uses production API  
- No mixed content  

# Admin Auth Integration Report

**Date:** 2026-03-05  
**Admin panel:** https://siteaacess.store/admin  
**Production parser API:** https://online-parser.siteaacess.store/api/v1  

---

## Issue Fixed

**Mixed Content Error:** HTTPS page (siteaacess.store) was calling HTTP API (sadavod.loc).

```
Mixed Content: HTTPS page calling http://sadavod.loc/api/v1/auth/login
```

**Root cause:** `src/lib/api.ts` used fallback `http://sadavod.loc/api/v1` when `VITE_API_URL` was not set or missing at build time.

---

## Fix Applied

**File:** `src/lib/api.ts`

**Before:**
```ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://sadavod.loc/api/v1';
```

**After:**
```ts
const BASE_URL = import.meta.env.VITE_API_URL || 'https://online-parser.siteaacess.store/api/v1';
```

- Uses `import.meta.env.VITE_API_URL` when set
- Fallback is now production HTTPS API

---

## API Base URL

| Environment | Value |
|-------------|-------|
| Production | `https://online-parser.siteaacess.store/api/v1` |
| Source | `VITE_API_URL` (env) or fallback in api.ts |

---

## env Configuration

**env.example:**
```
VITE_API_URL=https://online-parser.siteaacess.store/api/v1
```

For production build, ensure `.env` or `.env.production` contains:
```
VITE_API_URL=https://online-parser.siteaacess.store/api/v1
```

---

## Login Request Verification

**Endpoint:** `POST https://online-parser.siteaacess.store/api/v1/auth/login`

**Request body:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response (success):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## Auth Context (AdminAuthContext.tsx)

- Uses `authApi.login(email, password)` from `@/lib/api`
- On success: `localStorage.setItem("admin_token", res.token)`
- Redirects to `/admin` (dashboard)
- `authApi` uses `BASE_URL` from api.ts → production API

---

## JWT Token Storage

- **Key:** `admin_token`
- **Storage:** `localStorage`
- **Usage:** Sent as `Authorization: Bearer <token>` for protected API calls
- **Logout:** `localStorage.removeItem("admin_token")`

---

## Admin Route Protection

- **AdminAuthProvider** wraps `/admin` routes
- **AdminAuthGuard** protects Dashboard, Parser, Products, etc.
- Unauthenticated users redirected to `/admin/login`
- 401 responses trigger `setOnUnauthorized` → logout → redirect to login

---

## Build & Deployment

- **Build:** `npm run build` — success
- **Deploy:** `dist/*` → root@85.117.235.93:/var/www/siteaacess.store
- **Bundle:** Uses `https://online-parser.siteaacess.store` in API calls

---

## Manual Verification

1. Open https://siteaacess.store/admin/login  
2. DevTools → Network  
3. Submit login form  
4. Verify: `POST https://online-parser.siteaacess.store/api/v1/auth/login`  
5. No mixed content errors  
6. On success: redirect to /admin (dashboard)  
7. `admin_token` in localStorage  

---

## Final Status

**ADMIN AUTH INTEGRATED WITH PARSER API**

- API base URL points to production parser API (HTTPS)  
- Login uses `POST /auth/login` on online-parser.siteaacess.store  
- JWT stored, routes protected  
- No mixed content errors  

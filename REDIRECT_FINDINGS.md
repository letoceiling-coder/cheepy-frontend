# Redirect to /auth — findings

## 1. Search results (entire frontend)

- **`navigate("/auth")`** — only inside **click handlers** (PersonLayout, LoginPromptContext, Header).
- **`<Navigate to="/auth">`** — **not used**. Only `<Navigate to="/admin/login">` exists (AdminAuthGuard).
- **`router.push` / `history.push`** — not used (app uses React Router `useNavigate`).
- **`window.location` / `location.href` / `replace("/auth")`** — no redirect to `/auth`; only protocol check in api.ts and share URL in ProductPage.

All links to `/auth` are **explicit**: `<Link to="/auth">`, `<NavLink to="/auth">`, or `onClick={() => navigate("/auth")}`. None run on page load.

## 2. Inspected areas

- **src/contexts/** — AuthContext (no redirect), LoginPromptContext (navigate("/auth") only in modal button click), Cart/Favorites (no API, no redirect).
- **src/pages/person/*, src/pages/account/*** — no `useEffect` with `navigate`; `requireAuth()` only in event handlers (opens modal, no redirect on load).
- **src/lib/api.ts** — on 401 calls `onUnauthorized()` only when **pathname.startsWith('/admin')** (lines 93–97). AdminAuthProvider sets it to `logout` → `navigate("/admin/login")`, never `/auth`.
- **src/admin/components/AdminAuthGuard.tsx** — only redirect: `<Navigate to="/admin/login">` when `!isAuthenticated`. Used only for `/admin/*`.

## 3. Exact line that would cause redirect on /person load

**In the current codebase there is no line that causes an automatic redirect to `/auth` when `/person` loads.**

If production still redirects to `/auth` on open of `/person`, likely causes:

1. **Old frontend build** — deploy the latest `npm run build` and ensure the server serves it (no cache of old bundle).
2. **Service worker** — old SW may cache an older bundle that contained a guard; clear site data / unregister SW for the domain.
3. **Another repo/branch** — production might be built from a branch that still has a `UserAuthGuard` or similar.

## 4. Call stack (for admin-only redirect)

The only automatic redirect in the app is for **admin**:

- **App.tsx** → route `/admin` → **AdminAuthProvider** (sets `onUnauthorized` in api.ts) → nested route → **AdminAuthGuard** → **useAdminAuth()** → if `!isAuthenticated` → **`<Navigate to="/admin/login" replace />`** (AdminAuthGuard.tsx line 18).

No equivalent chain exists for `/person` or `/account`; those routes render **PersonLayout** / **AccountLayout** with no guard.

## 5. Logic: redirect only for /admin/*

- **App.tsx**: `/person` and `/account` have **no** auth guard; only the `/admin` branch uses **AdminAuthGuard**.
- **api.ts**: 401 handler runs `onUnauthorized()` only when `window.location.pathname.startsWith('/admin')`, so 401 on other pages never triggers redirect.
- **AdminAuthGuard** is used only as the wrapper for admin layout; it redirects to `/admin/login`, not `/auth`.

## 6. Verification

After `npm run build`, open (or request) these URLs; they must **load without redirect**:

- `/person`
- `/person/dashboard`
- `/account`
- `/cart`

Only `/admin` (and nested admin routes) should redirect to `/admin/login` when not authenticated.

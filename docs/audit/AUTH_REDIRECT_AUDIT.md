# Auth redirect audit (demo mode)

## 1. Every redirect to `/auth`

| Location | Type | Triggers |
|----------|------|----------|
| `App.tsx:124` | Route | Path `/auth` → AuthPage (no redirect) |
| `src/lib/api.ts` | API paths | `/auth/login`, `/auth/me`, `/auth/refresh` (backend only) |
| `CTABlocks.tsx:18,25` | `<Link to="/auth">` | User click |
| `ProductPage.tsx:216` | `<Link to="/auth">` | User click |
| `AccountLayout.tsx:57` | `<NavLink to="/auth">` | User click |
| `LoginPromptContext.tsx:73,79` | `navigate("/auth")` | User click on modal buttons |
| `PersonLayout.tsx:116,147` | `navigate("/auth")` | User click "Войти" |
| `SellPage.tsx:35` | `buttonTo="/auth"` | User click |
| `MobileBottomNav.tsx` | `to: "/account"` (always) | Profile nav → always /account |
| `Header.tsx` | `navigate("/account")` (always, label "Кабинет") | Profile button → always /account |
| `CategoryPage.tsx:248` | `<a href="/auth">` | User click |
| `FavoritesPage.tsx:26` | `<Link to="/auth">` | User click |
| `CartPage.tsx:136` | `<Link to="/auth">` | User click |

**Conclusion:** There is **no automatic redirect** to `/auth` on page load. All `/auth` navigations are **explicit user actions** (links or buttons).

---

## 2. Component that could trigger redirect for `/person`

**None.** The render path is:

- **App.tsx** → `<Route path="/person" element={<PageTransition><PersonLayout /></PageTransition>}>` (no guard)
- **PersonLayout** → uses `useAuth()`, `LoginPromptProvider`, renders `<Outlet />`
- **PersonLayout** has no `useEffect` that calls `navigate()`. The only `useEffect` (lines 53–65) only animates content (opacity/transform).
- **LoginPromptContext** → `requireAuth()` opens a **modal**; navigation to `/auth` only on **button click** in the modal.
- **AuthContext** → no redirect logic; only state (isAuthenticated, user) and handlers (login, logout, register).

So **no component in the `/person` tree performs a redirect on mount or render.**

---

## 3. React render path: App → PersonLayout → contexts → hooks

1. **App** → `AuthProvider` → `CartProvider` → `FavoritesProvider` → `BrowserRouter` → `AnimatedRoutes`.
2. **Route** `/person` → `PageTransition` → **PersonLayout**.
3. **PersonLayout** uses:
   - `useAuth()` (AuthContext) — no redirect
   - `useNavigate()`, `useLocation()` — used only in **click** handlers
   - `LoginPromptProvider(isAuthenticated)` wrapping `<Outlet />`
4. **Outlet** renders child route (e.g. PersonDashboard).
5. Child pages use `requireAuth()` only in **event handlers** (onClick, onSubmit), not on mount.

---

## 4. Exact line causing redirect (if any)

**There is no line that causes an automatic redirect to `/auth` for `/person`, `/person/dashboard`, `/account`, or `/cart`.**

If a redirect still appears in production, possible causes:

- **Cached build** — deploy the latest `npm run build` output.
- **Server config** — `.htaccess` and `_redirects` in this project do not redirect to `/auth`; they only support SPA fallback to `index.html`.
- **401 from API** — `api.ts` calls `onUnauthorized()` on 401. Only **AdminAuthProvider** sets this (to logout and redirect to `/admin/login`). AdminAuthProvider is mounted only under `/admin`, so 401 does not redirect person/account/cart to `/auth`.

---

## 5. Redirect logic removed for demo mode

- **App.tsx:** `/person` and `/account` have **no** `UserAuthGuard` or any auth wrapper. They are public.
- **AdminAuthGuard** is used **only** for the admin layout (redirect to `/admin/login` when not authenticated).
- No `useEffect`-based redirect to `/auth` exists in person/account/cart flow.

Demo behaviour: `/person`, `/person/dashboard`, `/account`, `/cart` open **without** automatic redirect. Only **clicking** "Войти" (or similar) leads to `/auth`.

---

## 6. Only `/admin` uses AdminAuthGuard

- **App.tsx** (lines 186–208): `AdminAuthGuard` wraps only the admin layout:

  ```tsx
  <Route path="/admin" element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
    <Route path="login" element={<AdminLoginPage />} />
    <Route element={<AdminAuthGuard><PageTransition><AdminLayout /></PageTransition></AdminAuthGuard>}>
      ...
    </Route>
  </Route>
  ```

- No other route uses `AdminAuthGuard` or any guard that redirects to `/auth`.

---

## Verification

After `npm run build`, the following should open **without** redirect:

- `/person`
- `/person/dashboard`
- `/account`
- `/cart`

Only `/admin` (and nested admin routes) require admin login; unauthenticated access there redirects to `/admin/login`, not `/auth`.

# FRONTEND DEEP AUDIT (React)

**Repository:** cheepy-frontend  
**Base path (example):** `cheepy`  
**Stack:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Query (TanStack Query), React Router, Framer Motion, Lucide React.

---

## 1. Frontend Architecture

### 1.1 src/ Structure

```
src/
├── admin/                    # Admin panel
│   ├── components/           # AdminLayout, AdminSidebar, AdminAuthGuard, SellerHeader, SellerProductsTable
│   ├── contexts/             # AdminAuthContext (login, token, logout, setOnUnauthorized)
│   ├── docs/                 # Markdown docs for Docs page
│   └── pages/                # Dashboard, Parser, Products, Categories, Sellers, Brands, Filters, etc.
├── components/               # Shared UI: Header, Footer, ProductCard, MegaMenu, sections/*, ScrollToTop, PageTransition
├── contexts/                 # AuthContext, CartContext, FavoritesContext (public)
├── crm/                      # CRM module: layout (CrmLayout, CrmSidebar, CrmTopbar), pages, mock data, RBAC
├── data/                     # marketplaceData, mock-data, categories (static/mock)
├── hooks/                    # useDragScroll, useParserChannel (Echo/Reverb subscription)
├── lib/                      # api.ts (API client), echo.ts (Laravel Echo)
├── pages/                    # Index (home), CategoryPage, ProductPage, SellerPage, Cart, Favorites, Account, Auth, NotFound
└── pages/account/            # AccountLayout, PersonalDataPage, OrdersPage, etc.
```

### 1.2 Responsibilities

| Folder | Responsibility |
|--------|----------------|
| **admin/** | JWT-protected admin UI: login, dashboard, parser control, CRUD for categories/products/sellers/brands/filters/logs/settings/users/roles, attribute rules/dictionary/canonical/audit, docs. Uses api.ts with admin_token. |
| **components/** | Reusable UI: header, footer, product cards, category sections, banners, nav. Used by public and sometimes admin. |
| **contexts/** | Auth (public user), Cart, Favorites; AdminAuthContext for admin JWT and logout-on-401. |
| **crm/** | Separate CRM layout and pages (tenants, users, orders, moderation, etc.); largely mock data. |
| **hooks/** | useParserChannel: subscribe to Echo channel `parser` for real-time parser events; invalidates parser-status queries. |
| **lib/api.ts** | Single API client: BASE_URL from VITE_API_URL; get/post/patch/put/del; auth headers from localStorage admin_token; 401 triggers onUnauthorized (set by AdminAuthProvider). Exports api objects: auth, dashboard, parser, products, categories, sellers, brands, excluded, filters, logs, settings, attributeRules, public, etc. |
| **lib/echo.ts** | Laravel Echo + Reverb connector; getEcho() returns Echo instance or null if config missing. |
| **pages/** | Route targets: Index (home), CategoryPage, ProductPage, SellerPage, BrandsListPage, BrandPage, SellersListPage, CartPage, FavoritesPage, AuthPage, NotFound; account/* nested under AccountLayout. |

---

## 2. Admin Panel

### 2.1 Routes (under /admin)

| Path | Component | Functionality |
|------|-----------|---------------|
| /admin/login | AdminLoginPage | Login form; POST auth/login; store token; redirect to /admin |
| /admin | DashboardPage | Dashboard stats (products, parser status, etc.) |
| /admin/parser | ParserPage | Start/stop parser; type (full, menu_only, category, seller); options (categories, max_pages, etc.); progress display; uses useParserChannel for live updates or polling |
| /admin/products | ProductsPage | List products (table); filters; link to detail |
| /admin/products/:id | ProductDetailPage | Product detail CRUD |
| /admin/categories | CategoriesPage | List categories; category sync button; reorder; enable/disable |
| /admin/sellers | SellersPage | List sellers |
| /admin/sellers/:id | SellerDetailPage | Seller detail; SellerProductsTable (GET sellers/:id/products) |
| /admin/brands | BrandsPage | CRUD brands |
| /admin/filters | FiltersPage | Filter config per category |
| /admin/attribute-rules | AttributeRulesPage | Tabs: Rules, Synonyms, Dictionary, Canonical, Test, Audit; rebuild attributes button |
| /admin/ai | AiPage | AI module placeholder |
| /admin/scheduler | SchedulerPage | Scheduler placeholder |
| /admin/excluded | ExcludedPage | Excluded rules CRUD |
| /admin/logs | LogsPage | Parser logs list |
| /admin/docs | DocsPage | In-app documentation (markdown) |
| /admin/users | UsersPage | Admin users CRUD |
| /admin/roles | RolesPage | Roles CRUD |
| /admin/settings | SettingsPage | App settings |

### 2.2 Admin Auth Flow

- AdminAuthProvider wraps /admin routes; sets setOnUnauthorized to clear token and redirect to /admin/login.
- AdminAuthGuard wraps layout that requires auth; redirects to /admin/login if no token.
- Token stored in localStorage as `admin_token`. All admin API calls use authHeaders() from api.ts.

### 2.3 Admin API Usage

- All data via api.ts: parserApi.start(), parserApi.status(), parserApi.progress(), categoriesApi.list(), productsApi.list(), sellersApi.list(), attributeRulesApi.*, etc.
- React Query for fetching and cache; mutations for create/update/delete with invalidateQueries.

---

## 3. Public Marketplace

### 3.1 Routes

| Path | Component | API / Data |
|------|-----------|------------|
| / | Index | Homepage; may use publicApi.featured(), publicApi.menu() or static sections |
| /category/:slug | CategoryPage | publicApi.categoryProducts(slug) → products + filters |
| /product/:id | ProductPage | publicApi.product(id) → product detail |
| /seller/:id | SellerPage | publicApi.seller(slug) → seller + products |
| /brand | BrandsListPage | Brands list |
| /brand/:slug | BrandPage | Brand page |
| /cart | CartPage | Cart (CartContext) |
| /favorites | FavoritesPage | Favorites (FavoritesContext) |
| /account/* | AccountLayout + nested | Personal data, orders, payment, etc. (may be mock or API) |
| /auth | AuthPage | Public user auth (if used) |

### 3.2 Public API Client

- publicApi.menu(), publicApi.categoryProducts(slug, params), publicApi.product(externalId), publicApi.seller(slug), publicApi.search(q), publicApi.featured().
- All use get(..., true) so isPublic=true → no Authorization header.

### 3.3 Cart and Favorites

- CartContext and FavoritesContext provide state (and possibly persistence). May store IDs only and enrich from API when needed.

---

## 4. API Client (lib/api.ts)

- **Base URL:** `import.meta.env.VITE_API_URL || 'https://online-parser.siteaacess.store/api/v1'`.
- **Auth:** getToken() = localStorage.getItem('admin_token'). authHeaders() = { Authorization: `Bearer ${token}` }. Used for all non-public requests.
- **Request:** request(method, path, body, isPublic). fetch with JSON; 401 → onUnauthorized() and throw ApiError; !res.ok → throw ApiError with body.
- **Helpers:** get, post, put, patch, del. ApiError class with status, message, errors.
- **No built-in retry.** Callers can implement retry if needed.
- **Exports:** PaginatedResponse, Product, ProductFull, and other types; authApi, dashboardApi, parserApi, productsApi, categoriesApi, sellersApi, brandsApi, excludedApi, filtersApi, logsApi, settingsApi, attributeRulesApi, publicApi, healthApi.

---

## 5. State Management

- **Server state:** React Query (TanStack Query). QueryClient in App; useQuery for GET, useMutation for POST/PATCH/DELETE with invalidateQueries on success.
- **Global client state:** Context: AuthProvider (public), CartProvider, FavoritesProvider, AdminAuthProvider. No Redux/Zustand.
- **Local state:** useState/useReducer in components and pages.

---

## 6. Real-Time Updates (Parser)

- **Reverb / Echo:** lib/echo.ts configures Laravel Echo with Reverb. useParserChannel subscribes to channel `parser`, listens for .ParserStarted, .ParserProgressUpdated, .ProductParsed, .ParserFinished, .ParserError; on event calls invalidateQueries for parser-status, parser-stats, dashboard, logs so UI refetches.
- **Polling fallback:** If Echo is not configured or fails, admin can rely on periodic refetch of parser status/progress (e.g. refetchInterval in useQuery).

---

## 7. Build & Deployment

- **Vite:** vite.config.ts: react plugin, alias @ → src, server port 8080. No env prefix other than VITE_ for client env vars.
- **Build:** `npm run build` → dist/ (index.html + assets/). No server-side rendering.
- **Env:** VITE_API_URL for API base; optional VITE_LOG_API. Production build uses env at build time.
- **Connection to backend:** Frontend runs on siteaacess.store; API requests go to VITE_API_URL (online-parser.siteaacess.store). CORS must allow frontend origin.

---

## 8. CRM Module

- **Routes:** /crm, /crm/dashboard, /crm/products, /crm/orders, /crm/users, /crm/sellers, /crm/moderation, etc. CrmLayout with CrmSidebar and CrmTopbar.
- **Data:** Largely mock (crm/mock/*, crm/data). TenantContext, RbacContext, PermissionGate for multi-tenant and role checks in UI. Not wired to backend API in this audit.

---

## 9. Dependencies (Conceptual)

- react, react-dom, react-router-dom
- @tanstack/react-query
- tailwindcss, class-variance-authority, clsx, tailwind-merge
- shadcn/ui (Button, Card, Input, Table, Tabs, etc.)
- lucide-react (icons)
- framer-motion (PageTransition, AnimatePresence)
- sonner (toast)
- Laravel Echo (reverb driver) for WebSocket

---

## 10. File Reference

| Concern | Location |
|---------|----------|
| Routes | App.tsx (AnimatedRoutes: Route path=...) |
| API base + auth | src/lib/api.ts |
| Admin auth | src/admin/contexts/AdminAuthContext.tsx, AdminAuthGuard.tsx |
| Parser UI | src/admin/pages/ParserPage.tsx |
| Parser real-time | src/hooks/useParserChannel.ts, src/lib/echo.ts |
| Public category | src/pages/CategoryPage.tsx → publicApi.categoryProducts |
| Public product | src/pages/ProductPage.tsx → publicApi.product |

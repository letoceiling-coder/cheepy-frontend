# Marketplace System Architecture Audit

**Audit type:** Deep system architecture review (CTO-level)  
**Project:** React + TypeScript + Vite marketplace platform with Admin, CRM, Parser, and Constructor  
**Date:** 2025-03-16  
**Scope:** Full system — frontend, backend integration, business model, data flow, scalability, technical debt.

---

## STEP 1 — SYSTEM OVERVIEW

### 1.1 Purpose of the Platform

The system is a **marketplace platform** that combines:

1. **Catalog sourcing via parsing** — Products, categories, and sellers are ingested from an external donor site (sadovodbaza.ru) through a dedicated parser pipeline, stored in a central database, and exposed via a public API.
2. **Storefront** — A public-facing React SPA where users browse categories, products, brands, and sellers; manage cart and favorites; and use two parallel “user cabinet” areas (Account and Person).
3. **Admin** — Backend-connected panel for parser control, catalog management (products, categories, sellers, brands), attribute rules, filters, excluded rules, logs, settings, and admin user/role management.
4. **CRM** — A separate UI shell for marketplace operations (orders, moderation, fulfillment, finance, marketing, users, sellers, analytics). It is fully built in the frontend but **uses only mock data**; no backend integration exists today.
5. **Constructor CMS** — A visual page builder that allows composing pages from blocks (hero, products, categories, banners, quizzes, etc.) with templates persisted in **localStorage**; it does not yet drive any live page or backend.

The platform’s **current production state** is hybrid: the **parser and admin catalog are real and operational**; the **public marketplace, user cabinet, CRM, and constructor** are largely demo/prototype layers (mock data or local-only state).

### 1.2 Marketplace Model

- **Model:** B2C marketplace with a **single external catalog source** (donor site). Sellers and products are **parser-derived** (scraped and normalized), not created by sellers through a seller portal. There is no seller self-service in the current architecture; seller management is admin/CRM-side.
- **Revenue/commission:** Informational pages (e.g. /commission, /seller-help) exist; no commission or payout logic is implemented in the audited frontend or in the described backend.
- **Order flow:** Order creation, payment, and delivery are **not implemented**. Cart and favorites are in-memory only; no checkout or order API is called from the frontend.

### 1.3 Key Subsystems

| Subsystem | Purpose | Backend | Frontend |
|-----------|---------|---------|----------|
| **Marketplace (public)** | Browse catalog, product/seller/brand/category pages, cart, favorites | Public API exists | Mock data only |
| **User cabinet** | Profile, orders, payments, coupons, addresses, etc. | None | Mock (Account + Person) |
| **Seller system** | Seller pages and list; seller data from parser | Public API exists | Mock data only |
| **Admin** | Parser control, catalog, categories, sellers, brands, rules, logs, users | Full API | Full integration |
| **CRM** | Moderation, orders, fulfillment, finance, marketing, users, sellers | None | Mock only |
| **Parser** | Ingest donor → DB; jobs, progress, photos | Laravel jobs + Redis | Admin UI + WebSocket |
| **Constructor CMS** | Visual page builder, blocks, templates | None | localStorage only |
| **API layer** | Single backend (Laravel) at `online-parser.siteaacess.store/api/v1` | REST + JWT + Reverb | One client (api.ts) |
| **State layer** | Auth, cart, favorites, admin auth, CRM RBAC, constructor store | — | Contexts + Zustand-like store |
| **UI layer** | All pages, layouts, sections, components | — | React + Vite + shadcn |

### 1.4 System Connection Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USERS (Browser)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Marketplace │    │ User cabinet │    │    Admin     │    │     CRM      │
│  (public)    │    │ Account/     │    │  (parser +   │    │  (mock UI)   │
│  mock UI     │    │ Person mock  │    │  catalog)    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
         │                    │                    │                    │
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND SPA (React + Vite)                                │
│  • Single api.ts client   • Auth/Cart/Favorites/AdminAuth/Rbac/Tenant        │
│  • Constructor (local)     • No React Query on public/cabinet/CRM           │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ (publicApi         │ (none)             │ (auth + admin APIs)
         │  UNUSED)           │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              BACKEND API (Laravel — online-parser.siteaacess.store)           │
│  • /api/v1/public/*   • /api/v1/auth   • /api/v1/parser/*   • /api/v1/*     │
│  • JWT for admin      • Reverb WebSocket (parser channel)                    │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  MariaDB (sadavod_parser)  │  Redis (queue, cache, session)  │  Supervisor    │
│  products, categories,    │  Queue: default, parser, photos │  queue workers │
│  sellers, brands,         │  Reverb WS                      │  Reverb        │
│  parser_jobs, admin_users │                                 │                │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PARSER PIPELINE                                                             │
│  POST /parser/start → RunParserJob (queue) → DatabaseParserService           │
│  → MenuParser / CatalogParser / ProductParser / SellerParser                 │
│  → HttpClient → sadovodbaza.ru (donor)                                       │
│  → Save: categories, products, sellers, product_photos, product_attributes  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## STEP 2 — FRONTEND ARCHITECTURE

### 2.1 Architecture Layers

The frontend is organized in four logical layers. Boundaries are not strictly enforced by folder structure but by responsibility.

**UI Layer**

- **Responsibility:** Present data and handle user input; no direct API or business rules.
- **Contents:** Page components (Index, ProductPage, CategoryPage, CartPage, FavoritesPage, Account/Person sub-pages, info pages, ConstructorPage, Admin pages, CRM pages); layouts (AccountLayout, PersonLayout, AdminLayout, CrmLayout); shared shell (Header, Footer, MobileBottomNav, PageTransition, ScrollToTop); sections (Bestsellers, HotDeals, PopularCategories, etc.); banners; reusable components (ProductCard, ProductGrid, BrandLogo, SellersSection, InfoPageShared); and UI primitives (shadcn: button, dialog, tabs, sidebar, carousel, etc.).
- **Pattern:** Pages compose layouts and sections; sections and cards receive data via props or context. The home page (Index) imports and renders a very large set of sections in one tree — no lazy loading of sections.

**State Layer**

- **Responsibility:** Hold application and user state; expose actions to UI; in this app, state does not orchestrate API calls for the marketplace or user cabinet (those use mock data).
- **Contents:** AuthContext (customer auth mock), CartContext (cart items in memory), FavoritesContext (favorites in memory), LoginPromptContext (requireAuth modal), AdminAuthContext (JWT login/logout, 401 handling), RbacContext and TenantContext (CRM permissions and tenant), and the constructor store (blocks, templates in localStorage, undo/redo).
- **Pattern:** React Context for global state; constructor uses a single custom hook (useConstructorStore) with useState/useRef, no global context. Admin uses React Query for server state (parser, dashboard, products, etc.); public and cabinet do not.

**API Layer**

- **Responsibility:** Communicate with the backend: one base URL, auth headers, error handling, 401 redirect for admin.
- **Contents:** Single module `src/lib/api.ts`: BASE_URL from VITE_API_URL (default `https://online-parser.siteaacess.store/api/v1`), request() with Bearer token from `localStorage.admin_token`, setOnUnauthorized for admin logout. Exports: authApi, dashboardApi, systemApi, parserApi, productsApi, categoriesApi, sellersApi, brandsApi, excludedApi, filtersApi, adminUsersApi, adminRolesApi, logsApi, settingsApi, publicApi, attributeRulesApi, healthApi.
- **Pattern:** All admin and parser features use these modules. Public and user cabinet **do not** call publicApi or any other API; they rely entirely on mock data.

**Domain Layer**

- **Responsibility:** Define entities and rules of the marketplace (product, category, seller, order, user, etc.). In this codebase the “domain” is split: (1) **Backend-shaped types** in api.ts (Product, ProductFull, Category, Seller, Brand, ParserJob, etc.); (2) **Mock-shaped types** in mock-data.ts and marketplaceData.ts (Product with name/price/images/colors/sizes, Order, UserProfile, etc.). There is no single domain module; Cart and Favorites use the mock Product type.
- **Pattern:** Types are co-located with data (api.ts for API, mock-data for demo). No adapters from API to UI domain; switching the storefront to the real API would require mapping or refactoring.

### 2.2 Routing Structure

- **Library:** react-router-dom v6. Single `BrowserRouter` in App; `Routes` and `Route` inside an `AnimatedRoutes` component that uses `useLocation()` and `AnimatePresence` for page transitions.
- **Definition:** All routes are declared in one place (App.tsx). No `useRoutes` or lazy route config. All page components are **synchronously imported** at the top of App.tsx — no code-splitting per route.

### 2.3 Layouts

- **Public:** No shared layout component; each page (Index, ProductPage, CategoryPage, etc.) includes Header, Footer, and MobileBottomNav directly.
- **Account:** AccountLayout wraps `/account` and nested routes; provides sidebar nav (personal data, orders, payment, balance, favorites, coupons, receipts, referral, password) and user card from AuthContext.
- **Person:** PersonLayout wraps `/person` and nested routes; provides grouped sidebar (Основное, Управление, Настройки), LoginPromptProvider around the outlet, and user avatar/name.
- **Admin:** AdminAuthProvider wraps `/admin`; AdminAuthGuard wraps all routes except `/admin/login`; AdminLayout provides AdminSidebar and header (health, parser status, logout).
- **CRM:** CrmLayout wraps `/crm`; provides RbacProvider, TenantProvider, SidebarProvider, CrmSidebar, CrmTopbar.
- **Constructor:** No layout; full-screen ConstructorPage with its own TopBar and panels.

### 2.4 Page Modules

Pages are grouped by domain: root-level (Index, AuthPage, CategoryPage, ProductPage, CartPage, FavoritesPage, BrandPage, BrandsListPage, SellerPage, SellersListPage); account/*; person/*; info/* (how-to-order, payment, delivery, returns, faq, sell, rules, commission, seller-help, about, contacts, careers, blog); constructor; admin/*; crm/*. Each is a default-export component; no route-based code-splitting.

### 2.5 Reusable Components

- **Business:** ProductCard (product, variant), ProductGrid (title, subtitle, initialCount — generates mock products internally), BrandLogo, SellersSection, InfoPageShared (PageHero, CtaBlock).
- **Sections:** Large set (Bestsellers, TrendingProducts, HotDeals, DailyDeals, PopularCategories, FeaturedCategories, CustomerReviews, quizzes, model showcase, etc.); most read from mock-data or marketplaceData.
- **Banners:** SplitProductBanner, VideoCarouselBanner, VideoHeroBanner, etc.
- **Constructor:** BlockLibrary, Canvas, SettingsPanel, TemplatesPanel, blockRenderer (maps block type → section component), blockRegistry (block definitions).

### 2.6 State Providers

- **App tree:** QueryClientProvider → AuthProvider → CartProvider → FavoritesProvider → TooltipProvider → BrowserRouter. Admin subtree: AdminAuthProvider. Person subtree: LoginPromptProvider (inside PersonLayout). CRM: RbacProvider, TenantProvider inside CrmLayout.
- **Responsibilities:** AuthProvider for customer login/register (mock); CartProvider/FavoritesProvider for cart and favorites (memory); AdminAuthProvider for admin JWT and 401 redirect; LoginPromptProvider for “require auth for this action” modal; Rbac/Tenant for CRM permission and tenant (mock or config-driven).

### 2.7 API Communication

- **Admin:** All admin and parser operations go through api.ts with Bearer token. React Query is used for parser status, dashboard, products list, etc.; mutations (parser start/stop, product update, etc.) use the same API modules. WebSocket (Laravel Echo, channel `parser`) invalidates React Query on parser events.
- **Public / Cabinet / CRM:** No API calls to the marketplace backend. Public API (menu, category products, product, seller, search, featured) is implemented in the client but **never used**; all data is from mock-data and marketplaceData.

---

## STEP 3 — ROUTING AND PAGE STRUCTURE

### 3.1 Full Routing Map by Domain

**Marketplace (public)**

| Path | Component | Layout | Guard | Purpose | Data source | API | Key components |
|------|-----------|--------|-------|---------|-------------|-----|----------------|
| `/` | Index | — | — | Homepage with many sections | mock-data, marketplaceData | None | Header, Footer, 50+ sections |
| `/auth` | AuthPage | — | — | Login/register/recovery | AuthContext (mock) | None | Form, social buttons |
| `/category/:slug` | CategoryPage | — | — | Category catalog, filters, sort | mockProducts, mockCategories | None | Header, Footer, ProductCard |
| `/product/:id` | ProductPage | — | — | Product detail, add to cart/favorite | mockProducts | None | Header, ProductCard, ReviewModal |
| `/cart` | CartPage | — | — | Cart list, totals, checkout CTA | CartContext | None | Header, Footer |
| `/favorites` | FavoritesPage | — | — | Favorites grid or login prompt | FavoritesContext | None | Header, ProductCard |
| `/brand` | BrandsListPage | — | — | Brand list | marketplaceData (brandsData) | None | Header, Footer |
| `/brand/:slug` | BrandPage | — | — | Brand page, products | brandsData, mockProducts | None | Header, ProductCard |
| `/seller` | SellersListPage | — | — | Seller list | marketplaceData (sellersData) | None | Header, Footer |
| `/seller/:id` | SellerPage | — | — | Seller page, products | sellersData, mockProducts | None | Header, ProductCard |

**User cabinet — Account**

| Path | Component | Layout | Guard | Purpose | Data source | API |
|------|-----------|--------|-------|---------|-------------|-----|
| `/account` | PersonalDataPage | AccountLayout | None | Personal data | mockUser | None |
| `/account/orders` | OrdersPage | AccountLayout | None | Order list | mockOrders | None |
| `/account/payment` | PaymentMethodsPage | AccountLayout | None | Payment methods | mock | None |
| `/account/balance` | BalancePage | AccountLayout | None | Balance, history | mockUser, mockBalanceHistory | None |
| `/account/favorites` | FavoritesPage | AccountLayout | None | Favorites (same as /favorites) | FavoritesContext | None |
| `/account/coupons` | CouponsPage | AccountLayout | None | Coupons | mockCoupons | None |
| `/account/receipts` | ReceiptsPage | AccountLayout | None | Receipts | mockReceipts | None |
| `/account/referral` | ReferralPage | AccountLayout | None | Referral program | mockUser | None |
| `/account/password` | ChangePasswordPage | AccountLayout | None | Change password | — | None |

**User cabinet — Person**

| Path | Component | Layout | Guard | Purpose | Data source | API |
|------|-----------|--------|-------|---------|-------------|-----|
| `/person`, `/person/dashboard` | PersonDashboard | PersonLayout | None | Dashboard overview | mockUser, mockOrders, mockProducts, mockCoupons | None |
| `/person/profile` | PersonProfile | PersonLayout | None | Profile | mockUser | None |
| `/person/orders` | PersonOrders | PersonLayout | None | Orders list | mockOrders | None |
| `/person/order/:id` | PersonOrderDetail | PersonLayout | None | Order detail | mockOrders | None |
| `/person/payments` | PersonPayments | PersonLayout | None | Payments | mock | None |
| `/person/password` | PersonPassword | PersonLayout | None | Password | — | None |
| `/person/returns` | PersonReturns | PersonLayout | None | Returns | mock | None |
| `/person/favorites` | PersonFavorites | PersonLayout | None | Favorites | mockProducts | None |
| `/person/viewed` | PersonRecentlyViewed | PersonLayout | None | Recently viewed | mockProducts | None |
| `/person/addresses` | PersonAddresses | PersonLayout | None | Addresses | mockUser | None |
| `/person/subscriptions` | PersonSubscriptions | PersonLayout | None | Subscriptions | mock | None |
| `/person/coupons` | PersonCoupons | PersonLayout | None | Coupons | mockCoupons | None |
| `/person/notifications` | PersonNotifications | PersonLayout | None | Notifications | mock | None |
| `/person/support` | PersonSupport | PersonLayout | None | Support | mock | None |
| `/person/security` | PersonSecurity | PersonLayout | None | Security | mock | None |
| `/person/settings` | PersonSettings | PersonLayout | None | Settings | mock | None |

**Information pages**

| Path | Component | Layout | Guard | Purpose |
|------|-----------|--------|-------|---------|
| `/how-to-order`, `/payment`, `/delivery`, `/returns`, `/faq`, `/sell`, `/rules`, `/commission`, `/seller-help`, `/about`, `/contacts`, `/careers`, `/blog` | Respective page | — | — | Static/content; use InfoPageShared or custom content |

**Constructor**

| Path | Component | Layout | Guard | Purpose | Data source |
|------|-----------|--------|-------|---------|-------------|
| `/constructor`, `/constructor/*` | ConstructorPage | — | — | Visual page builder | useConstructorStore (localStorage templates) |

**Admin**

| Path | Component | Layout | Guard | Purpose | API |
|------|-----------|--------|-------|---------|-----|
| `/admin/login` | AdminLoginPage | — | — | Admin login | authApi |
| `/admin` | DashboardPage | AdminLayout | AdminAuthGuard | Dashboard | dashboardApi, parserApi, systemApi, logsApi |
| `/admin/parser` | ParserPage | AdminLayout | AdminAuthGuard | Parser control, progress | parserApi, categoriesApi, logsApi |
| `/admin/products`, `/admin/products/:id` | ProductsPage, ProductDetailPage | AdminLayout | AdminAuthGuard | Products CRUD | productsApi, categoriesApi, sellersApi |
| `/admin/categories` | CategoriesPage | AdminLayout | AdminAuthGuard | Categories, reorder | categoriesApi, parserApi |
| `/admin/sellers`, `/admin/sellers/:id` | SellersPage, SellerDetailPage | AdminLayout | AdminAuthGuard | Sellers | sellersApi |
| `/admin/brands` | BrandsPage | AdminLayout | AdminAuthGuard | Brands | brandsApi, categoriesApi |
| `/admin/filters` | FiltersPage | AdminLayout | AdminAuthGuard | Filter config | filtersApi, categoriesApi |
| `/admin/excluded` | ExcludedPage | AdminLayout | AdminAuthGuard | Excluded rules | excludedApi |
| `/admin/logs` | LogsPage | AdminLayout | AdminAuthGuard | Logs | logsApi |
| `/admin/docs` | DocsPage | AdminLayout | AdminAuthGuard | Docs, system status | systemApi |
| `/admin/attribute-rules` | AttributeRulesPage | AdminLayout | AdminAuthGuard | Attribute rules | attributeRulesApi |
| `/admin/users`, `/admin/roles` | UsersPage, RolesPage | AdminLayout | AdminAuthGuard | Admin users/roles | adminUsersApi, adminRolesApi |
| `/admin/settings` | SettingsPage | AdminLayout | AdminAuthGuard | Settings | settingsApi |
| `/admin/ai`, `/admin/scheduler` | AiPage, SchedulerPage | AdminLayout | AdminAuthGuard | AI/Scheduler UI | Mock (admin mock-data) |

**CRM**

| Path | Component | Layout | Guard | Purpose | Data source |
|------|-----------|--------|-------|---------|-------------|
| `/crm`, `/crm/dashboard` | CrmDashboardPage | CrmLayout | None | CRM dashboard | crm mock-data |
| `/crm/content`, `/crm/notifications`, `/crm/products`, `/crm/products/:id`, `/crm/categories`, `/crm/moderation`, `/crm/moderation/:id`, `/crm/orders`, `/crm/orders/:id`, `/crm/fulfillment`, `/crm/delivery`, `/crm/regions`, `/crm/payments`, `/crm/payouts`, `/crm/promotions`, `/crm/coupons`, `/crm/marketing`, `/crm/templates`, `/crm/users`, `/crm/users/:id`, `/crm/sellers`, `/crm/sellers/:id`, `/crm/reviews`, `/crm/analytics`, `/crm/tenants`, `/crm/integrations`, `/crm/settings` | Respective CRM page | CrmLayout | Moderation, orders, finance, marketing, users, etc. | crm/data/mock-data.ts only |

**Catch-all:** `*` → NotFound.

### 3.2 Navigation

- **Links:** Header and Footer use React Router `Link` or `useNavigate` for in-app routes. Some components (e.g. ProductCard, CartPage) use `<a href>` leading to full reloads.
- **Guards:** Only Admin has a route guard (AdminAuthGuard); unauthenticated users are redirected to `/admin/login`. Account and Person have no redirect; Person uses LoginPromptProvider to show a modal when an action requires auth (e.g. copying order id). CRM has no route-level auth; visibility is via RBAC sidebar.
- **Deep linking:** All routes are directly reachable; no server-side routing (SPA).

---

## STEP 4 — MARKETPLACE BUSINESS MODEL

### 4.1 Entities

- **User (customer):** In frontend, UserProfile (name, email, phone, birthday, avatar, balance, referralCode, addresses, pvzAddresses). No backend customer entity in use; auth is mock.
- **Seller:** Parser-created; backend: id, slug, name, pavilion, status, is_verified, products_count, contacts. Frontend public pages use marketplaceData sellersData (id, name, slug, avatar, rating, reviewCount, productCount, etc.).
- **Product:** Backend: id, external_id, title, price, category_id, seller_id, brand_id, status, photos, attributes. Frontend mock: id, name, price, oldPrice, images, rating, reviews, seller (string), category (string), colors, sizes, etc.
- **Category:** Backend: tree (parent_id), slug, name, products_count, parser settings. Frontend: mockCategories (names), popularCategories (slug, name, count, image).
- **Brand:** Backend: id, name, slug, logo_url, category_ids. Frontend: brandsData (name, slug, logo, description, productCount, history, advantages, certificates).
- **Order:** Only in mock: id, date, status, total, discount, delivery, items (product, quantity, color, size), address, payment. No order API.
- **Cart:** In-memory list of { product, quantity, color, size }. No cart API.
- **Favorites:** In-memory list of Product. No favorites API.
- **Payments:** Mock (balance, payment methods); no payment API.
- **Coupons:** Mock list (code, discount, type, expiresAt, used). No coupon API.
- **Delivery:** Informational page only; no delivery API or calculation.
- **Reviews:** Shown on product page (mock list); no review API.

### 4.2 Relationships (as implemented and intended)

- **Seller → Products:** One-to-many. Backend: products.seller_id; frontend seller page shows mockProducts slice.
- **Category → Products:** One-to-many. Backend: products.category_id; frontend category page filters mockProducts by category name.
- **Brand → Products:** Backend: products.brand_id; frontend brand page uses mockProducts slice.
- **User → Orders:** Intended one-to-many; only mock orders in frontend.
- **Order → Payment / Delivery:** Intended; not implemented.
- **Product → Cart/Favorites:** Many-to-many via in-memory context; product is embedded in cart item.

### 4.3 Domain Model Diagram

```
                    ┌─────────────┐
                    │    User     │
                    │ (customer)  │
                    └──────┬──────┘
                           │ 1
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐      ┌──────────┐
   │  Orders  │      │   Cart   │      │ Favorites│
   │  (mock)  │      │ (memory) │      │ (memory) │
   └────┬─────┘      └────┬─────┘      └────┬─────┘
        │                 │                 │
        │ *               │ *               │ *
        ▼                 ▼                 ▼
   ┌─────────────────────────────────────────────┐
   │                  Product                     │
   │  (backend: API shape; frontend: mock shape)  │
   └──────────────────┬──────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐    ┌──────────┐   ┌─────────┐
   │Category│    │  Seller  │   │  Brand  │
   │(tree)  │    │(parser)  │   │         │
   └─────────┘    └──────────┘   └─────────┘

   Parser (donor) ──► Categories, Sellers, Products, product_photos, product_attributes
   Admin ──► CRUD on products, categories, sellers, brands; parser control
   CRM (mock) ──► Intended: orders, moderation, fulfillment, payments, payouts
```

---

## STEP 5 — USER FLOW

### 5.1 Intended Complete Journey

1. **Visit homepage** → Index renders many sections (categories, products, deals, quizzes). **Current:** All data from mock/marketplaceData. **Expected backend:** GET /public/menu, GET /public/featured or similar.
2. **Browse categories** → User clicks category → CategoryPage with slug. **Current:** mockProducts filtered by category name. **Expected:** GET /public/categories/:slug/products with pagination/filters.
3. **Open product** → ProductPage with id. **Current:** mockProducts.find(id). **Expected:** GET /public/products/:externalId.
4. **Add to cart** → CartContext.addToCart(product, color, size). **Current:** In-memory only. **Expected:** POST cart API or sync on login.
5. **Add to favorites** → FavoritesContext.toggleFavorite(product). **Current:** In-memory. **Expected:** POST/DELETE favorites API.
6. **Checkout** → CartPage shows items and “checkout” CTA. **Current:** No checkout; no order creation. **Expected:** Checkout page → POST order API, redirect to payment.
7. **Payment** → Not implemented. **Expected:** Payment gateway or internal payment API.
8. **Delivery** → Not implemented. **Expected:** Delivery options, tracking, status in order.
9. **Order history** → Person/Account orders pages. **Current:** mockOrders. **Expected:** GET orders API for current user.

### 5.2 Frontend Pages Involved

Home (Index) → Category (CategoryPage) → Product (ProductPage) → Cart (CartPage). Favorites (FavoritesPage) and Auth (AuthPage) are used along the way. Order history: PersonOrders, PersonOrderDetail, or Account OrdersPage (all mock). Checkout and payment pages do not exist.

### 5.3 Expected Backend APIs (for full flow)

- **Customer auth:** POST /auth/register, POST /auth/login, GET /auth/me, POST /auth/refresh (customer JWT or session).
- **Catalog:** GET /public/menu, GET /public/categories/:slug/products, GET /public/products/:id, GET /public/sellers/:slug, GET /public/search, GET /public/featured (already defined in backend; frontend does not call them).
- **Cart:** GET/POST/PATCH/DELETE /cart or /users/me/cart.
- **Favorites:** GET/POST/DELETE /favorites or /users/me/favorites.
- **Orders:** POST /orders (create from cart), GET /orders, GET /orders/:id.
- **Payment:** Depends on gateway (redirect or API).
- **User profile:** GET/PATCH /users/me, addresses, payment methods.

---

## STEP 6 — SELLER FLOW

### 6.1 Current Reality

There is **no seller self-service** in the system. Sellers and their products are **created by the parser** from the donor site. Sellers are managed in Admin (view, edit) and in CRM (mock UI for seller management). No seller registration, verification, or seller dashboard exists in the frontend or in the described backend.

### 6.2 Intended Seller Flow (for future)

1. **Seller registration** → Not implemented. Would require seller auth and onboarding API.
2. **Verification** → Would be CRM/Admin responsibility; CRM has mock moderation.
3. **Seller dashboard** → Not implemented. Would be a dedicated seller portal (not present).
4. **Create product** → Not implemented. Current products are parser-created only.
5. **Moderation** → CRM has CrmModerationPage (mock); intended to approve/reject products.
6. **Publish** → In Admin, products can be hidden/published via product update API; no workflow through CRM.
7. **Receive orders** → No order system; would require orders API and seller-scoped order list.
8. **Fulfill orders** → CRM has CrmFulfillmentPage (mock).
9. **Payouts** → CRM has CrmPayoutsPage (mock); no payout API.

### 6.3 Modules Involved

- **Marketplace:** Seller list and seller page are public; data is mock. Backend has public seller API.
- **Admin:** Sellers list and detail, seller products table; real API. No seller self-service.
- **CRM:** Sellers and seller detail pages (mock); intended for operational management and possibly payouts.
- **Orders/Payments:** Not implemented; would connect to seller payouts and fulfillment.

---

## STEP 7 — PARSER PIPELINE

### 7.1 End-to-End Pipeline

```
External donor (sadovodbaza.ru)
         │
         │ HTTP (Guzzle, rate-limited, optional proxy)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Parser (Laravel)                                                │
│  POST /api/v1/parser/start → ParserController::start              │
│  → Create ParserJob (DB)                                         │
│  → RunParserJob::dispatch(job_id) → Redis queue (default)         │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Queue worker (Supervisor: php artisan queue:work)                │
│  → RunParserJob::handle()                                        │
│  → DatabaseParserService::run(job)                                │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─ menu_only: MenuParser → CategorySyncService → categories
         ├─ category:  CatalogParser (listing) → ProductParser (detail)
         │             → SellerParser (seller page)
         │             → Excluded rules, AttributeExtraction, photos
         ├─ seller:    runSingleSeller(slug)
         └─ full:      menu_only + foreach category runSingleCategory
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Raw/normalized data saved to DB                                 │
│  categories, products, sellers, product_photos, product_attributes│
│  (Optional: DownloadPhotoJob → photos queue → local storage)     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Progress & events                                               │
│  parser_jobs updated; ParserProgressUpdated, ProductParsed,      │
│  ParserFinished / ParserError broadcast via Reverb               │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Catalog (MariaDB)                                               │
│  products (status: active/hidden/excluded/...), categories,      │
│  sellers, brands → exposed by /api/v1/public/*                    │
└─────────────────────────────────────────────────────────────────┘
```

**CRM moderation** in the diagram would sit between “Raw/normalized data saved” and “Catalog”: today products are written with status; a future flow could require “pending moderation” and CRM approve/reject before publishing. Currently there is no such gate; Admin can hide/publish products.

### 7.2 Parser Workers

- **Queue:** Redis, queue name `default` for RunParserJob. Separate `photos` queue for photo download jobs.
- **Supervisor:** Multiple workers (e.g. 4× parser-worker, 2× parser-worker-photos). Workers run `php artisan queue:work`.
- **Job:** RunParserJob loads ParserJob by id, instantiates DatabaseParserService, calls run(). On cancel (parser/stop), job status set to cancelled; worker checks isCancelled() and exits.

### 7.3 Moderation and Publishing

- **Current:** No formal moderation pipeline. Products are saved with status (active, hidden, excluded, error, pending). Admin can bulk or single update product status (hide/publish). Excluded rules are applied during parsing (text replacement/deletion/hide/flag).
- **CRM:** CrmModerationPage and CrmModerationDetailPage exist with mock data; intended for product/seller moderation but not wired to backend.

---

## STEP 8 — CRM SYSTEM

### 8.1 Responsibilities (Designed)

- **Product moderation:** Review and approve/reject products (CrmModerationPage, CrmModerationDetailPage).
- **Seller management:** List and detail sellers (CrmSellersPage, CrmSellerDetailPage).
- **Order management:** Orders list and detail (CrmOrdersPage, CrmOrderDetailPage).
- **Fulfillment:** CrmFulfillmentPage.
- **Delivery and regions:** CrmDeliveryPage, CrmRegionsPage.
- **Finance:** Payments (CrmPaymentsPage), Payouts (CrmPayoutsPage).
- **Customer support:** Implied by support/settings; no dedicated ticket UI in audit.
- **Analytics:** CrmAnalyticsPage (charts, mock).
- **Marketing:** Promotions (CrmPromotionsPage), Coupons (CrmCouponsPage), Marketing (CrmMarketingPage), Templates (CrmTemplatesPage).
- **Content and notifications:** CrmContentPage, CrmNotificationsPage.
- **Users and reviews:** CrmUsersPage, CrmUserDetailPage, CrmReviewsPage.
- **System:** Tenants (CrmTenantsPage), Integrations (CrmIntegrationsPage), Settings (CrmSettingsPage).

### 8.2 Pages and Components

- **Layout:** CrmLayout, CrmSidebar (permission-based nav), CrmTopbar; RbacProvider, TenantProvider.
- **Pages:** All under src/crm/pages; use shared components (StatCard, PageHeader, DataTable, StatusBadge, etc.) and data from src/crm/data/mock-data.ts (dashboardKpis, salesChartData, crmOrders, topProducts, crmUsers, crmSellers, crmProducts, crmCategories, crmReviews, crmPromotions, etc.).

### 8.3 Data Models (CRM Mock)

- CrmOrder, CrmUser, CrmSeller, CrmProduct, CrmCategory, CrmReview, CrmPromotion, etc. — all local TypeScript interfaces and mock arrays in crm/data/mock-data.ts.

### 8.4 Missing APIs

- **All CRM operations:** No backend is called. Every list, detail, and action is mock. To go production, backend would need: orders (list, detail, status update), users (list, detail), sellers (list, detail, possibly approve), products (moderation approve/reject), payments/payouts, promotions/coupons, analytics, tenants, integrations, settings.

---

## STEP 9 — ADMIN SYSTEM

### 9.1 Responsibilities

- **Parser control:** Start/stop/pause/restart, options (full, menu_only, category, seller; categories filter; products_per_category; save_photos; etc.), category sync, progress (SSE and WebSocket), diagnostics, failed jobs, queue clear, photo download. Implemented via parserApi and useParserChannel (Echo).
- **System monitoring:** Dashboard (dashboardApi), system status (systemApi), health (healthApi), logs (logsApi). Parser status and API health shown in AdminLayout header.
- **Catalog management:** Products (list, detail, update, delete, bulk hide/publish/delete) — productsApi. Categories (tree, reorder, update, parser link) — categoriesApi. Sellers (list, detail, products table) — sellersApi. Brands (CRUD) — brandsApi.
- **Category management:** categoriesApi list/get/update/reorder; parser category sync; linked_to_parser and parser limits per category.
- **Attribute rules:** attributeRulesApi (rules, synonyms, dictionary, canonical, facets, test, rebuild, audit). Used for normalizing product attributes.
- **Filters and excluded:** filtersApi (per-category filter config), excludedApi (text rules, test).
- **Logs:** logsApi list/clear; parser and app logs.
- **System settings:** settingsApi (key-value groups).
- **Admin users and roles:** adminUsersApi, adminRolesApi (CRUD). JWT auth; 401 → redirect to /admin/login.

### 9.2 Architecture

- **Auth:** AdminAuthProvider stores user and token (localStorage.admin_token). Login calls authApi.login; refresh uses authApi.me. setOnUnauthorized in api.ts calls logout on 401 when path starts with /admin.
- **Layout:** AdminLayout with collapsible AdminSidebar (links to dashboard, parser, products, categories, sellers, brands, filters, attribute-rules, ai, scheduler, excluded, logs, docs, users, roles, settings) and header (API health, parser status, user email, logout).
- **Data:** React Query for parser status, dashboard, and list/detail pages; mutations for start/stop, product update, etc. WebSocket keeps parser status in sync.

---

## STEP 10 — CONSTRUCTOR CMS

### 10.1 Architecture

- **Blocks:** Defined in blockRegistry: type, label, category (hero, products, categories, banners, video, gallery, lookbook, quiz, cta, text, social, navigation, footer), defaultSettings. Examples: HeroSlider, Bestsellers, PopularCategories, PromoBanner, ProductFinderQuiz, etc.
- **Layouts:** Current “layout” is the ordered list of blocks on the canvas. No notion of “page type” or “route” in the constructor; it is one canvas.
- **Templates:** User can save current blocks as a named template. Stored in localStorage under key `constructor_templates`. Load template replaces canvas blocks; delete removes from localStorage.
- **Canvas:** Renders blocks in order; supports drag reorder, select, duplicate, remove, visibility toggle. Drop from BlockLibrary adds a new block. Device mode (desktop/tablet/mobile) and preview mode (hide panels).
- **Renderer:** blockRenderer maps block type string to the same React section components used on the home page (e.g. Bestsellers, HeroWithSlider). Each block has settings (from defaultSettings and user edits in SettingsPanel).
- **Settings:** SettingsPanel shows selected block’s settings; changes update store; no persistence except via “Save as template.”

### 10.2 How Constructor Could Control Pages

- **Home page:** Backend could store “home layout” (array of block configs). Frontend Index would fetch this layout and render via the same blockRenderer instead of hardcoding sections. Constructor would have a “Edit home” mode that loads/saves this layout via API.
- **Category pages:** Optional “category layout” or “category template” per slug or default; category page would fetch and render blocks above/below the product grid.
- **Landing/promotional pages:** New routes (e.g. /promo/:slug) could resolve layout by slug from API and render constructor blocks. Constructor would have “Edit page” by slug.

### 10.3 Missing Backend Integration

- **No API for layouts:** Save/load is localStorage only. No multi-user or cross-device; no approval workflow; no A/B or scheduling.
- **No “publish”:** Constructor cannot assign a layout to a route or publish to production.

---

## STEP 11 — DATA FLOW

### 11.1 Products

- **Backend → Admin:** productsApi.list(filters) and productsApi.get(id) return backend Product/ProductFull. React Query caches; mutations (update, bulk) invalidate or refetch. Data flow: API → React Query → table/detail components.
- **Backend → Marketplace (intended):** publicApi.product(externalId) and publicApi.categoryProducts(slug) would return products. **Current:** No call; ProductPage and CategoryPage use mockProducts. Flow would be: API → (adapter or shared type) → ProductCard / ProductPage.
- **Parser → Backend:** DatabaseParserService writes products to DB; product_photos, product_attributes filled. No direct flow to frontend except via subsequent GET products or public API.

### 11.2 Categories

- **Backend → Admin:** categoriesApi.list(tree, search, enabled_only), get, update, reorder. Used in CategoriesPage, ParserPage (sync), FiltersPage, BrandsPage. Flow: API → React Query or state → UI.
- **Backend → Marketplace (intended):** publicApi.menu() returns categories for nav. **Current:** Not used; nav and category list use mock/marketplaceData.
- **Parser:** Category sync (menu_only or POST /parser/categories/sync) updates categories from donor menu.

### 11.3 Orders

- **Current:** No backend. Person and Account order pages read mockOrders from mock-data. No flow from API.
- **Intended:** POST order (from cart) → GET orders, GET order/:id → Order history and detail pages.

### 11.4 Users

- **Customer:** AuthContext holds mock user; no API. Intended: login/register/me → AuthContext or session.
- **Admin:** authApi.login → token; authApi.me on load → AdminAuthContext. Flow: API → context → layout (user email, logout).

### 11.5 Parser Status

- **Polling/SSE:** parserApi.status(), parserApi.progressOverview(jobId); parserApi.progressStream(jobId) for SSE. Admin uses React Query (refetch interval) and useParserChannel (Echo).
- **Flow:** Backend (job progress, events) → Reverb → Echo → useParserChannel invalidates React Query → ParserPage and header re-render with latest status.

---

## STEP 12 — STATE MANAGEMENT

### 12.1 AuthContext

- **Responsibility:** Customer “logged in” state and user profile for storefront and cabinets. login/register set isAuthenticated and user to mock data; logout clears. No API.
- **Limitation:** Not real auth; cannot persist session or permissions.

### 12.2 CartContext

- **Responsibility:** Cart items (product, quantity, color, size); add, remove, update quantity/color/size; totalItems, totalPrice, totalDiscount. Product type from mock-data.
- **Limitation:** In-memory only; lost on refresh; no sync with backend or user.

### 12.3 FavoritesContext

- **Responsibility:** List of favorite products; toggleFavorite, isFavorite, count. Product type from mock-data.
- **Limitation:** In-memory only; no persistence or API.

### 12.4 LoginPromptContext

- **Responsibility:** When an action requires auth, requireAuth(action) opens a modal and returns false if not authenticated; otherwise true. Used inside PersonLayout.
- **Limitation:** Does not enforce route guard; only prompts for specific actions.

### 12.5 AdminAuthContext

- **Responsibility:** Admin JWT: login (store token), me (refresh user), logout (clear token, redirect to /admin/login). Registers 401 callback with api.ts so any admin API 401 triggers logout.
- **Limitation:** Token in localStorage (XSS risk); no refresh token flow described.

### 12.6 RbacContext and TenantContext

- **Responsibility:** CRM permission checks (hasPermission, hasAnyPermission) for sidebar and features; tenant context for multi-tenancy. Used by CrmSidebar and potentially CRM pages.
- **Limitation:** No backend; permissions/tenants are likely config or mock.

### 12.7 Constructor Store (useConstructorStore)

- **Responsibility:** blocks, selectedBlockId, deviceMode, previewMode, templates; add/remove/move/duplicate/reorder blocks, update settings, undo/redo, save/load/delete template. Templates in localStorage.
- **Limitation:** No server; no collaboration or versioning.

---

## STEP 13 — API ARCHITECTURE

### 13.1 Endpoint Groups

**Public API (no auth)** — prefix `/api/v1/public`

- GET /menu — categories for nav
- GET /categories/:slug/products — category listing (pagination, filters)
- GET /products/:externalId — product detail
- GET /sellers/:slug — seller and products
- GET /search — search
- GET /featured — featured products

**Auth API** — prefix `/api/v1/auth`

- POST /login — admin (and possibly customer) login
- GET /me — current user (JWT)
- POST /refresh — refresh token

**Admin / Parser API (JWT)** — prefix `/api/v1`

- Dashboard: GET /dashboard
- Parser: GET /parser/status, /state, /health, /diagnostics, /stats, /progress, /progress-overview; POST /parser/start, /stop, /start-daemon, /stop-daemon, /pause, /restart, /queue-clear, /queue-flush, /clear-failed, /retry-job/:id, /kill-stuck, /release-lock, /reset; GET /parser/jobs, /parser/jobs/:id; POST /parser/photos/download, /parser/categories/sync; GET /parser/settings, POST /parser/settings
- Products: GET/PATCH/DELETE /products, POST /products/bulk
- Categories: GET/PATCH /categories, POST /categories/reorder, GET /categories/:id/filters
- Sellers: GET/PATCH /sellers, GET /sellers/:idOrSlug/products
- Brands: GET/POST/PUT/DELETE /brands
- Excluded: GET/POST/PUT/DELETE /excluded, POST /excluded/test
- Filters: GET/POST/PUT/DELETE /filters, GET /filters/:categoryId/values
- Logs: GET /logs, DELETE /logs/clear
- Settings: GET/PUT /settings, PUT /settings/:key
- Admin users/roles: GET/POST/PUT/DELETE /admin/users, /admin/roles
- Attribute rules: list/create/update/remove, test, rebuild, audit, synonyms, dictionary, canonical, facets
- System: GET /system/status

**Health / monitoring (no auth)**

- GET /up, /system/health, /ws-status (and similar)

### 13.2 Frontend–Backend Communication

- **Single client:** api.ts builds URL as BASE_URL + path; adds Authorization: Bearer &lt;token&gt; for non-public requests. 401 on admin path triggers setOnUnauthorized (logout). No separate “public” client; publicApi uses the same client with isPublic=true (no auth).
- **Unused APIs:** publicApi (menu, categoryProducts, product, seller, search, featured) is **never called** by any component. All storefront and cabinet data is mock.
- **CRM API:** There is no CRM-specific API group in the frontend; CRM uses only mock data.

---

## STEP 14 — PERFORMANCE ANALYSIS

### 14.1 Large Home Page

- **Issue:** Index.tsx imports and renders 50+ section components in one tree. No lazy loading of sections, no dynamic “above the fold” vs “below.”
- **Impact:** Large initial JS bundle and many components mounted at once; slower First Contentful Paint and Time to Interactive on slow devices.
- **Improvement:** Lazy-load sections (React.lazy + Suspense) or load sections by config (e.g. fetch “home layout” and render only listed blocks). Reduces initial bundle and work.

### 14.2 Too Many Sections

- **Issue:** Dozens of sections on one page; many use similar data (mockProducts slices) and similar patterns.
- **Impact:** Redundant work and risk of layout shift if sections load at different times if later refactored to async.
- **Improvement:** Reuse a single “product feed” or “section slot” component driven by config; limit number of sections or make them paginated/collapsible.

### 14.3 No Lazy Loading (Routes)

- **Issue:** All page components are synchronously imported in App.tsx. Admin, CRM, Constructor, and heavy info pages all in main chunk.
- **Impact:** Larger main bundle; slower initial load for users who only visit marketplace or only admin.
- **Improvement:** React.lazy for route components (e.g. Admin pages, CRM pages, Constructor, Person/Account) with Suspense and a loading fallback.

### 14.4 No Route Splitting

- **Issue:** Single entry and single route tree; no split by domain (e.g. marketplace vs admin vs CRM).
- **Impact:** One big bundle for all routes.
- **Improvement:** Route-based code-splitting so /admin/*, /crm/*, /constructor, /person/* load separate chunks.

### 14.5 Heavy Bundles

- **Issue:** Many sections, recharts (CRM), and all UI in one app. No tree-shaking audit or bundle analysis mentioned.
- **Impact:** Slow cold load, especially on mobile.
- **Improvement:** Lazy routes and sections; analyze bundle (e.g. Vite rollup report); remove or lazy-load heavy libs (e.g. recharts only for CRM analytics).

---

## STEP 15 — TECHNICAL DEBT

### 15.1 Duplicate Cabinets

- **Problem:** Two user cabinets, Account and Person, with overlapping features (orders, favorites, coupons, password). Both use mock data; Person has more sections and LoginPromptProvider.
- **Risk:** Confusion for users and developers; double maintenance; unclear which is canonical when backend is added.
- **Action:** Unify on one cabinet (e.g. Person), migrate Account-only features (balance, receipts, referral) into it, deprecate or redirect /account.

### 15.2 Mock Data Usage

- **Problem:** Public marketplace, both cabinets, and CRM rely entirely on mock data. publicApi is implemented but unused.
- **Risk:** Cannot launch real catalog or real orders; switching to API will require data shape alignment and testing.
- **Action:** Connect storefront to publicApi; introduce customer auth and order/cart/favorites APIs; replace mock in Account/Person; wire CRM to backend when APIs exist.

### 15.3 Unused APIs

- **Problem:** publicApi (menu, categoryProducts, product, seller, search, featured) is never called.
- **Risk:** Backend and frontend drift; missed bugs in public API; wasted code.
- **Action:** Use publicApi for home (menu, featured), category page, product page, seller page, search; remove or refactor mock for those flows.

### 15.4 Inconsistent Data Models

- **Problem:** Two Product types (API vs mock); Category and Seller similarly differ. Cart and Favorites use mock shape.
- **Risk:** Bugs when mapping; duplicate logic; harder refactor to real API.
- **Action:** Define a single “catalog” domain type or adapters API → UI; refactor Cart/Favorites to use it or a clear mapping layer.

### 15.5 Constructor Not Integrated

- **Problem:** Layouts only in localStorage; no backend; no control of home or other pages.
- **Risk:** Constructor remains a demo; cannot use for real content management.
- **Action:** Backend API for “page layouts” (e.g. by route or slug); frontend fetches and renders; Constructor saves/loads via API.

### 15.6 CRM Not Connected

- **Problem:** All CRM pages use mock data; no orders, users, sellers, or finance APIs.
- **Risk:** CRM is placeholder only; cannot operate marketplace operations.
- **Action:** Design and implement backend for orders, moderation, payments, payouts, etc.; wire CRM to those APIs.

### 15.7 Other

- **ProductCard vs FavoritesContext:** ProductCard keeps local isFavorite state; FavoritesContext also holds favorites. Inconsistent if both are shown for same product.
- **&lt;a href&gt; vs router:** Some links use &lt;a href&gt; (e.g. product link in ProductCard/CartPage), causing full reload; should use Link/useNavigate.
- **Admin token in localStorage:** XSS could steal token; consider httpOnly cookie for refresh or short-lived token + refresh endpoint.

---

## STEP 16 — SCALABILITY

### 16.1 10k Products

- **Backend:** Public API with pagination and filters can serve category and search; product detail by id is single row. Indexes on category_id, seller_id, status, parsed_at already in place. 10k is trivial.
- **Frontend:** Category and search pages would need to use API with pagination (e.g. 24 per page); infinite scroll or “load more” to avoid loading all. Current mock loads all products client-side; that would not scale.
- **Admin:** Product list already paginated and filtered via API; no change needed.

### 16.2 100k Products

- **Backend:** Same pagination; ensure indexes on filters (price, attributes). Search might need full-text or external search (e.g. Elasticsearch) if implemented. Photo storage and product_attributes table size (already 200k+ rows in audit) should be monitored.
- **Frontend:** Same as 10k; no “load all products.” Home “featured” and “bestsellers” should be small curated sets from API, not full scan.
- **Parser:** Long-running jobs; progress and cancellation already in place. Worker count and queue depth may need tuning.

### 16.3 1M Products

- **Backend:** DB and API must scale: read replicas, caching (e.g. Redis for hot categories/menu), search service. product_photos and product_attributes tables are large; partitioning or archiving may be needed.
- **Frontend:** No change in principle; always paginate and filter on server. Ensure no accidental “fetch all” in new features.
- **Parser:** Batch and priority queues; multiple workers; possible sharding by category or seller for very large runs.

### 16.4 Data Fetching Summary

- **Products:** Always paginated and filtered server-side for list views; single product by id for detail. Frontend must not assume “all products in memory.”
- **Categories/menu:** Small payload; cache in frontend or CDN.
- **Orders (future):** Paginated by user; detail by id.

---

## STEP 17 — ARCHITECTURAL RECOMMENDATIONS

### 17.1 Marketplace Architecture

- **Connect storefront to public API:** Use GET /public/menu for nav and possibly home; GET /public/categories/:slug/products for category page with pagination and filters; GET /public/products/:externalId for product page; GET /public/sellers/:slug for seller page; GET /public/search for search. Use external_id in product URLs for stability.
- **Single customer cabinet:** Choose Person (or Account) as the only cabinet; merge features; add real auth and redirect unauthenticated users to login where required.
- **Cart and favorites:** When backend supports it, persist cart and favorites per user (or anonymous session); hydrate CartContext and FavoritesContext from API on load; persist changes via API.

### 17.2 Catalog Architecture

- **Unify product/category/seller types:** Prefer API shape in a shared “catalog” layer; UI (including Cart/Favorites) uses that or a thin adapter. Avoid maintaining two parallel type systems.
- **Home and featured data:** Home should request limited data from API (menu, featured, maybe one or two category/product widgets) instead of hardcoded sections with mock data. Consider “home layout” from backend (see Constructor) so marketing can change blocks without code.

### 17.3 API Improvements

- **Customer auth:** Implement and use customer login/register/me/refresh; store token or session securely; use for cart/favorites/orders and cabinet.
- **Orders and checkout:** Design order creation (from cart), payment redirect or callback, and order history APIs; add checkout page and order success/history flows.
- **Public API usage:** Remove or refactor mock usage for catalog; ensure error handling and loading states when calling public API.

### 17.4 Constructor Integration

- **Layout API:** Backend endpoint to get/put “page layout” by key (e.g. home, category_default, promo/:slug). Constructor UI loads/saves that key; live pages fetch layout and render via blockRenderer.
- **Publish workflow:** Optional draft vs published layout; schedule or A/B later.

### 17.5 CRM Backend Integration

- **Order and fulfillment:** Orders API (list, detail, status) and fulfillment actions; CRM orders and fulfillment pages call them.
- **Moderation:** Product/seller moderation API (list pending, approve, reject); CRM moderation pages call them.
- **Finance:** Payments and payouts APIs; CRM payments and payouts pages call them.
- **Users and sellers:** User list/detail and seller list/detail from backend; replace CRM mock users/sellers.

### 17.6 Data Model Unification

- **Single source of truth for catalog:** API types as canonical; frontend maps or extends only for UI needs (e.g. display labels). Cart and Favorites should store product id (or external_id) and minimal server-validated data, not full mock object.

---

## STEP 18 — BACKEND QUESTIONS

The following need clarification or implementation to evolve the system into a full production marketplace:

1. **Customer authentication:** Is there (or will there be) a customer login/register/me/refresh API? Same JWT as admin or separate? Cookie vs Bearer? Session vs stateless?
2. **Orders:** Is there an order creation API (e.g. from cart)? List orders by user? Order detail and status? Payment callback or webhook?
3. **Cart:** Is there a cart API (get, add, update, remove) for authenticated or anonymous user? Keyed by user_id or session?
4. **Favorites:** Is there a favorites/list API (add, remove, list) for the logged-in user?
5. **User profile:** Are there endpoints for profile, addresses, payment methods, balance, receipts, referral, subscriptions? Used by Account/Person.
6. **Product URL:** Should public product URLs use internal id or external_id (e.g. /product/:externalId)? Affects routing and publicApi.product call.
7. **Public API stability:** Are GET /public/menu, /public/categories/:slug/products, /public/products/:externalId, /public/sellers/:slug, /public/search, /public/featured stable and documented? Pagination and filter contract?
8. **Moderation workflow:** Should new or updated products go through a “pending” status and CRM approval before visible on marketplace? If yes, backend support for status and approve/reject?
9. **Seller self-service:** Will sellers ever register and manage their own products/orders, or is the model always “parser + admin/CRM only”?
10. **Constructor layout API:** Is there or will there be an API to store and retrieve page layouts (e.g. by route or page key) for home, category, landing? Schema for blocks and settings?
11. **CRM APIs:** Which of orders, users, sellers, moderation, payments, payouts, promotions, analytics, tenants have or will have backend APIs? Permission model (roles/permissions) for CRM?
12. **Commission and payouts:** How are commission and seller payouts calculated and executed? Needed for CRM payouts and possibly seller statements.

---

*End of Marketplace System Architecture Audit.*

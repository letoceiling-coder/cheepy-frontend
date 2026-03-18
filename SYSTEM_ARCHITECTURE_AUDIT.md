# SYSTEM ARCHITECTURE AUDIT

**Project:** Cheepy / Online Parser  
**Audit Date:** 2026  
**Reference:** PROJECT_FULL_CONTEXT.md  

This document provides a high-level architectural overview of the two-repository system (cheepy-backend, cheepy-frontend). For deep dives see: BACKEND_DEEP_AUDIT.md, FRONTEND_DEEP_AUDIT.md, DATABASE_SCHEMA.md, API_DOCUMENTATION.md, PARSER_ARCHITECTURE.md, SYSTEM_IMPROVEMENT_PLAN.md.

---

## 1. System Overview

| Component | Repository | Technology | Domain (Production) |
|-----------|------------|------------|--------------------|
| **Backend API** | cheepy-backend | Laravel, PHP, MySQL, Redis | online-parser.siteaacess.store |
| **Frontend** | cheepy-frontend | React, Vite, TypeScript, Tailwind, shadcn/ui | siteaacess.store |

**Purpose:** Parse donor e-commerce site (sadovodbaza.ru), store data in MySQL, expose via REST API; React app provides Admin panel (parser control, CRUD) and Public marketplace (catalog, products, sellers).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Browser (Admin / Buyer)                                                     │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ HTTPS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Nginx                                                                       │
│  siteaacess.store         → /var/www/siteaacess.store/dist (static SPA)     │
│  online-parser...store   → /var/www/online-parser.../public (Laravel)        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                         ▼
┌─────────────────────┐                               ┌─────────────────────────┐
│  Frontend (React)   │                               │  Backend (Laravel)       │
│  • Admin panel      │  ─── REST API (JWT) ────────► │  • REST /api/v1         │
│  • Public store     │  ◄── JSON ─────────────────── │  • Parser orchestration  │
│  • CRM (mock)       │                               │  • Queue dispatch        │
└─────────────────────┘                               └────────────┬────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┼──────────────────────┐
                    ▼                    ▼                          ▼                      ▼
           ┌────────────────┐   ┌────────────────┐   ┌────────────────────┐   ┌────────────────┐
           │  MySQL         │   │  Redis         │   │  Supervisor         │   │  Reverb (WS)   │
           │  categories,   │   │  Queue, Cache  │   │  queue:work         │   │  parser channel│
           │  products,     │   │  optional      │   │  parser-worker_*    │   │  optional      │
           │  sellers, etc. │   │  session       │   │  reverb             │   │                │
           └────────────────┘   └───────┬────────┘   └─────────┬──────────┘   └────────────────┘
                                        │                       │
                                        ▼                       ▼
                               ┌────────────────────────────────────────┐
                               │  RunParserJob → DatabaseParserService   │
                               │  MenuParser, CatalogParser,            │
                               │  ProductParser, SellerParser            │
                               └────────────────────┬───────────────────┘
                                                    │ HTTP
                                                    ▼
                               ┌────────────────────────────────────────┐
                               │  Donor: sadovodbaza.ru                  │
                               └────────────────────────────────────────┘
```

---

## 3. Component Responsibilities

### 3.1 Backend (Laravel)

- **REST API** under `/api/v1`: auth, parser control, categories, products, sellers, brands, filters, logs, settings, attribute rules/dictionary/canonical/facets, public endpoints (menu, category products, product, seller, search, featured).
- **Parser engine:** MenuParser (categories from donor menu), CategorySyncService (sync categories to DB), DatabaseParserService (orchestrates full/category/seller runs), CatalogParser, ProductParser, SellerParser. Heavy work runs inside `RunParserJob` (Redis queue).
- **Queue:** Redis driver; `RunParserJob` on `default` queue; workers via Supervisor (`parser-worker_00` … `parser-worker_03`).
- **Auth:** JWT (Firebase JWT, HS256); secret from `config('jwt.secret')`; admin users in `admin_users` table.
- **Real-time (optional):** Laravel Reverb WebSocket; public channel `parser` for ParserStarted, ParserProgressUpdated, ProductParsed, ParserFinished, ParserError.

### 3.2 Frontend (React)

- **Admin panel** (`/admin/*`): JWT login, dashboard, parser (start/stop/progress), categories, products, sellers, brands, filters, attribute rules/dictionary/canonical/audit, AI module, scheduler, excluded rules, logs, docs, users, roles, settings. Uses React Query + api.ts (BASE_URL → backend).
- **Public marketplace** (`/`, `/category/:slug`, `/product/:id`, `/seller/:id`, `/brand/:slug`, `/cart`, `/favorites`, `/account/*`): Fetches data via public API (no JWT).
- **CRM** (`/crm/*`): Separate layout with mock/placeholder pages (tenants, users, orders, moderation, etc.).
- **State:** React Query (server state), Context (Auth, Cart, Favorites, AdminAuth), local component state.

### 3.3 Data Flow (Simplified)

1. **Parser start:** Admin clicks Start → Frontend `POST /api/v1/parser/start` → Backend creates `ParserJob`, dispatches `RunParserJob` → Worker runs `DatabaseParserService::run()` → MenuParser → categories; CatalogParser/ProductParser/SellerParser → products/sellers/attributes/photos → MySQL. Progress in `parser_jobs`; optional Reverb events.
2. **Public catalog:** User opens `/category/:slug` → Frontend `GET /api/v1/public/categories/{slug}/products` → Backend returns products + filters from MySQL.
3. **Admin CRUD:** All admin mutations go to `/api/v1/*` with `Authorization: Bearer <token>`.

---

## 4. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Two repositories | Clear separation: API vs UI; independent deploy and versioning. |
| Parser in queue | Avoid HTTP timeouts; allow stop/progress; scale workers. |
| JWT for admin | Stateless auth; token in localStorage; refresh endpoint. |
| MenuParser as single category source | Donor menu (#menu-catalog) is authoritative; no ad-hoc category scraping. |
| Attribute rules in DB | attribute_rules, attribute_synonyms, attribute_value_normalization, attribute_dictionary in DB so rules can be changed without code deploy. |
| Public API unauthenticated | Menu, category products, product, seller, search, featured are public for storefront. |

---

## 5. Deployment Model

- **Local:** Development in two repos (e.g. cheepy-backend, cheepy-frontend / sadavod-laravel, cheepy). No production edits on server.
- **Server:** Single host; Nginx; PHP-FPM (Laravel); Node used only for `npm run build`. Supervisor runs queue workers and Reverb.
- **Deploy:** Push to GitHub → run deploy script on server (e.g. `bash /var/www/deploy.sh`): backend `git pull`, `composer install`, `migrate`, cache clear, queue restart; frontend `git pull`, `npm run build`; `supervisorctl restart all`; `systemctl reload nginx`.

---

## 6. Related Documents

- **BACKEND_DEEP_AUDIT.md** — Laravel app structure, Http, Services, Jobs, Models, Events, Middleware, Providers.
- **FRONTEND_DEEP_AUDIT.md** — React src layout, components, pages, hooks, API client, state, Reverb integration.
- **DATABASE_SCHEMA.md** — All tables, columns, indexes, foreign keys, ER description.
- **API_DOCUMENTATION.md** — All endpoints by module (Auth, Parser, Categories, Products, Sellers, Admin, Public, System).
- **PARSER_ARCHITECTURE.md** — Parser flow, parsers, job dispatch, queue, storage, flow diagram.
- **SYSTEM_IMPROVEMENT_PLAN.md** — Current status, risks, recommended improvements.

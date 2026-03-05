# INTEGRATION_FLOW — Data Flow Between Systems

---

## 1. Current Architecture (As Deployed)

```
┌─────────────────────────────────────────────────────────────────┐
│  siteaacess.store (React SPA)                                    │
│  - Public pages: /, /category/:slug, /product/:id, etc.          │
│  - Admin: /admin, /admin/parser, /admin/products, ...            │
│  - Static files only — no backend                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ VITE_API_URL (must be set at build)
                        │ Currently: default 'http://sadavod.loc/api/v1'
                        │ Should be: https://online-parser.siteaacess.store/api/v1
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  online-parser.siteaacess.store (Laravel)                        │
│  - REST API: /api/v1/*                                           │
│  - Web catalog: /, /product/{id}                                 │
│  - Single backend + DB                                           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTP to sadovodbaza.ru
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  sadovodbaza.ru (external source)                                │
│  - HTML parsing                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow Diagram

```
                    Admin Panel (siteaacess.store/admin)
                    ───────────────────────────────────
                    │ ParserPage: MOCK — no API calls  │
                    │ Dashboard: would call /dashboard │
                    │ Products: would call /products   │
                    │ Categories: would call /categories
                    └──────────────┬───────────────────┘
                                   │ (intended, not wired)
                                   ▼
                    Parser API (online-parser.siteaacess.store)
                    ─────────────────────────────────────────
                    │ POST /parser/start → create job         │
                    │ GET /parser/status → job status         │
                    │ GET /parser/progress → SSE stream       │
                    │ GET /products, /categories, etc.        │
                    └──────────────┬──────────────────────────┘
                                   │
                                   ▼
                    Database (sadavod_parser)
                    ───────────────────────
                    │ parser_jobs, parser_logs                │
                    │ products, product_photos, product_attributes
                    │ categories, sellers, brands             │
                    │ excluded_rules, filters_config          │
                    └─────────────────────────────────────────┘
                                   ▲
                                   │ INSERT/UPDATE
                                   │
                    Parser Service (DatabaseParserService)
                    ─────────────────────────────────────
                    │ Parses sadovodbaza.ru                 │
                    │ Saves categories, products, sellers   │
                    │ Downloads photos to storage/app/photos│
                    └───────────────────────────────────────┘
```

---

## 3. How Parsed Data Enters Admin System

**Intended flow:**
1. Admin calls `POST /api/v1/parser/start` with options
2. Parser runs in background, writes to `sadavod_parser` DB
3. Admin calls `GET /api/v1/products`, `/categories`, etc. — same DB
4. Admin and public API share the same data

**Actual flow:**
- Admin ParserPage does NOT call API — uses mock data
- Public pages (e.g. siteaacess.store/category/electronics) would call `/public/categories/electronics/products` — **from parser API**
- Admin products/categories pages: api.ts has methods but pages may use mock — need verification

---

## 4. Which Endpoints Are Used

| Admin page | Should call | Actually calls |
|------------|-------------|----------------|
| /admin/parser | /parser/status, start, stop, progress | **Mock only** |
| /admin/products | /products | **Mock only** |
| /admin/product/:id | /products/{id} | **Mock only** |
| /admin/categories | /categories | **Mock only** |
| /admin/dashboard | /dashboard | **Mock only** |
| /admin/brands | /brands | **Mock only** |
| /admin/filters | /filters | **Mock only** |
| /admin/excluded | /excluded | **Mock only** |
| /admin/logs | /logs | **Mock only** |
| /admin/scheduler | — | **Mock only** |
| /admin/settings | /settings | **Mock only** |
| /admin/ai | — | **Mock only** |
| /admin/roles | — | **Mock only** |
| Public category | /public/categories/{slug}/products | Yes (if VITE_API_URL set) |
| Public product | /public/products/{id} | Yes (if VITE_API_URL set) |

**All admin pages use mock data.** The `api.ts` client has full API methods defined but they are not used in any admin component.

---

## 5. Tables Receiving Parsed Data

| Table | Populated by |
|-------|--------------|
| categories | MenuParser, CatalogParser |
| products | ProductParser |
| product_photos | ProductParser (URLs), PhotoDownloadService (local paths) |
| product_attributes | ProductParser |
| sellers | SellerParser |
| parser_jobs | ParserController |
| parser_logs | DatabaseParserService |

---

## 6. Duplicate Handling

- **Products**: `updateOrCreate` by `external_id` (unique)
- **Categories**: `updateOrCreate` by `external_slug`
- **Sellers**: `updateOrCreate` by `slug` (from source URL)
- No global deduplication — per-entity unique keys

---

## 7. Integration Points

| Component | Integration | Status |
|-----------|-------------|--------|
| CORS | Parser allows FRONTEND_URL | Must add https://siteaacess.store |
| VITE_API_URL | Admin build | Must set for production |
| Auth | Admin login → JWT | Uses admin_users (Laravel) |
| api.siteaacess.store | Proxy to parser? | Placeholder, not used |
| photos.siteaacess.store | Photo CDN | Not configured; parser stores locally |

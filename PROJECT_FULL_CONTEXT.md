# Project Full Context — Cheepy / Online Parser

**Purpose:** Onboarding document and context preservation for developers. Use this file to understand the system, continue work in a new chat, or onboard new team members.

---

## SECTION 1 — PROJECT OVERVIEW

### Purpose of the System

The system is a **parser and marketplace frontend** that:

1. **Parses** a donor e-commerce site (sadovodbaza.ru), extracting categories, products, sellers, and images.
2. **Stores** parsed data in a MySQL database.
3. **Exposes** data via a Laravel API for an admin panel and a public storefront.
4. **Allows** admins to control the parser, manage categories/products/sellers, and monitor system health.

### Main Functionality

- **Parser engine:** Fetches donor HTML, extracts categories from `#menu-catalog` (or `#menu-main` fallback), parses catalog pages for product listings, product detail pages for attributes/photos, and seller pages. Data is saved to MySQL; heavy work runs in Redis queue workers.
- **Admin panel:** JWT-authenticated React SPA for parser control, categories, products, sellers, brands, filters, logs, docs, users/roles, settings. Hosted at **siteaacess.store** (e.g. `/admin`, `/admin/parser`, `/admin/categories`).
- **Public frontend:** React SPA for buyers: catalog by category, product pages, sellers, favorites, cart, account. Same domain **siteaacess.store** (e.g. `/`, `/category/:slug`, `/product/:id`).
- **API:** Laravel backend at **online-parser.siteaacess.store** provides REST API (v1 prefix): auth, parser control, categories sync, products, sellers, public menu/products, system status, WebSocket status.

### Donor Site

- **URL:** https://sadovodbaza.ru (configurable via `SADAVOD_DONOR_URL`).
- **Role:** Source of categories (HTML menu), catalog listings, product details, seller pages, and images. Parsing is read-only HTTP; no authentication to donor.

### Domains and Roles

| Domain | Role |
|--------|------|
| **online-parser.siteaacess.store** | Backend API (Laravel). Parser logic, DB, Redis queue, Reverb WebSocket. |
| **siteaacess.store** | Frontend (React). Public store + Admin panel. Served as static build from `dist/`. |

---

## SECTION 2 — SYSTEM ARCHITECTURE

### Components

| Component | Technology | Purpose |
|-----------|------------|--------|
| **Frontend** | React, Vite, TypeScript | Public UI + Admin panel. Build output in `dist/`. |
| **Backend (API)** | Laravel, PHP | REST API, parser orchestration, auth (JWT), category sync. |
| **Database** | MySQL | Categories, products, sellers, brands, parser_jobs, users, etc. |
| **Redis** | Redis | Queue driver, cache, sessions (optional). |
| **Queue workers** | Laravel Queue (Redis) | Run parser jobs (`RunParserJob`), photo download jobs. |
| **Parser engine** | In-process (DatabaseParserService) | MenuParser, CatalogParser, ProductParser, SellerParser. Runs inside a queue job. |
| **WebSocket** | Laravel Reverb | Real-time parser progress/status to admin (if used). |

### How Components Interact

1. **Admin** opens siteaacess.store/admin → React app loads.
2. **Frontend** calls API at online-parser.siteaacess.store (e.g. login, parser/start, categories, system/status).
3. **Parser start:** API creates `ParserJob`, dispatches `RunParserJob` to Redis queue.
4. **Worker** (Supervisor) runs `php artisan queue:work`, picks up job, runs `DatabaseParserService`.
5. **DatabaseParserService** uses MenuParser → categories, CatalogParser → product list, ProductParser → detail, SellerParser → seller; saves to MySQL; may dispatch photo download jobs.
6. **Admin** can poll progress/status or use WebSocket (Reverb) if implemented.
7. **Public** site reads data via public API (menu, products, etc.) and displays it.

### Architecture Diagram (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (User / Admin)                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Nginx                                                            │
│  siteaacess.store → dist/ (static)                                │
│  online-parser.siteaacess.store → Laravel public/                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────────────┐
│  Frontend (React)    │               │  Backend (Laravel)           │
│  dist/               │               │  API, Parser orchestration   │
└─────────────────────┘               └──────────────┬──────────────┘
                                                      │
                     ┌────────────────────────────────┼────────────────────────────────┐
                     ▼                                ▼                                ▼
            ┌────────────────┐              ┌────────────────┐              ┌────────────────┐
            │  MySQL          │              │  Redis (Queue)  │              │  Reverb (WS)   │
            │  categories,    │              │  default queue  │              │  optional       │
            │  products, etc. │              └────────┬───────┘              └────────────────┘
            └────────────────┘                       │
                                                     ▼
                                            ┌────────────────┐
                                            │  Supervisor    │
                                            │  queue:work    │
                                            │  (parser-job)  │
                                            └────────┬───────┘
                                                     │
                                                     ▼
                                            ┌────────────────┐
                                            │  Parser        │
                                            │  MenuParser,   │
                                            │  CatalogParser,│
                                            │  ProductParser │
                                            └────────────────┘
                                                     │
                                                     ▼
                                            Donor: sadovodbaza.ru
```

---

## SECTION 3 — PROJECT REPOSITORIES

The system is split into **two Git repositories**. Development is done locally in each repo; the server only pulls and builds.

### 1. Backend — cheepy-backend

| Item | Value |
|------|--------|
| **Repository** | https://github.com/letoceiling-coder/cheepy-backend |
| **Technology** | Laravel, PHP, MySQL, Redis, Composer |
| **Server path** | `/var/www/online-parser.siteaacess.store` |
| **Domain** | https://online-parser.siteaacess.store |

**Responsibilities:**

- REST API under `/api/v1` (auth, parser, categories, products, sellers, public endpoints, system status).
- Parser: MenuParser, CategorySyncService, DatabaseParserService, RunParserJob, photo jobs.
- Queue: Redis driver; jobs run via `php artisan queue:work`.
- Auth: JWT (config `jwt.secret`); admin login at `POST /api/v1/auth/login`.
- Config: `config/sadovod.php`, `config/jwt.php`, `.env` (never committed).

**Local path (example):** `C:\OSPanel\domains\sadavod-laravel` or clone of cheepy-backend.

### 2. Frontend — cheepy-frontend

| Item | Value |
|------|--------|
| **Repository** | https://github.com/letoceiling-coder/cheepy-frontend |
| **Technology** | React, Vite, TypeScript, Tailwind, shadcn/ui |
| **Server path** | `/var/www/siteaacess.store` |
| **Domain** | https://siteaacess.store |

**Responsibilities:**

- Public site: home, categories, products, sellers, cart, favorites, account.
- Admin panel: login, dashboard, parser, categories (with sync), products, sellers, brands, filters, logs, docs, users, roles, settings.
- Build: `npm run build` → `dist/`; Nginx serves `dist/` for siteaacess.store.
- API base URL: points to `online-parser.siteaacess.store` (e.g. via `VITE_API_URL` in production).

**Local path (example):** `C:\OSPanel\domains\cheepy` or clone of cheepy-frontend.

---

## SECTION 4 — SERVER ENVIRONMENT

### Server Access

- **SSH:** `ssh root@85.117.235.93`
- Deploy is done by running the deploy script on the server (after push from local).

### Installed Services

| Service | Purpose |
|---------|--------|
| **Nginx** | Reverse proxy: siteaacess.store → frontend `dist/`; online-parser.siteaacess.store → Laravel `public/`. |
| **PHP** | Runs Laravel (PHP-FPM). |
| **Redis** | Queue backend and optional cache/session. |
| **Supervisor** | Manages queue workers and Reverb. Restart: `supervisorctl restart all`. |
| **Node / npm** | Used only during deploy to build frontend (`npm run build`). |
| **Composer** | Backend dependencies during deploy (`composer install --no-dev`). |

### Important Paths on Server

- Backend: `/var/www/online-parser.siteaacess.store` (Laravel root).
- Frontend: `/var/www/siteaacess.store` (React app; Nginx document root = `.../dist`).
- Deploy script: `/var/www/deploy.sh` (can be updated by copying from frontend repo `scripts/deploy.sh`).

---

## SECTION 5 — QUEUE SYSTEM

### Queue Driver

- **Driver:** Redis (`QUEUE_CONNECTION=redis` in backend `.env`).
- **Default queue:** `default`. Parser job and other queued work use this queue.

### Workers (Supervisor)

Workers are managed by **Supervisor**; configs are typically under `/etc/supervisor/conf.d/`. After changing code or config, run:

```bash
supervisorctl restart all
```

| Worker / Process | Purpose |
|------------------|--------|
| **parser-worker** (e.g. parser-worker_00 … parser-worker_03) | Runs `php artisan queue:work`. Picks up `RunParserJob` and executes `DatabaseParserService` (menu, categories, products, sellers). |
| **parser-worker-photos** (e.g. parser-worker-photos_00, 01) | Runs queue workers for photo download jobs (if used). |
| **reverb** | Laravel Reverb WebSocket server for real-time updates (e.g. parser progress). |

### Important Commands

- Restart queue workers (after code deploy): `php artisan queue:restart` (run from backend root on server).
- Restart all supervised processes: `supervisorctl restart all`.
- Check status: `supervisorctl status`.

---

## SECTION 6 — PARSER ARCHITECTURE

### Flow Overview

1. **Start:** Admin calls `POST /api/v1/parser/start` (with optional type and options). API creates a `ParserJob` (status `pending`) and dispatches `RunParserJob` to the queue.
2. **Worker:** A queue worker runs `RunParserJob`, which instantiates `DatabaseParserService` with the job and calls `run()`.
3. **Job type** determines behavior:
   - `menu_only`: Only sync categories from donor menu (MenuParser → saveCategoriesFlat).
   - `category`: Parse a single category (slug in options).
   - `seller`: Parse a single seller.
   - `full` (default): Run menu_only, then iterate enabled categories and parse catalog pages and products.
4. **Category sync (menu_only):** MenuParser loads donor homepage, finds `#menu-catalog` (or `#menu-main`), extracts `.menu-item` → top category and `.sub-menu-wrap a.sub-category` → children; returns flat list `[{ name, slug, url, parent_slug }]`. Categories are saved with `parent_id`, `url`, `sort_order`.
5. **Full run:** For each category, CatalogParser fetches catalog pages, extracts product links; ProductParser fetches each product page (title, price, attributes, photos, seller link); SellerParser fetches seller page. Data is written to `products`, `sellers`, `product_photos`, etc. Photo download can be queued to photo workers.
6. **Progress:** Job state (status, current_category_slug, parsed_products, etc.) is stored in `parser_jobs` and can be broadcast via Reverb; admin can poll `GET /api/v1/parser/progress` or use WebSocket.
7. **Stop:** Admin calls `POST /api/v1/parser/stop`; job status is set to `cancelled`; worker checks `isCancelled()` and exits when safe.

### Parsers (Backend)

| Class | Role |
|-------|------|
| **MenuParser** | Fetches donor homepage; extracts categories from `#menu-catalog` (fallback `#menu-main`). Returns flat list with `parent_slug`. |
| **CategorySyncService** | Uses MenuParser; deduplicates; sorts by parent; updates `categories` (parent_id, url, sort_order). Used by `POST /api/v1/parser/categories/sync` and by runMenuOnly. |
| **DatabaseParserService** | Orchestrates run: runMenuOnly (MenuParser + saveCategoriesFlat), runFull (menu + per-category parsing), runSingleCategory, runSingleSeller. Uses CatalogParser, ProductParser, SellerParser. |
| **CatalogParser** | Parses donor catalog listing pages (product links, pagination). |
| **ProductParser** | Parses product detail page (title, price, attributes, images, seller link). |
| **SellerParser** | Parses seller page (name, contacts, etc.). |
| **PhotoDownloadService** | Downloads product images; can be queued to separate workers. |

### Parser Jobs and Queue

- **RunParserJob:** Single queue job per parser run. `parserJobId` → load `ParserJob`, run `DatabaseParserService::run()`. Timeout 3600s; tries 3 with backoff.
- **ParserJob model:** Stores type, options, status, progress fields (current_category_slug, saved_products, errors_count, etc.), started_at, finished_at.
- No direct scraping on API request; all heavy work is in the queue to avoid timeouts and to allow progress/stop.

---

## SECTION 7 — CATEGORY SYSTEM

### Source of Categories

- **MenuParser** is the single source of category structure from the donor. It loads the donor homepage and extracts from the HTML menu (`#menu-catalog` or `#menu-main`). It does **not** parse categories from arbitrary HTML elsewhere.
- **CategorySyncService** uses **only** MenuParser (no separate donor HTML scraping). It receives the flat list from `MenuParser::parse()['categories']`, deduplicates by slug, sorts so parents come before children, then creates/updates rows in `categories`.

### Categories Table

- **Table:** `categories`. Main fields: `name`, `slug`, `external_slug`, `url`, `parent_id`, `sort_order`, `enabled`, `products_count`, etc.
- **Sync:** Updates/inserts by `external_slug` or `slug`; sets `parent_id` from parent_slug mapping, `url` (donor link), `sort_order`. Does not delete categories that have products.

### Sync Method

- **Endpoint:** `POST /api/v1/parser/categories/sync`
- **Auth:** JWT required (same as other admin API).
- **Effect:** Calls `CategorySyncService::sync()` → MenuParser → normalize → upsert categories → rebuild `products_count`.
- **Response:** `created`, `updated`, `last_synced_at`.

### runMenuOnly Parser Mode

- **Type:** `menu_only`. Used when starting a job with `type: 'menu_only'` or when running “only menu” from admin.
- **Behavior:** Same as category sync: MenuParser parses donor menu, returns flat list; `DatabaseParserService::saveCategoriesFlat()` writes to `categories` (parent_id, url, sort_order). No product parsing.

---

## SECTION 8 — DEPLOYMENT WORKFLOW

### Rule: No Direct Edits on Server

- **All development is done locally** in the two repositories. The server is updated **only** by pull + build via the deploy script.
- **Do not edit production code directly on the server** for normal development. Any such change will be **overwritten** on the next deploy (see below).

### Correct Workflow

1. **Make code changes** locally in the appropriate repo (cheepy-backend or cheepy-frontend).
2. **Commit** changes: `git add ... && git commit -m "..."`.
3. **Push** to GitHub: `git push origin main`.
4. **Run deploy on server:**  
   `ssh root@85.117.235.93 "bash /var/www/deploy.sh"`

### What deploy.sh Does

- **Backend** (`/var/www/online-parser.siteaacess.store`):
  - `git fetch origin` and `git reset --hard origin/main` (so server matches GitHub; **uncommitted server changes are lost**).
  - Ensures `JWT_SECRET` in `.env` exists and is at least 32 characters (generates if missing).
  - `composer install --no-dev --optimize-autoloader`
  - `php artisan migrate --force`
  - `php artisan optimize:clear` then `config:cache`, `cache:clear`, `route:clear`
  - `php artisan queue:restart`
  - Fixes permissions on `storage` and `bootstrap/cache`.
- **Frontend** (`/var/www/siteaacess.store`):
  - `git fetch origin` and `git reset --hard origin/main`
  - `npm install` and `npm run build` (output to `dist/`).
- **Services:** `supervisorctl restart all`, `systemctl reload nginx`.

### Risk of Editing on Server

- Any file that is tracked by Git and is edited only on the server will be **reverted** to the last committed state on GitHub when deploy runs `git reset --hard origin/main`. Only `.env` and other untracked/unignored files survive. So: **always commit and push from local**, then deploy.

---

## SECTION 9 — SSH DEVELOPMENT

- **Cursor (or other tools)** may sometimes open/edit files on the server via SSH for **debugging or hotfixes**. This is acceptable only for short-lived fixes.
- **Rule:** Any change that must persist **must** be committed and pushed from a repo (usually after copying the fix back to local). Otherwise the next deploy will overwrite it.
- **Recommendation:** Prefer local edit → commit → push → deploy. Use server edits only when necessary, and immediately bring changes back to the repo.

---

## SECTION 10 — MONITORING

### System Status Endpoint

- **URL:** `GET /api/v1/system/status` (no auth required in current setup; may be under a public or monitoring route).
- **Returns:** Parser status (running/pending), queue workers count, queue size, Redis status, Reverb (WebSocket) status, products total/today, errors today, last parser run, CPU load, memory usage, timestamp, and any parser metrics from `ParserMetricsService`.

### Metrics Exposed

- Parser: running, last run, products total/today, errors today.
- Queue: worker count, queue size.
- Infrastructure: Redis, WebSocket (Reverb), CPU, memory.
- Admin panel can call this endpoint to show system health and parser status.

---

## SECTION 11 — IMPORTANT RULES

1. **Never modify production code on the server** for normal development; use local repo → commit → push → deploy.
2. **Always push to GitHub before running deploy** so that `git reset --hard origin/main` brings the latest code to the server.
3. **Do not parse donor categories from arbitrary HTML** when a MenuParser-based flow exists. Use **MenuParser** (and CategorySyncService) as the single source for category structure.
4. **Use queue workers for heavy work** (parser run, photo downloads). Do not run full parser in a synchronous HTTP request.
5. **JWT:** Backend uses `config('jwt.secret')` (from `config/jwt.php`), not `env('JWT_SECRET')` directly, so that config cache works. Ensure `JWT_SECRET` is set in `.env` and at least 32 characters.
6. **Deploy script:** Keep `/var/www/deploy.sh` in sync with the version in the frontend repo (`scripts/deploy.sh`) when you change the workflow; copy it to the server if needed.

---

## SECTION 12 — CURRENT PROJECT STATUS

- **Category sync** refactored to use **MenuParser** with `#menu-catalog` (fallback `#menu-main`); flat list with `parent_slug`; CategorySyncService deduplicates and sets parent_id, url, sort_order. Sync endpoint: `POST /api/v1/parser/categories/sync`.
- **Admin documentation** implemented (e.g. Docs page in admin).
- **Parser monitoring:** System status endpoint and parser progress/status APIs available; admin can start/stop parser and see status.
- **JWT:** Auth uses `config('jwt.secret')` for config:cache compatibility; deploy script ensures JWT_SECRET length.
- **Deploy:** Single script updates both backend and frontend, restarts workers and Nginx.

---

## SECTION 13 — KNOWN RISKS

| Risk | Mitigation |
|------|-------------|
| **Server edits without commit** | Deploy overwrites them. Always commit and push from local. |
| **Deploy overwriting changes** | Intentional: server must match Git. Do not rely on server-only edits. |
| **Donor HTML structure change** | MenuParser/CatalogParser/ProductParser may break. Monitor; adjust selectors (e.g. #menu-catalog, .menu-item, .sub-menu-wrap). |
| **Queue overload** | Limit concurrent jobs, monitor queue size and worker count; use parser options (e.g. categories, max_pages). |
| **Category duplication** | CategorySyncService deduplicates by slug; run sync periodically to realign with donor menu. |
| **JWT too short** | Deploy script checks length and generates key if needed; use config('jwt.secret') in code. |

---

## SECTION 14 — NEXT DEVELOPMENT TASKS

- **Parser control center:** Clearer admin UI for start/stop, type (full/menu_only/category/seller), options, and live progress.
- **Parser progress UI:** Real-time progress (e.g. Reverb) or short-interval polling with current category, products parsed, errors.
- **Retry failed jobs:** Admin action to retry failed ParserJob or failed queue jobs.
- **Rate limiting:** Throttle donor requests (per-minute limits, backoff) to avoid blocking.
- **Category sync monitoring:** Log or display last sync result (created/updated counts) and last_synced_at in admin.
- **Tests:** Unit tests for MenuParser, CategorySyncService; feature tests for parser start/stop and category sync.

---

## SECTION 15 — PROJECT QUICK START

### Backend (cheepy-backend)

1. Clone: `git clone https://github.com/letoceiling-coder/cheepy-backend.git` (e.g. into `sadavod-laravel` or `cheepy-backend`).
2. `cd` into repo; copy `.env.example` to `.env`; set `APP_KEY`, `DB_*`, `REDIS_*`, `QUEUE_CONNECTION=redis`, `JWT_SECRET` (≥32 chars), `SADAVOD_DONOR_URL` if needed.
3. `composer install`
4. `php artisan migrate`
5. `php artisan config:cache` (optional; ensures jwt.secret is cached).
6. Start worker: `php artisan queue:work` (or use Supervisor in production).

### Frontend (cheepy-frontend)

1. Clone: `git clone https://github.com/letoceiling-coder/cheepy-frontend.git` (e.g. into `cheepy`).
2. `cd` into repo; `npm install`
3. Create `.env` or `.env.local` with `VITE_API_URL` pointing to backend (e.g. `http://online-parser.siteaacess.store/api/v1` or local backend URL).
4. `npm run dev` for development or `npm run build` for production build.

### Deploy (after commit + push)

```bash
ssh root@85.117.235.93 "bash /var/www/deploy.sh"
```

### Sync Categories (after deploy)

Call with valid JWT:

```bash
curl -X POST "https://online-parser.siteaacess.store/api/v1/parser/categories/sync" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## SUMMARY

- **Two repos:** Backend (Laravel, parser, API) and Frontend (React, admin + public). Two domains: API and site.
- **Parser:** Queue-driven; MenuParser for categories; CategorySyncService + runMenuOnly for DB sync; full run uses CatalogParser, ProductParser, SellerParser.
- **Deploy:** Local commit → push → run `/var/www/deploy.sh` on server. No long-term editing on server.
- **Categories:** Single source is MenuParser; sync via `POST /api/v1/parser/categories/sync`; structure stored in `categories` with parent_id, url, sort_order.
- **Monitoring:** `GET /api/v1/system/status` for parser, queue, Redis, Reverb, and basic system metrics.
- Use this document to onboard developers and to restore context when continuing work in a new chat.

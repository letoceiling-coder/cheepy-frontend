# BACKEND DEEP AUDIT (Laravel)

**Repository:** cheepy-backend  
**Base path (example):** `sadavod-laravel` / `cheepy-backend`  
**Laravel:** API-only; routes under `api` prefix; no repositories pattern; Eloquent ORM.

---

## 1. Laravel Architecture

### 1.1 app/ Directory Structure

```
app/
├── Console/
│   └── Commands/
│       ├── AuditAttributes.php      # php artisan attributes:audit
│       ├── ParseSadovodCommand.php   # legacy CLI parser
│       ├── RebuildAttributes.php    # php artisan attributes:rebuild
│       └── RunParserJobCommand.php  # optional manual job run
├── Events/
│   ├── ParserError.php
│   ├── ParserFinished.php
│   ├── ParserProgressUpdated.php
│   ├── ParserStarted.php
│   └── ProductParsed.php
├── Http/
│   ├── Controllers/
│   │   ├── Api/
│   │   │   ├── AttributeRuleController.php  # rules, synonyms, dictionary, canonical, facets, audit, test, rebuild
│   │   │   ├── AuthController.php          # login, me, refresh; JWT
│   │   │   ├── BrandController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── CategorySyncController.php  # POST categories/sync
│   │   │   ├── DashboardController.php
│   │   │   ├── ExcludedController.php
│   │   │   ├── FilterController.php
│   │   │   ├── LogController.php
│   │   │   ├── ParserController.php        # start, stop, status, progress, jobs, photos
│   │   │   ├── ProductController.php
│   │   │   ├── PublicController.php       # menu, categoryProducts, product, seller, search, featured
│   │   │   ├── SellerController.php
│   │   │   ├── SettingController.php
│   │   │   ├── AdminUserController.php
│   │   │   └── AdminRoleController.php
│   │   ├── CatalogController.php          # web routes: catalog index, product
│   │   └── Controller.php
│   └── Middleware/
│       ├── AdminRoleMiddleware.php
│       ├── CorsMiddleware.php
│       └── JwtMiddleware.php
├── Jobs/
│   └── RunParserJob.php             # Queue job: runs DatabaseParserService
├── Models/
│   ├── AdminUser.php
│   ├── AttributeDictionary.php
│   ├── AttributeRule.php
│   ├── AttributeSynonym.php
│   ├── AttributeValueNormalization.php
│   ├── Brand.php
│   ├── Category.php
│   ├── ExcludedRule.php
│   ├── FilterConfig.php
│   ├── ParserJob.php
│   ├── ParserLog.php
│   ├── Product.php
│   ├── ProductAttribute.php
│   ├── ProductPhoto.php
│   ├── Role.php
│   ├── Seller.php
│   ├── Setting.php
│   └── User.php                     # Laravel default (may be unused)
├── Providers/
│   └── AppServiceProvider.php
└── Services/
    ├── AttributeExtractionService.php   # extract + normalize attributes from product text
    ├── AttributeFacetService.php        # facet counts per category (Redis cache)
    ├── CategorySyncService.php         # MenuParser → sync categories to DB
    ├── DatabaseParserService.php       # orchestrates full/category/seller/menu_only parse
    ├── PhotoDownloadService.php        # download product images
    ├── ParserMetricsService.php        # metrics for system/status
    └── SadovodParser/
        ├── HttpClient.php              # HTTP client for donor
        ├── SadovodParserService.php     # legacy wrapper
        └── Parsers/
            ├── CatalogParser.php        # catalog listing pages
            ├── MenuParser.php            # donor menu → categories
            ├── ProductParser.php         # product detail page
            └── SellerParser.php          # seller page
```

### 1.2 Component Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Controllers** | Validate request, call model/service, return JSON. No business logic in controllers. |
| **Services** | Business logic: parser orchestration, category sync, attribute extraction, facet building, photo download, metrics. |
| **Models** | Eloquent models; relationships; accessors; scopes. No repositories; controllers/services use models directly. |
| **Jobs** | RunParserJob: load ParserJob by ID, instantiate DatabaseParserService, run(). Timeout 3600s, tries 3, backoff [60,300,900]. |
| **Events** | ParserStarted, ParserProgressUpdated, ProductParsed, ParserError, ParserFinished. Broadcast on `parser` channel (Reverb) when broadcasting configured. |
| **Middleware** | CorsMiddleware (prepend); JwtMiddleware (alias `jwt`); AdminRoleMiddleware (role check). |
| **Providers** | AppServiceProvider only; no custom service provider for parser. |

### 1.3 No Repositories

Data access is via Eloquent models directly from controllers and services. No Repository or Action pattern.

### 1.4 Listeners

No dedicated Listener classes. Events are broadcast (Reverb) if broadcasting is enabled; no in-process listeners for parser events.

---

## 2. Http Layer

- **API prefix:** `api` (bootstrap/app.php → apiPrefix: 'api'). Full path: `/api/v1/...` (v1 is in route groups).
- **Auth:** JWT via `JwtMiddleware`. Token from `Authorization: Bearer <token>` or query `token`. AuthController::verifyToken() decodes JWT; AdminUser loaded by `sub`; set in request attributes as `auth_user` and `auth_user_model`.
- **CORS:** CorsMiddleware prepended globally; allows frontend origin.
- **Exceptions:** ModelNotFoundException → 404 JSON; ValidationException → 422 with errors.

---

## 3. Configuration

- **config/sadovod.php:** base_url, request_delay_ms, user_agent, verify_ssl, exclude_menu_links/text, photos_dir, max_photos_per_product. Used by HttpClient and parsers.
- **config/jwt.php:** secret (env JWT_SECRET), expires_days. Used by AuthController.
- **config/parser_user_agents.php:** optional user-agent list.
- **config/parser_rate.php:** rate limiting for parser.
- **config/reverb.php, config/broadcasting.php:** Reverb WebSocket server and driver.
- **.env:** APP_KEY, DB_*, REDIS_*, QUEUE_CONNECTION=redis, JWT_SECRET, SADAVOD_DONOR_URL, etc. Never committed.

---

## 4. Queue System

- **Driver:** Redis (`QUEUE_CONNECTION=redis`).
- **Queue name:** `default`. RunParserJob uses `$this->onQueue('default')`.
- **Worker command:** `php artisan queue:work` (Supervisor runs multiple processes: parser-worker_00 … parser-worker_03).
- **RunParserJob:** timeout 3600s; tries 3; backoff [60, 300, 900] seconds. On failure updates ParserJob to failed and logs.
- **Concurrency:** Multiple workers can run; only one parser run is intended at a time (API checks for existing running job before creating new one; stop sets all running/pending to stopped).

---

## 5. Parsers (Summary)

- **MenuParser:** GET donor `/` → #menu-catalog (fallback #menu-main) → flat list { name, slug, url, parent_slug }. Cache 1h.
- **CategorySyncService:** Uses MenuParser; deduplicates by slug; sorts parents first; upserts categories (external_slug, parent_id, url, sort_order).
- **CatalogParser:** GET donor `/catalog/{slug}` with pagination; returns product links and total_pages.
- **ProductParser:** GET donor `/odejda/{id}`; returns title, price, description, characteristics, photos, seller link.
- **SellerParser:** GET donor `/s/{slug}`; returns name, contacts, description; normalizes seller name.
- **DatabaseParserService:** Constructs HttpClient and all parsers from config; run() dispatches by job type (menu_only, category, seller, full). runFull: runMenuOnly then iterate categories → runSingleCategory (CatalogParser → ProductParser → saveProductFromListing → AttributeExtractionService / legacy attributes, PhotoDownloadService). getOrCreateSellerForProduct: Redis cache seller:{slug}, lock, 10s timeout, 3 retries.

---

## 6. Models (Summary)

- **Category:** parent_id self-ref; products; fillable name, slug, external_slug, url, parent_id, sort_order, enabled, products_count, last_parsed_at, etc.
- **Product:** category, seller, brand, productPhotos, productAttributes; upsertFromParser(); external_id unique.
- **Seller:** slug unique; products; products_count.
- **ParserJob:** type, options (JSON), status, progress fields (total_categories, parsed_products, saved_products, errors_count, current_action, current_category_slug, etc.), started_at, finished_at.
- **AdminUser:** email/password; role; permissions JSON; is_active; last_login_at.
- **Role:** name, slug; role_user pivot (admin_users ↔ roles).
- **ProductAttribute:** product_id, category_id, attr_name, attr_value, attr_type, confidence.
- **AttributeRule, AttributeSynonym, AttributeDictionary, AttributeValueNormalization:** for attribute extraction and normalization (see DATABASE_SCHEMA.md).

---

## 7. Events and Broadcasting

- Events: ParserStarted, ParserProgressUpdated, ProductParsed, ParserError, ParserFinished. Each receives ParserJob (and optional payload).
- Channel: `parser` (public; channels.php returns true). Events broadcast as .ParserStarted, .ParserProgressUpdated, etc.
- Frontend can subscribe via Laravel Echo + Reverb to get real-time progress; otherwise admin polls GET /api/v1/parser/progress.

---

## 8. Artisan Commands

- **attributes:audit** — AuditAttributes: top values per attribute, unknown values, confidence distribution.
- **attributes:rebuild** — RebuildAttributes: optional --chunk, --category, --product, --dry-run; calls AttributeExtractionService::rebuildAll() or single product.
- **queue:work** — Laravel default; used by Supervisor.
- **migrate** — Laravel migrations.
- RunParserJobCommand, ParseSadovodCommand — legacy/manual entry points if present.

---

## 9. Security

- Admin API: JWT required (except public and health routes). Token in header or query.
- Passwords: Hash::check in AuthController; stored hashed in admin_users.
- CORS: Configured for frontend origin.
- No rate limiting documented on API routes in this audit (config may add throttle).

---

## 10. File Locations (Quick Reference)

| Concern | Location |
|---------|----------|
| API routes | routes/api.php |
| Web routes | routes/web.php (catalog, /up) |
| Parser entry | ParserController::start → RunParserJob::dispatch |
| Parser logic | DatabaseParserService::run(), runMenuOnly(), runFull(), runSingleCategory(), saveProductFromListing() |
| Category sync | CategorySyncService::sync(); CategorySyncController invokable |
| Attribute extraction | AttributeExtractionService; called from DatabaseParserService::saveProductFromListing |
| JWT | AuthController (encode/verify); JwtMiddleware (extract + verify + set auth_user) |

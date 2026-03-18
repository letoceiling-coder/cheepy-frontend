# SYSTEM IMPROVEMENT PLAN

This document summarizes **current system status** (what is implemented, partially implemented, or missing), **architectural risks**, and **recommended improvements**. It is the master list for prioritising future work. Reference: PROJECT_FULL_CONTEXT.md, all other audit documents.

---

## PART 1 — CURRENT SYSTEM STATUS

### 1.1 What Is Already Implemented

| Area | Status | Notes |
|------|--------|--------|
| **Two-repo architecture** | Done | Backend (Laravel) and Frontend (React) separate; clear API boundary. |
| **Parser pipeline** | Done | MenuParser → CategorySyncService; DatabaseParserService with full/category/seller/menu_only; CatalogParser, ProductParser, SellerParser; RunParserJob on Redis queue. |
| **Category sync** | Done | MenuParser as single source; POST /parser/categories/sync; runMenuOnly in job. |
| **Parser start/stop** | Done | POST parser/start (creates job, dispatches); POST parser/stop (marks jobs stopped); workers check isCancelled(). |
| **Parser progress** | Done | parser_jobs table updated; GET parser/progress, parser/status, parser/stats; optional Reverb events (ParserProgressUpdated, etc.). |
| **Admin panel** | Done | Login (JWT), dashboard, parser UI, categories, products, sellers, brands, filters, logs, settings, users, roles, docs, attribute rules/dictionary/canonical/audit. |
| **Public API** | Done | menu, category products, product, seller, search, featured. No auth. |
| **JWT auth** | Done | login, me, refresh; JwtMiddleware; config('jwt.secret'). |
| **Attribute system** | Done | attribute_rules, attribute_synonyms, attribute_value_normalization, attribute_dictionary; AttributeExtractionService (normalize → rules → synonyms → canonical → persist); confidence; AttributeFacetService with Redis cache; artisan attributes:rebuild, attributes:audit; admin UI tabs. |
| **Seller normalization** | Done | normalizeSellerName in SellerParser and DatabaseParserService; slug-based upsert with Redis cache and lock. |
| **Category filter on full run** | Done | Frontend sends category IDs; backend filters by id or external_slug. |
| **System status endpoint** | Done | GET system/status: parser_running, queue, Redis, Reverb, CPU, memory, disk, products stats, ParserMetricsService. |
| **Deploy workflow** | Done | Script updates both repos, migrate, cache clear, queue restart, supervisor, nginx. |

### 1.2 What Is Partially Implemented

| Area | Status | Gap |
|------|--------|-----|
| **Real-time parser progress** | Partial | Reverb channel and events exist; frontend has useParserChannel and Echo. If Reverb is not running or Echo not configured, admin falls back to polling. No guaranteed “live” indicator. |
| **Admin users & roles** | Partial | admin_users table with role column; role_user and roles table exist. AdminUserController and AdminRoleController may exist; frontend has UsersPage and RolesPage. Fine-grained permissions (e.g. per-endpoint) not fully documented in this audit. |
| **Photo download** | Partial | PhotoDownloadService and createPhotoRecordsOnly exist. Optional save_photos in options; photo workers (parser-worker-photos) may be separate. End-to-end flow (queue, storage, CDN) not fully traced here. |
| **CRM module** | Partial | Frontend /crm routes and layout exist; pages are largely mock data. No backend CRM API in scope. |
| **Public marketplace** | Partial | Pages and public API exist. Cart/Favorites/Account may use local state or mock; integration with orders/checkout/payments not confirmed. |
| **Rate limiting** | Partial | config/parser_rate.php and request_delay_ms exist. Donor request throttling may be in HttpClient; no global API rate limiting documented. |

### 1.3 What Is Missing or Not Confirmed

| Area | Notes |
|------|--------|
| **Retry failed parser job** | No admin “retry” for failed ParserJob or re-dispatch of RunParserJob. |
| **Rate limit / backoff for donor** | Config exists but donor-side throttling and backoff strategy not fully documented. |
| **Unit/feature tests** | PROJECT_FULL_CONTEXT mentions tests for MenuParser, CategorySyncService, parser start/stop, category sync; not verified in this audit. |
| **API rate limiting** | Throttle middleware for /api/v1 not confirmed. |
| **Pagination consistency** | Public and admin list endpoints pagination format (meta.total, last_page, etc.) may differ; not audited in detail. |
| **Webhook or callback** | No webhook/callback when parser finishes (only Reverb and polling). |
| **Backup / recovery** | No backup or point-in-time recovery procedure in scope. |

---

## PART 2 — ARCHITECTURAL RISKS

### 2.1 Scalability

- **Single server:** All components on one host. Queue workers and Laravel share CPU/memory. At 100k+ products, DB size and query load (e.g. category products with filters) may require indexing and query optimisation (already partial: product_attributes indexes, facet cache).
- **Parser concurrency:** Only one “running” job intended; multiple workers can run other jobs. If multiple full runs are triggered (e.g. bug or bypass), donor and DB can be overloaded.
- **Recommendation:** Keep single active parser run; consider dedicated queue for photo download; plan DB read replicas and cache (Redis) for public catalog if traffic grows.

### 2.2 Queue Overload

- **Single default queue:** RunParserJob and possibly photo jobs on same queue. Long parser job can delay other jobs.
- **No job limit:** Many start requests (e.g. misclick) could create many pending jobs (mitigated by 409 when running).
- **Recommendation:** Separate queue for parser vs photos; optional max pending parser jobs; monitor queue size in system/status.

### 2.3 Parsing Bottlenecks

- **Donor delay:** request_delay_ms (e.g. 500 ms) between requests limits throughput. Necessary to avoid blocking by donor.
- **Sequential category/product:** Full run is sequential per category and per product. No parallelisation across categories in current design.
- **Recommendation:** Keep delay; document donor limits; consider parallel workers only if donor allows and with careful rate control.

### 2.4 Database Growth

- **products, product_attributes, product_photos:** Grow with parsed data. product_attributes and product_photos can be large.
- **parser_logs:** Unbounded unless cleared (logs/clear endpoint exists).
- **Recommendation:** Retention policy for parser_logs; archive or partition old parser_jobs if needed; monitor disk and index usage.

### 2.5 API Performance

- **Public category products:** May join products, categories, filters; filter by attributes. AttributeFacetService caches facets; product list query still needs to be fast (indexes on category_id, status, price_raw, etc.).
- **Recommendation:** Ensure indexes on frequently filtered columns; consider caching first page of category products; monitor slow queries.

### 2.6 Donor Structure Change

- **MenuParser / CatalogParser / ProductParser** depend on donor HTML (e.g. #menu-catalog, .menu-item, listing layout). If donor changes structure, parsing can break.
- **Recommendation:** Monitor parsing errors and logs; version or document selector assumptions; optional smoke test (e.g. fetch menu and assert categories count).

### 2.7 Security and Secrets

- **JWT:** Secret from config; deploy script ensures length. Rotation requires invalidating existing tokens or short expiry + refresh.
- **.env:** Not in repo; server must keep it secure.
- **Recommendation:** Regular JWT rotation policy; restrict system/status or health to internal/monitoring if needed.

---

## PART 3 — RECOMMENDED IMPROVEMENTS

### 3.1 Parser Architecture

- **Retry failed job:** Admin action to “retry” a failed ParserJob (create new job with same options or re-dispatch RunParserJob with same id after resetting status). Optionally “retry from category X”.
- **Donor rate and backoff:** Document and enforce per-minute (or per-request) limit; exponential backoff on 429/5xx from donor; configurable in config/sadovod.php.
- **Separate queue for photos:** Move photo download to a dedicated queue and worker pool so parser job completion is not blocked by photo downloads.
- **Progress granularity:** Optional “current product” or “current page” in progress response for finer UI updates.

### 3.2 Admin UI

- **Parser progress:** Clear “live” vs “polling” indicator; optional sound or notification when parser finishes (success/failed).
- **Category sync result:** Show last_synced_at and last sync result (created/updated) on categories page or dashboard.
- **Bulk actions:** Bulk product status change, bulk delete, bulk category assign where useful.
- **Attribute audit in UI:** Already present; add “export unknown values” or “add to dictionary” from audit to reduce manual work.

### 3.3 Monitoring

- **Alerts:** Alert when parser fails repeatedly, queue size above threshold, or disk/DB growth anomaly. Integrate with existing system/status (e.g. health check that fails if queue > N or parser failed last run).
- **Structured logs:** Ensure parser_logs (or app log) have structured context (job_id, category_slug, product external_id) for easier debugging.
- **Dashboard metrics:** Trend charts for products_total, products_today, errors_today, last_parser_run (already in status); optional history table for status snapshots.

### 3.4 Queue Management

- **Max concurrent parser jobs:** Enforce at most one running parser job (already done at start); ensure stop and failure transitions are consistent so “running” is never stuck.
- **Failed job visibility:** List failed jobs in admin with error_message and “Retry” button.
- **Queue size alerting:** Include queue_size in monitoring/health so high backlog is visible.

### 3.5 Data Integrity

- **products_count:** categories and sellers have products_count; ensure it is updated on product create/delete and on parser (already incremented in saveProductFromListing; consider periodic reconciliation job).
- **Orphan records:** Optional job to find product_photos or product_attributes for deleted products and clean up (or rely on cascade).
- **Attribute normalization:** Continue expanding attribute_dictionary and attribute_value_normalization from audit results to reduce duplicate filter values.

### 3.6 Scalability (Long Term)

- **Read replica:** Use MySQL read replica for public catalog reads if write load from parser is high.
- **Cache public responses:** Cache GET /public/categories/{slug}/products for first page (short TTL) and invalidate on category sync or parser run for that category.
- **Horizontal workers:** Multiple app servers with shared Redis and DB; workers on dedicated hosts if needed.

### 3.7 Testing and Reliability

- **Unit tests:** MenuParser (with fixture HTML), CategorySyncService (with mock MenuParser), AttributeExtractionService (with sample text).
- **Feature tests:** POST parser/start returns 201 and job appears in list; POST parser/stop stops job; POST categories/sync returns created/updated.
- **Smoke test:** After deploy, call GET /up, GET system/status, GET public/menu and assert basic structure.

### 3.8 Documentation and Onboarding

- **API docs:** OpenAPI/Swagger or static doc generated from routes (optional). PROJECT_FULL_CONTEXT and API_DOCUMENTATION.md already provide endpoint list.
- **Runbook:** Document deploy steps, how to clear queue, how to restart workers, how to fix “parser stuck” (stop, optional reset job status, restart workers).
- **Env checklist:** Document required .env vars (JWT_SECRET, DB_*, REDIS_*, QUEUE_CONNECTION, SADAVOD_DONOR_URL, etc.) for new environment.

---

## PART 4 — PRIORITY MATRIX (Suggested)

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| High | Retry failed parser job from admin | Low | High |
| High | Donor rate limit + backoff documented and enforced | Medium | High |
| High | Parser progress “live” indicator and finish notification | Low | Medium |
| Medium | Separate queue for photo download | Medium | Medium |
| Medium | Category sync result on dashboard/categories page | Low | Medium |
| Medium | Failed jobs list + Retry in admin | Low | Medium |
| Medium | Unit tests for MenuParser, CategorySyncService | Medium | Medium |
| Low | Public category products cache (first page) | Medium | Low–Medium |
| Low | API rate limiting (throttle) | Low | Low |
| Low | OpenAPI/Swagger for API | Medium | Low (docs) |

---

## Summary

The system is **production-capable** for parser-driven catalog and admin control. Main gaps are **retry for failed jobs**, **clear donor rate/backoff strategy**, **real-time UX polish**, and **test coverage**. Addressing scalability (replicas, caches) becomes important as product count and traffic grow. This improvement plan should be revisited as the codebase and operations evolve.

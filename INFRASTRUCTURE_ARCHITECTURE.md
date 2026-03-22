# Platform Infrastructure Architecture

**Document type:** Infrastructure design for queues, workers, schedulers, search, cache, and file storage (no code)  
**Audience:** Backend leads, DevOps  
**Context:** Supports parser, events, emails, search, caching, and media; aligns with PRODUCT_ARCHITECTURE, ORDER_SYSTEM_ARCHITECTURE, PLATFORM_EVENT_ARCHITECTURE, and related docs.

---

## STEP 1 — QUEUE SYSTEM

### 1.1 jobs

- **Responsibility:** **Queue of work items** to be processed asynchronously. Each row is one job: type (e.g. parse_category, handle_event, send_email), payload (JSON), queue name (for routing to the right worker), status, and scheduling. Workers poll or listen for jobs and execute the corresponding handler.
- **Columns (conceptual):** id, queue (string; e.g. parser, events, email, default), job_type (string; e.g. ParseCategoryJob, HandleDomainEventJob, SendOrderConfirmationEmail), payload (JSON), status (pending | reserved | processing | completed | failed), priority (int; higher = sooner), attempts (int; default 0), max_attempts (int; default 3 or 5), reserved_at (nullable; when a worker claimed it), reserved_by (nullable; worker id or process id), available_at (timestamp; run not before; for delayed jobs), completed_at (nullable), created_at, updated_at. Optional: correlation_id, parent_job_id (for job chains).
- **Relationship:** jobs are consumed by workers; each execution is recorded in job_attempts. When status = failed and attempts >= max_attempts, a row can be written to job_failures and job deleted or kept for audit. Unique ordering: workers SELECT ... WHERE queue = X AND status = pending AND (available_at IS NULL OR available_at <= now()) ORDER BY priority DESC, id LIMIT 1 FOR UPDATE SKIP LOCKED (or equivalent), then set status = reserved/reserving.

### 1.2 job_attempts

- **Responsibility:** **History of each attempt** to run a job. One row per try (including retries). Enables debugging, metrics (duration, success rate), and replay.
- **Columns (conceptual):** id, job_id (FK jobs), attempt_number (int), started_at, finished_at (nullable), status (running | completed | failed), result (nullable; JSON or text), error_message (nullable), error_trace (nullable), worker_id (optional), created_at.
- **Relationship:** job_attempts.job_id → jobs. When a worker starts a job: insert job_attempts (status = running). When it finishes: update job_attempts (finished_at, status = completed or failed, result/error_message). If failed and attempts < max_attempts, job is re-queued (available_at = now + backoff, attempts += 1, status = pending).

### 1.3 job_failures

- **Responsibility:** **Permanent failures**: jobs that exceeded max_attempts and are no longer retried. Preserves payload and last error for inspection and manual replay. Optional: same table as jobs with status = failed and a “failed” partition, or a separate job_failures table.
- **Columns (conceptual):** id, job_id (nullable; original job id if kept), queue, job_type, payload (JSON), exception_message (text), exception_trace (text), failed_at, created_at. Optional: first_attempt_at, last_attempt_at, attempt_count.
- **Relationship:** When a job fails for the last time, copy or move its data to job_failures (and delete or archive the job row). Admin/ops can list job_failures, fix the cause, and “retry” by re-inserting a new job with the same payload.

### 1.4 Queue Flow

- **Dispatch:** Application (or event dispatcher) inserts into **jobs** (queue, job_type, payload, status = pending). Optional: available_at for delayed jobs.
- **Work:** Worker picks a job (reserve: status = processing, reserved_at = now), runs handler, then: on success set status = completed, completed_at; on failure increment attempts, set status = pending and available_at = now + backoff (if attempts < max_attempts), or move to job_failures and delete/archive job (if attempts >= max_attempts). Each start/finish can write **job_attempts**.
- **Scheduler:** A separate process (cron or scheduler daemon) inserts jobs at the right time (e.g. “every hour run sales_report aggregation job”). See STEP 2 (workers) and schedulers below.

---

## STEP 2 — WORKERS

### 2.1 Parser Workers

- **Responsibility:** Run **parser jobs**: crawl donor categories, parse product pages, save products and photos. Jobs are queued when a parser run is requested (e.g. by admin or schedule). Worker pulls from queue `parser` (or `default` with job_type like ParseCategoryJob), executes parser logic (HTTP fetch, parse, upsert products, donor_categories, category_mapping), and optionally enqueues follow-up jobs (e.g. download product images, attribute normalization).
- **Queue:** jobs.queue = 'parser' (or job_type in parser_*). One or more worker processes (Supervisor or systemd) run the same worker command; each reserves one job at a time. Concurrency: multiple workers for throughput; rate limiting and delays are in parser config (anti-blocking).
- **Dependencies:** PRODUCT_ARCHITECTURE (products, product_photos/product_media), CATALOG_ARCHITECTURE_V2 (donor_categories, catalog_categories, category_mapping). Parser workers read parser_settings, parser_state; update parser_jobs, parser_logs.

### 2.2 Event Workers

- **Responsibility:** Process **domain events**: consume jobs of type HandleDomainEventJob (or similar) with payload { event_id, subscriber_id }. Load event from domain_events, load handler from event_handlers, run handler (e.g. credit seller balance, send notification, update search index). Enables async handling of order_created, payment_captured, shipment_delivered, etc. (PLATFORM_EVENT_ARCHITECTURE).
- **Queue:** jobs.queue = 'events' (or 'default'). Event dispatcher (sync or a small job) reads domain_events and inserts one job per (event_id, subscriber_id). Event workers process these jobs; on success mark event_deliveries completed; on failure retry with backoff, then dead letter.
- **Dependencies:** domain_events, event_subscribers, event_handlers; optional event_deliveries. Handlers may touch orders, seller_balance, notifications, search index.

### 2.3 Email Workers

- **Responsibility:** Send **emails** (order confirmation, shipping, password reset, seller verification, etc.). Jobs of type SendEmailJob with payload { to, template, data }. Worker loads template, renders, calls SMTP or email API (SendGrid, Mailgun, etc.), records delivery if needed. Decouples HTTP request from email send so API responds quickly.
- **Queue:** jobs.queue = 'email'. Application (or event handlers) enqueue SendEmailJob after order_created, payment_captured, etc. One or more email workers process the queue; rate limit per provider to avoid throttling.
- **Dependencies:** None in DB beyond jobs; optional email_log table (to, template, sent_at, status) for audit.

### 2.4 Schedulers

- **Responsibility:** **Time-based job creation.** A scheduler process (cron every minute, or a long-running daemon) evaluates “what should run now?” and enqueues jobs. Examples: every hour → aggregate sales_reports; every day → aggregate seller_reports, product_reports; every 15 minutes → event_dispatcher (read new domain_events, enqueue handler jobs); parser run at 02:00. No separate “scheduler table” required if cron triggers a single “schedule:run” command that reads from a **scheduled_tasks** table (or config) and enqueues jobs.
- **scheduled_tasks (conceptual):** id, name (unique), cron_expression (e.g. 0 * * * * for hourly), job_type, job_payload (JSON), queue, is_active, last_run_at (nullable), next_run_at (nullable), created_at, updated_at. Scheduler computes next_run_at from cron; when now >= next_run_at, enqueue job and set last_run_at, next_run_at. Alternatively: use framework scheduler (Laravel scheduler, Celery beat) that calls “enqueue job” at fixed intervals; no DB table for schedule.
- **Summary:** Workers = processes that consume **jobs**; parser, event, and email are **queue names or job types**. Scheduler = process that **enqueues** jobs on a schedule.

---

## STEP 3 — SEARCH

### 3.1 Product Search Index

- **Responsibility:** **Full-text and faceted search** over products for storefront and admin. Products are indexed by title, description, attributes, category, seller, brand so that search API returns relevant products and supports filters (category, price range, attributes). Index can be in a search engine (Elasticsearch, OpenSearch, Meilisearch, TypeSense) or in DB (full-text index on products + product_attributes). Design here is **logical**: what is indexed and how it is updated.
- **Indexed fields (conceptual):** product_id, title, description (optional or truncated), category_id, catalog_category_slug (for URL), seller_id, brand_id, price (min price if variants), status (visibility, moderation — only approved and visible), attribute key-value pairs (from product_attributes: size, color, etc.), created_at, updated_at. Optional: slug, brand_name, seller_name for display.
- **Update flow:** On product create/update/delete (or moderation_status → approved), **index the document** (add/update/remove in search engine). Can be synchronous in request (simple, slower) or **async via job**: product_updated event or direct enqueue “IndexProductJob(product_id)”; event worker or search worker runs and updates the index. PRODUCT_ARCHITECTURE and ATTRIBUTE_ENGINE_ARCHITECTURE: product_attributes drive filter facets; category_attribute_schema defines which attributes are filterable per category.
- **Query:** Search API accepts q (query string), category_id (or slug), filters (attribute_id: value, price_min, price_max), sort, pagination. Backend translates to search engine query (or DB full-text + filters). Results return product ids and optionally snippets; storefront loads full product from DB or cache.

### 3.2 Filter Index

- **Responsibility:** **Facet counts** for category and search: for each filterable attribute (and price), the number of matching products. E.g. “Color: Red (12), Blue (8); Size: 42 (5).” Can be computed on the fly from search engine aggregations (recommended) or from a **materialized filter index** (table or cache) updated when products change.
- **Option A — Search engine aggregations:** No separate table. Search request includes “aggregations” for attribute values and price buckets; search engine returns counts with results. Always consistent with product index.
- **Option B — Materialized filter index:** Table filter_facets (category_id, attribute_id, value, product_count, updated_at). Job (scheduled or event-driven) recomputes counts from products + product_attributes for each (category_id, attribute_id, value). Storefront reads this table for facet counts. Simpler query but eventually consistent and requires update job.
- **Recommendation:** Use search engine aggregations when using Elasticsearch/OpenSearch/Meilisearch; no separate filter index table. If using DB-only full-text, maintain a simple cache (Redis) or materialized counts per (catalog_category_id, attribute_id, value) refreshed by job.

### 3.3 Search Summary

- **Product search index:** Documents = products (and key attributes); update on product save/moderation. Query = full-text + filters + sort; results + facets from search engine (or DB + cache).
- **Filter index:** Facet counts from search engine aggregations, or from materialized table/cache updated by job.

---

## STEP 4 — CACHE

### 4.1 Redis Caching

- **Responsibility:** **In-memory cache** for hot data: session store (user_sessions, guest cart), rate limiting, job queue backend (if using Redis for jobs instead of DB), and application key-value cache (e.g. “category:slug:shoes” → category payload, “product:id:123” → product DTO). Reduces DB and search load.
- **Usage:** Cache **category tree**, **menu by key**, **product by id** (or slug), **cart by session_id**, **API response** for stable endpoints. TTL per key (e.g. category 1 hour, product 5–15 min). Invalidate on update: when category or product is updated, delete or refresh the corresponding cache keys. Pattern: cache_key = prefix:entity:id_or_slug; e.g. cat:shoes, prod:123, menu:header.
- **Configuration:** Redis instance (or cluster); connection from app config. Optional: separate Redis for sessions vs cache vs queues if using Redis for job queue.

### 4.2 Page Cache

- **Responsibility:** **Cached HTML or API response** for whole pages (e.g. home, category page, product page) so repeat requests are served without hitting app or DB. Can be HTTP cache (Cache-Control, CDN), or server-side: store rendered HTML/JSON by URL (or by page_key + locale) in Redis or file; serve on hit, regenerate on miss or invalidation.
- **Scope:** Public storefront only (no auth). Key = URL path + query (or normalized). Invalidate when CMS page is published, category is updated, or product is updated (invalidate that product URL and any listing that might include it). TTL: e.g. 5–15 min for category, 1–5 min for product; or purge-on-publish only.
- **Implementation options:** (1) Application-level: before controller, check Redis key url:...; if hit return; else render and set key with TTL. (2) Reverse proxy (Varnish, Nginx cache): cache GET by URL; purge via HTTP purge or TTL. (3) CDN: cache at edge with TTL and purge API.

### 4.3 Query Cache

- **Responsibility:** **Cache result of expensive queries** (e.g. “products for category X with filters,” “bestsellers,” “menu”). Key = hash of query + params; value = serialized result. Reduces DB and search load for repeated identical queries.
- **Usage:** Category listing (category_id, filters, sort, page) → cache key; TTL 1–15 min. Invalidate when product in that category changes or category changes. Bestsellers / trending: cache key “bestsellers:cat:5”, TTL 5–15 min. Menu: cache key “menu:header”; invalidate when menu is updated.
- **Storage:** Redis (preferred) or in-process cache. Same invalidation rules: on product/category/menu update, delete matching keys (pattern delete or explicit keys).

### 4.4 Cache Summary

- **Redis:** Key-value cache and optional session/queue backend; TTL and invalidation by key or pattern.
- **Page cache:** Full response cache by URL (or page_key); HTTP or app-level; purge on content change.
- **Query cache:** Cached query results by logical key; invalidate when underlying data (product, category, menu) changes.

---

## STEP 5 — FILE STORAGE

### 5.1 Media

- **Responsibility:** **User- and CMS-uploaded media**: images and video for CMS blocks, banners, and marketing. Stored in object storage (S3-compatible, MinIO, local disk) with a stable path or key. DB stores **reference** (url or storage_key); file is in bucket/volume.
- **Columns (conceptual) — media or files table:** id, storage_driver (local | s3 | minio), bucket (optional), path_or_key (string; path within bucket or key), original_name (string), mime_type, size (bytes), width, height (optional, for images), created_at, updated_at. Optional: entity_type, entity_id (e.g. banner_id, page_block_id) to link media to CMS entities. **URL:** Generated from base URL + bucket + path (or signed URL for private).
- **Flow:** Upload API receives file → validate type/size → store in bucket (path e.g. media/2025/03/uuid.jpg) → insert media row → return url or id. CMS and banners reference media id or url. CDN can sit in front of bucket for public reads.

### 5.2 Documents

- **Responsibility:** **Documents** for verification and support: seller_documents (ID, company registration, tax certificate), optional user documents, support attachments. Stored in object storage with access control (private); only admin/support and the owning seller/user can access. DB stores reference (seller_documents.file_path or storage_key).
- **Storage:** Same as media (object storage or local); path prefix e.g. documents/sellers/{seller_id}/{type}_{id}.pdf. IDENTITY_SYSTEM_ARCHITECTURE: seller_documents has file_path or storage_key. Download URL is signed or served via backend with auth check. Retention: policy for how long to keep; optional lifecycle rules in object storage.

### 5.3 Product Images

- **Responsibility:** **Product and variant images** (product_media / product_photos). Parser or admin uploads image → store in object storage (e.g. products/{product_id}/{variant_id}_{order}.jpg or hash-based key) → product_media row has url or local_path. Same pattern as media: DB = reference, storage = file. High volume (PRODUCT_ARCHITECTURE: 2M+ product_photos in production); use CDN for reads and optionally image resizing (thumbnails) via CDN or image service.
- **Flow:** Parser downloads image from donor URL → save to storage → product_media.local_path or url. Storefront and listing pages use URL (CDN). Optional: multiple sizes (thumb, medium, large) generated on upload or on-the-fly (image service).

### 5.4 File Storage Summary

- **Media:** CMS/banner assets; table media (or inline url in CMS); object storage + optional CDN.
- **Documents:** Seller/user documents; seller_documents.file_path; object storage; private, signed or auth-backed URL.
- **Product images:** product_media; object storage; public or CDN URL; optional thumbnails.
- **Unified:** One object-storage bucket (or buckets by type: media, documents, products) with path prefix; app config for driver, bucket, base URL, and CDN host.

---

## STEP 6 — FINAL DOCUMENT (Summary)

### 6.1 Queue System (Recap)

| Entity | Purpose |
|--------|---------|
| **jobs** | Queue: queue name, job_type, payload, status (pending → reserved → processing → completed/failed), priority, attempts, available_at. |
| **job_attempts** | Per-attempt log: job_id, attempt_number, started_at, finished_at, status, error_message. |
| **job_failures** | Permanent failures: payload, exception, failed_at; for replay. |

### 6.2 Workers (Recap)

| Worker type | Queue / job_type | Responsibility |
|-------------|------------------|-----------------|
| **Parser workers** | parser | Run parser jobs: crawl, parse, save products, categories; optional image download. |
| **Event workers** | events | Handle domain events: run event_handlers (balance, notifications, index). |
| **Email workers** | email | Send emails from SendEmailJob (templates, SMTP/API). |
| **Scheduler** | — | Enqueue jobs on schedule (cron or scheduled_tasks table). |

### 6.3 Search (Recap)

| Component | Purpose |
|-----------|---------|
| **Product search index** | Full-text + filters over products (title, attributes, category, price); search engine or DB full-text; update on product save/moderation. |
| **Filter index** | Facet counts from search engine aggregations or materialized table/cache. |

### 6.4 Cache (Recap)

| Layer | Purpose |
|-------|---------|
| **Redis** | Key-value cache (category, menu, product, cart, sessions); TTL and invalidation. |
| **Page cache** | Cached full response by URL; app or reverse proxy; purge on publish/update. |
| **Query cache** | Cached query results (listings, bestsellers); Redis or in-process; invalidate on data change. |

### 6.5 File Storage (Recap)

| Type | Purpose |
|------|---------|
| **Media** | CMS/banner assets; object storage; media table or url in CMS. |
| **Documents** | Seller/user docs (verification, support); object storage; private, auth/signed URL. |
| **Product images** | product_media; object storage; CDN; optional thumbs. |

### 6.6 Dependencies

- **PLATFORM_EVENT_ARCHITECTURE:** domain_events, event_subscribers, event_handlers; event workers consume handler jobs.
- **PRODUCT_ARCHITECTURE:** products, product_attributes; search index and product_media storage.
- **ORDER_SYSTEM_ARCHITECTURE:** orders; event handlers may enqueue email jobs.
- **CRM_OPERATION_ARCHITECTURE:** sales_reports, seller_reports, product_reports; scheduler enqueues aggregation jobs.
- **IDENTITY_SYSTEM_ARCHITECTURE:** seller_documents; document storage.

### 6.7 Indexing (Conceptual)

- **jobs:** (queue, status), (available_at), (priority, id), (status, created_at).
- **job_attempts:** (job_id), (created_at).
- **job_failures:** (failed_at), (queue), (job_type).

---

*End of Infrastructure Architecture.*

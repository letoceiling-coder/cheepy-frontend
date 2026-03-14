# PARSER ARCHITECTURE

This document describes all parser-related code: how parsing starts, which endpoints trigger it, how jobs are dispatched, how queues process parsing, and how results are stored. Reference: PROJECT_FULL_CONTEXT.md, BACKEND_DEEP_AUDIT.md.

---

## 1. Components Overview

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **MenuParser** | Services/SadovodParser/Parsers/MenuParser.php | Fetches donor homepage; extracts categories from #menu-catalog (fallback #menu-main). Returns flat list { name, slug, url, parent_slug }. Caches 1h. |
| **CategorySyncService** | Services/CategorySyncService.php | Uses MenuParser::parse(); deduplicates by slug; sorts parents first; upserts categories (external_slug, parent_id, url, sort_order). Used by POST /parser/categories/sync and by runMenuOnly. |
| **CatalogParser** | Services/SadovodParser/Parsers/CatalogParser.php | GET donor /catalog/{slug} with page offset; parses listing; returns { products: [{ id, title, price, url, ... }], total_pages, has_more }. |
| **ProductParser** | Services/SadovodParser/Parsers/ProductParser.php | GET donor /odejda/{id}; extracts title, price, description, characteristics, photos array, seller link. |
| **SellerParser** | Services/SadovodParser/Parsers/SellerParser.php | GET donor /s/{slug}; extracts name, contacts, description; normalizes seller name (trim quotes/commas). |
| **DatabaseParserService** | Services/DatabaseParserService.php | Orchestrator. Constructs HttpClient + all parsers from config. run() dispatches by job type: menu_only → runMenuOnly(); category → runSingleCategory(slug); seller → runSingleSeller(slug); full → runMenuOnly() then foreach category runSingleCategory(). Updates ParserJob progress; checks isCancelled() (status stopped/cancelled). saveProductFromListing: ProductParser (if saveDetails), getOrCreateSellerForProduct (Redis cache, lock, 10s timeout, 3 retries), Product::upsertFromParser, AttributeExtractionService::extractAndSave (or legacy saveProductAttributes), PhotoDownloadService or createPhotoRecordsOnly. |
| **HttpClient** | Services/SadovodParser/HttpClient.php | HTTP client for donor; base URL and delay from config; getCrawler(url) returns Symfony DomCrawler. |
| **RunParserJob** | Jobs/RunParserJob.php | Queue job. Receives parserJobId. Loads ParserJob; if status pending/running, sets pid, instantiates DatabaseParserService(job), service->run(). On exception marks job failed and rethrows. failed() marks job failed. timeout 3600s; tries 3; backoff [60, 300, 900]. Queue: default. |
| **CategorySyncController** | Http/Controllers/Api/CategorySyncController.php | Invokable. Calls CategorySyncService::sync(); returns created, updated, last_synced_at. |

---

## 2. How Parsing Starts

1. **Admin** (or API client) sends **POST /api/v1/parser/start** with body e.g. `{ "type": "full", "categories": [1,2,3], "max_pages": 2 }`.
2. **ParserController::start** checks for existing running job (ParserJob where status = running). If found, returns 409.
3. Builds **options** array from request: categories, linked_only, products_per_category, max_pages, no_details, save_photos, category_slug, seller_slug.
4. Creates **ParserJob** with type, options, status = pending.
5. **RunParserJob::dispatch($job->id)** pushes job to Redis queue `default`.
6. Returns 201 with job_id and job payload.

**No parsing runs in the HTTP request.** All work is in the queue worker.

---

## 3. Endpoints That Trigger Parsing

| Endpoint | What it does |
|----------|----------------|
| **POST /api/v1/parser/start** | Creates ParserJob and dispatches RunParserJob. Starts full/category/seller/menu_only run. |
| **POST /api/v1/parser/categories/sync** | Synchronous. Calls CategorySyncService::sync() → MenuParser → upsert categories. Does not create ParserJob or queue. |

---

## 4. How Jobs Are Dispatched

- **RunParserJob::dispatch($job->id)** is called from ParserController::start.
- Job is serialized and pushed to Redis list for queue `default`.
- No other parser-related jobs are dispatched from the API in this audit (photo download may be dispatched from inside DatabaseParserService or PhotoDownloadService to a separate queue).

---

## 5. How Queues Process Parsing

1. **Supervisor** runs one or more processes: `php artisan queue:work` (e.g. parser-worker_00 … parser-worker_03).
2. Worker pulls next job from Redis queue `default`.
3. If the job is **RunParserJob**, Laravel deserializes it and calls **handle()**.
4. **handle()** loads ParserJob by id; if status not in [pending, running], exits. Sets job->pid = getmypid(). Instantiates **DatabaseParserService($job)** and calls **$service->run()**.
5. **DatabaseParserService::run()** sets job status to running, fires ParserStarted, then:
   - **menu_only:** runMenuOnly() → menuParser->parse() → saveCategoriesFlat().
   - **category:** runSingleCategory(options['category_slug']).
   - **seller:** runSingleSeller(options['seller_slug']).
   - **full:** runMenuOnly() then foreach enabled category (filtered by options['categories'] IDs or linked_only) runSingleCategory().
6. Inside runSingleCategory: loop pages via CatalogParser->parseCategory(); for each product call saveProductFromListing() (ProductParser, getOrCreateSellerForProduct, Product::upsertFromParser, AttributeExtractionService, photos). Increment job saved_products, parsed_products, errors_count; update current_action, current_category_slug; fire ParserProgressUpdated/ProductParsed on interval. Check isCancelled() (status stopped/cancelled) to break.
7. On success: job status = completed, finished_at = now(), ParserFinished. On exception: job status = failed, error_message, ParserError, ParserFinished, rethrow. RunParserJob::failed() also sets job to failed.

---

## 6. How Results Are Stored

- **Categories:** Category::updateOrCreate(['external_slug' => $slug], [...]) in saveCategoriesFlat() or CategorySyncService. Columns: name, slug, url, parent_id, sort_order, enabled.
- **Products:** Product::upsertFromParser($pData, category_id, seller_id). external_id unique; title, price, description, category_id, seller_id, characteristics, photos, status, parsed_at, etc.
- **Sellers:** getOrCreateSellerForProduct() uses Redis cache seller:{slug}, lock, then Seller::firstOrCreate/update (slug, name, ...). products_count incremented.
- **Product attributes:** AttributeExtractionService::extractAndSave($product) or legacy saveProductAttributes(). ProductAttribute::where product_id delete then create rows (attr_name, attr_value, attr_type, confidence).
- **Product photos:** createPhotoRecordsOnly() creates ProductPhoto rows; or PhotoDownloadService::downloadProductPhotos() downloads and stores paths.
- **Parser job state:** ParserJob model updated throughout: total_categories, parsed_categories, total_products, parsed_products, saved_products, errors_count, current_action, current_page, total_pages, current_category_slug, started_at, finished_at, status, error_message.
- **Logs:** ParserLog::create() from DatabaseParserService::log().

---

## 7. Full Flow Diagram

```
Admin UI (ParserPage)
        │
        │ POST /api/v1/parser/start  { type, categories, max_pages, ... }
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│  ParserController::start                                               │
│  • Check ParserJob::where('status','running')->exists() → 409 if yes   │
│  • ParserJob::create([ type, options, status: pending ])               │
│  • RunParserJob::dispatch($job->id)                                    │
│  • return 201 { job_id, job }                                          │
└───────────────────────────────────────────────────────────────────────┘
        │
        │  Job pushed to Redis queue "default"
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│  Supervisor: php artisan queue:work                                   │
│  Worker picks RunParserJob from queue                                  │
└───────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│  RunParserJob::handle()                                               │
│  • ParserJob::find($parserJobId)                                       │
│  • if status not in [pending,running] return                           │
│  • job->update([ pid ])                                                │
│  • DatabaseParserService($job)->run()                                  │
└───────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│  DatabaseParserService::run()                                           │
│  • job->update([ status: running, started_at ])                        │
│  • event(ParserStarted)                                                 │
│  • match(type): menu_only → runMenuOnly()                              │
│                 category → runSingleCategory(slug)                      │
│                 seller   → runSingleSeller(slug)                       │
│                 full     → runFull()                                   │
│  • On success: status completed, event(ParserFinished)                 │
│  • On throw: status failed, event(ParserError), event(ParserFinished)  │
└───────────────────────────────────────────────────────────────────────┘
        │
        │  runFull():
        │  1) runMenuOnly() → MenuParser->parse() → saveCategoriesFlat() → DB categories
        │  2) Category::where(enabled)->[whereIn id if options[categories]]->get()
        │  3) foreach category → runSingleCategory(slug, category)
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│  runSingleCategory(slug, category)                                      │
│  • updateJob(current_action, current_category_slug)                   │
│  • page=1; loop:                                                        │
│    - CatalogParser->parseCategory('/catalog/'+slug, page-1) → products  │
│    - foreach product → saveProductFromListing(pData, category, ...)   │
│    - if isCancelled() break                                             │
│    - page++; delay; until !has_more or max_pages                         │
│  • category->update(products_count, last_parsed_at)                    │
└───────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│  saveProductFromListing(pData, category, saveDetails, savePhotos)      │
│  • if saveDetails: ProductParser->parse('/odejda/'+id) → merge pData   │
│  • getOrCreateSellerForProduct(pData['seller']) → Seller               │
│  • Product::upsertFromParser(pData, category_id, seller_id) → Product  │
│  • AttributeExtractionService->extractAndSave(product) or legacy       │
│  • createPhotoRecordsOnly(product, photos) or PhotoDownloadService      │
│  • job->increment(saved_products, parsed_products)                     │
│  • event(ProductParsed), event(ParserProgressUpdated) every N           │
└───────────────────────────────────────────────────────────────────────┘
        │
        ▼
   MySQL: categories, products, sellers, product_attributes, product_photos
   parser_jobs (progress), parser_logs
   (Optional) Reverb: broadcast ParserProgressUpdated, ProductParsed, ParserFinished
```

---

## 8. Stop Flow

- **POST /api/v1/parser/stop** → ParserController::stop.
- ParserJob::whereIn('status', ['running','pending'])->update(['status' => 'stopped', 'finished_at' => now()]).
- Redis::del('parser_running').
- Workers do not terminate immediately; they check **isCancelled()** (status stopped or cancelled) at loop boundaries and break out, then run() completes and job is marked completed (or already updated to stopped by API). So “stop” is cooperative: current product/category finishes, then no new categories are processed.

---

## 9. Category Sync (Separate from Job)

- **POST /api/v1/parser/categories/sync** (JWT) → CategorySyncController.
- CategorySyncService::sync() → app(MenuParser::class)->parse() → deduplicate by slug → sort parents first → foreach item Category::updateOrCreate(external_slug, name, parent_id, url, sort_order) and rebuild products_count.
- Returns { created, updated, last_synced_at }. No ParserJob created; runs in HTTP request (should be fast as only menu fetch + DB writes).

---

## 10. Dependencies

- **Config:** config('sadovod') for base_url, request_delay_ms, user_agent, etc. config('sadovod.request_delay_ms') used between requests.
- **Donor:** sadovodbaza.ru (or SADAVOD_DONOR_URL). Parsers assume donor HTML structure (#menu-catalog, .menu-item, catalog listing layout, /odejda/{id}, /s/{slug}).
- **Redis:** Queue driver; optional cache for MenuParser (menu:categories), getOrCreateSellerForProduct (seller:{slug}), AttributeExtractionService (attr_parse:{hash}, attr_rules_all, etc.), AttributeFacetService (filters:category:{id}).

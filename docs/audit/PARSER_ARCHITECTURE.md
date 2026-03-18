# PARSER_ARCHITECTURE — Online Parser Service

**URL**: https://online-parser.siteaacess.store  
**Framework**: Laravel 12 (PHP 8.2)  
**Source**: C:\OSPanel\domains\sadavod-laravel

---

## 1. Parser Flow

```
API: POST /api/v1/parser/start
        ↓
ParserController::start
        ↓
Create ParserJob (DB)
        ↓
exec: php artisan parser:run {job_id}
        ↓
RunParserJobCommand
        ↓
DatabaseParserService::run()
        ↓
Match job->type:
  - menu_only  → runMenuOnly()
  - category   → runSingleCategory(slug)
  - seller     → runSingleSeller(slug)
  - full       → runFull()
        ↓
HttpClient → sadovodbaza.ru (source)
        ↓
MenuParser / CatalogParser / ProductParser / SellerParser
        ↓
Save to DB: categories, products, sellers, product_photos, product_attributes
        ↓
(Optional) PhotoDownloadService::downloadBatch()
        ↓
Update parser_jobs, parser_logs
```

---

## 2. Source Handling

- **Single source**: https://sadovodbaza.ru (config: `config/sadovod.php`)
- **Config**: `SADAVOD_DONOR_URL`, `request_delay_ms`, `user_agent`, `verify_ssl`
- **No multi-source support** — hardcoded to sadovodbaza.ru
- **HTTP client**: `App\Services\SadovodParser\HttpClient` (Guzzle)
- **Rate limiting**: `request_delay_ms` (default 500ms) between requests

---

## 3. Parsers

| Parser | Purpose |
|--------|---------|
| MenuParser | Parse category menu from homepage |
| CatalogParser | Parse catalog listing pages |
| ProductParser | Parse product detail page |
| SellerParser | Parse seller page |
| DatabaseParserService | Orchestrates parsers, saves to DB |

**Technology**: Symfony DomCrawler, CSS selectors, HTML parsing. No headless browser.

---

## 4. Product Extraction

1. **Menu** → categories with URLs
2. **Catalog page** → product cards (links, titles, prices)
3. **Product page** → full data (description, photos, attributes, seller)
4. **Apply excluded_rules** to title/description
5. **Upsert** products by `external_id` (from source URL)
6. **Photos**: store URLs in `product_photos`, optionally download to `storage/app/photos`

---

## 5. Job Execution

- **Trigger**: `ParserController::start` → `exec("php artisan parser:run {$job->id} > log 2>&1 &")`
- **Process**: Background shell — no queue worker
- **Linux**: `exec(... &)` 
- **Windows**: WScript.Shell or proc_open (local dev)
- **Progress**: Stored in `parser_jobs`; polled via `/parser/status` or SSE `/parser/progress`

---

## 6. Error Handling

- **Exceptions**: Caught in `DatabaseParserService::run()`, job status → `failed`, `error_message` saved
- **parser_logs**: Logged via `$this->log('error', ...)`
- **Per-product errors**: Counted in `job->errors_count`, product may have `parse_error`
- **Photo download**: `photos_failed` in job, `download_status` in product_photos
- **failed_jobs**: For Laravel queue (queue not used for parser)

---

## 7. Categories & Parsing Limits

- `categories.linked_to_parser` — include in full parse
- `categories.parser_products_limit` — max products per category
- `categories.parser_max_pages` — max catalog pages
- `categories.parser_depth_limit` — depth in tree
- Job options override: `products_per_category`, `max_pages` from POST body

---

## 8. Photos

- **Storage**: `storage/app/photos` (config: `sadovod.photos_dir`)
- **Service**: `PhotoDownloadService::downloadBatch()`
- **Trigger**: Separate API `POST /parser/photos/download` or `save_photos` in start options
- **CDN**: Not configured; `cdn_url` column exists for future use

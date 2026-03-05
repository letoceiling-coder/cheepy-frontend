# MISSING_FEATURES — Gaps for Production Parser Integration

---

## 1. Admin ↔ Parser Integration

| Feature | Status | Description |
|---------|--------|-------------|
| ParserPage → real API | **Missing** | ParserPage uses mock; no calls to /parser/status, start, stop |
| Categories from API | **Missing** | Parser category filter uses mockCategories, not /categories |
| Parser config persistence | **Missing** | Admin form values not saved; no GET/PUT parser config API |
| Real-time logs | **Partial** | SSE /parser/progress exists; Admin doesn't subscribe |
| VITE_API_URL in prod | **Misconfigured** | Default sadavod.loc; must be online-parser URL |

---

## 2. Task Queue & Jobs

| Feature | Status | Description |
|---------|--------|-------------|
| Queue worker | **Not running** | Laravel queue uses DB; no `php artisan queue:work` |
| Parser via queue | **No** | Parser runs via exec(), not as queued job |
| Supervisor | **Not installed** | No process manager for queue workers |
| Job retries | **No** | Parser has no retry on transient failure |
| Job timeout | **No** | No timeout for long-running parse |

---

## 3. Scheduler & Cron

| Feature | Status | Description |
|---------|--------|-------------|
| Parser cron | **Missing** | No cron to run parsing on schedule |
| Cron config in admin | **Mock** | UI shows cron, not persisted or executed |
| Laravel scheduler | **Not used** | No `php artisan schedule:run` in cron |

---

## 4. Error Handling & Logging

| Feature | Status | Description |
|---------|--------|-------------|
| Parser error logs | **Partial** | parser_logs table; no centralized log viewer |
| Failed job alerts | **No** | No notification on parse failure |
| Retry on error | **No** | No automatic retry |
| Error aggregation | **No** | Errors scattered in parser_logs |

---

## 5. Progress & Monitoring

| Feature | Status | Description |
|---------|--------|-------------|
| Progress streaming | **Exists** | /parser/progress SSE |
| Admin progress UI | **Mock** | Fake progress, no SSE subscription |
| Parser health check | **No** | No /health or /up for parser |
| Dashboard real data | **Unclear** | Dashboard may use mock |

---

## 6. Parser Statistics

| Feature | Status | Description |
|---------|--------|-------------|
| Parse stats | **Partial** | In parser_jobs; no aggregated stats API |
| Products/day | **No** | No analytics |
| Parse duration history | **No** | No historical metrics |
| Error rate | **No** | Not tracked |

---

## 7. Feed & Source

| Feature | Status | Description |
|---------|--------|-------------|
| Multi-source | **No** | Single source sadovodbaza.ru |
| Feed validation | **No** | No validation of source structure |
| Source health | **No** | No check if source is reachable |
| Configurable source URL | **Partial** | Via .env SADAVOD_DONOR_URL |

---

## 8. Duplicate & Relevance

| Feature | Status | Description |
|---------|--------|-------------|
| Duplicate detection | **Basic** | By external_id only |
| Smart dedup | **No** | No fuzzy match, no cross-source dedup |
| Relevance check | **Partial** | is_relevant column; no cron for auto-check |
| Stale product cleanup | **No** | No job to hide/remove old products |

---

## 9. Photos

| Feature | Status | Description |
|---------|--------|-------------|
| Photo CDN | **No** | photos.siteaacess.store placeholder |
| Photo storage path | **Local** | storage/app/photos |
| Public photo URL | **Unclear** | Need symlink or nginx to serve |
| Batch download | **Exists** | POST /parser/photos/download |

---

## 10. Security & Rate Limiting

| Feature | Status | Description |
|---------|--------|-------------|
| API rate limit | **No** | Not implemented |
| Parser rate limit | **Partial** | request_delay_ms to source only |
| CORS | **Configurable** | FRONTEND_URL must include siteaacess.store |
| Admin auth | **JWT** | Exists; admin_users table |

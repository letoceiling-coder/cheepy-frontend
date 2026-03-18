# Admin Documentation Improvement Report

**Date:** 05.03.2025  
**Page:** /admin/docs

---

## Summary

Extended admin documentation with new sections and live system data display.

---

## New Sections

### 1. System Architecture

- Describes: Frontend, Backend, Redis, Queue, Workers, Parser engine, WebSocket (Reverb)
- Interaction flow: Admin UI → API → Redis queue → Workers → Donor
- ASCII diagram of component relationships
- Per-component details in extra list

### 2. Parser Workflow

- Step-by-step process:
  1. Parser start — ParserJob created, RunParserJob enqueued
  2. Category selection — linked_to_parser, limits
  3. Page parsing — catalog pages
  4. Product extraction — title, price, description, characteristics
  5. Seller extraction — upsertSeller, product.seller_id
  6. Image queue processing — DownloadPhotosJob
  7. Attribute extraction — product_attributes
  8. Product save — Product::upsertFromParser, excluded rules
- ASCII workflow diagram

### 3. Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Parser stopped | Job completed/failed or workers stopped | supervisorctl start all, queue:restart |
| Queue stuck | Workers down or job hang | Restart workers, check failed_jobs, Redis LLEN |
| Redis disconnected | Redis down or config | systemctl status redis, .env REDIS_* |
| WebSocket offline | Reverb not running | supervisorctl start reverb, reverb:restart |
| High CPU | Too many workers / heavy parsing | Reduce workers, parser_products_limit, request_delay_ms |

### 4. Dynamic System Info

- Card at top of /admin/docs
- Data from `GET /api/v1/system/status`
- Displays:
  - Parser status (Работает / Остановлен)
  - Queue workers count
  - Redis status
  - WebSocket status
  - CPU load
  - Memory usage
  - Disk usage (total/used/free GB)
- Auto-refresh every 10 seconds
- Fallback message if API returns 401 (auth required)

### 5. Parser Limits Explanation

- **parser_products_limit**: Max products per category (0 = no limit). Example: 100 stops after 100.
- **parser_max_pages**: Max catalog pagination pages (0 = no limit). Example: 5 = pages 1–5.
- **parser_depth_limit**: Subcategory tree depth (0 = full). Example: 2 = 2 levels deep.

### 6. Category Sync Explanation

- Sync categories from donor (sadovodbaza.ru)
- Button on /admin/categories
- API: POST /parser/categories/sync
- Logic: fetch donor → parse menu → create/update by slug → parent_id, source_url
- Does not delete categories with products
- Auto-sync on admin login if last sync > 24h

---

## Implementation

| File | Change |
|------|--------|
| src/admin/pages/DocsPage.tsx | Added 6 sections, DynamicSystemCard, diagrams |

---

## Data Source

Dynamic System Info uses:
- **Endpoint:** `/api/v1/system/status`
- **Refresh:** 10 seconds (refetchInterval)
- **Auth:** JWT (same as other admin API)

# Category Sync Source Refactor Report

**Date:** 05.03.2025  
**Change:** Use existing MenuParser instead of custom donor HTML parsing

---

## Summary

CategorySyncService refactored to use **MenuParser** — the same category source used by the parser (`runMenuOnly`) and the frontend. No duplicate HTML parsing.

---

## Step 1 — Category Source Identification

| Source | Endpoint/Service | Used by |
|--------|------------------|---------|
| GET /categories | /api/v1/categories?tree=true | Admin /admin/categories |
| GET /public/menu | /api/v1/public/menu | Public site, menu |
| MenuParser | App\Services\SadovodParser\Parsers\MenuParser | Parser runMenuOnly() |
| DatabaseParserService::runMenuOnly() | Internal | Parser job type=menu_only |

Categories displayed on online-parser.siteaacess.store come from the **categories** table, populated by **MenuParser** when `runMenuOnly` runs.

---

## Step 2 — Source Selection

**Chosen:** MenuParser (injected into CategorySyncService)

- Same logic as parser menu_only
- Returns structured category data
- No duplicate HTML crawling

**Alternative:** Call `DatabaseParserService::runMenuOnly()` — use if MenuParser doesn't expose `parse()` and saves directly.

---

## Step 3 — CategorySyncService Refactor

**Before:** Custom `parseDonorMenu()` — HTTP fetch + DomCrawler on sadovodbaza.ru

**After:** Inject `MenuParser`, call `parse()`, normalize and upsert

```php
public function __construct(
    protected MenuParser $menuParser
) {}

$sourceCategories = $this->menuParser->parse();
```

- Removed: `parseDonorMenu()`, Http, Crawler
- Added: `MenuParser` dependency, `normalizeItems()` for format adaptation
- Same sync logic: create/update by slug, parent_id, source_url, sort_order

---

## Step 4 — Fields Synced

| Field | Source | Notes |
|-------|--------|-------|
| name | MenuParser | mb_substr(499) |
| slug | MenuParser | external_slug |
| parent_id | Resolved from parent_slug | Tree hierarchy |
| source_url | MenuParser or base_url + slug | Full URL |
| sort_order | Incremental | Preserved |

---

## Step 5 — Tree Integrity

- `parent_id` resolved via slug→id map
- Parents processed before children (flat list with parent_slug)
- `products_count` recalculated after sync
- Categories with products are NOT deleted

---

## Step 6 — Admin / Categories

- Admin page: `categoriesApi.list({ tree: true })` → GET /categories?tree=true
- Same endpoint as frontend
- Sync button → POST /parser/categories/sync
- After sync: `queryClient.invalidateQueries(["categories"])` — tree refreshes

---

## Step 7 — Verification Script

- `scripts/verify-category-counts.cjs` — fetches /public/menu, counts nodes
- `scripts/verify-category-counts.sh` — curl examples for menu, admin, DB

```bash
node scripts/verify-category-counts.cjs https://online-parser.siteaacess.store/api/v1
```

---

## Step 8 — Files Changed

| File | Change |
|------|--------|
| docs/infrastructure/laravel/CategorySyncService.php | Use MenuParser, remove HTML parsing |
| docs/infrastructure/laravel/CategorySyncService_using_runMenuOnly.php.example | Alternative using runMenuOnly |
| src/admin/pages/DocsPage.tsx | Update Category Sync section text |
| scripts/verify-category-counts.cjs | Node verification script |
| scripts/verify-category-counts.sh | Shell verification script |

---

## MenuParser Contract

`MenuParser::parse()` should return array of:

```php
[
  ['name' => '...', 'slug' => '...', 'url' => '...', 'parent_slug' => '...' | null],
  // or: 'path', 'title', 'link', 'parent'
]
```

`normalizeItems()` adapts different formats. Adjust if MenuParser structure differs.

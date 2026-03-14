# Parser Category Configuration Report

**Date:** 2026-03-05  
**Pages:** /admin/categories, parser logic, queue

---

## 1. DB Changes

### 1.1 categories Table

**Current columns (relevant):**
| Column | Type | Description |
|--------|------|-------------|
| linked_to_parser | tinyint | Include in parsing (equivalent to parser_enabled) |
| parser_products_limit | int | Limit products per category |
| parser_max_pages | int | Max catalog pages |
| parser_depth_limit | int | Depth in tree |
| last_parsed_at | timestamp | Last parse time (equivalent to parser_last_run_at) |

**Field mapping:**
| Requested | Existing | Action |
|-----------|----------|--------|
| parser_enabled | linked_to_parser | Use as-is or add migration to rename |
| parser_products_limit | parser_products_limit | Exists |
| parser_max_pages | parser_max_pages | Exists |
| parser_depth_limit | parser_depth_limit | Exists |
| parser_last_run_at | last_parsed_at | Use as-is or add alias column |

**Optional migration** (if renaming for clarity):
```sql
-- Add parser_enabled as alias or replace linked_to_parser
ALTER TABLE categories ADD COLUMN parser_enabled TINYINT(1) DEFAULT 0;
UPDATE categories SET parser_enabled = linked_to_parser;
-- Or: ALTER TABLE categories RENAME COLUMN linked_to_parser TO parser_enabled;
```

### 1.2 parser_jobs Table

**Current structure:**
| Column | Description |
|--------|-------------|
| id | PK |
| type | full, menu_only, category, seller |
| options | JSON (categories, category_slug, etc.) |
| status | pending, running, completed, failed, cancelled |
| current_page | For resume |
| total_pages | Total catalog pages |
| parsed_products / saved_products | Products count |
| started_at | |
| finished_at | |
| current_category_slug | Active category |

**User-requested addition:**
```sql
ALTER TABLE parser_jobs ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER id;
ALTER TABLE parser_jobs ADD INDEX idx_parser_jobs_category (category_id);
```

*Note:* Per-category jobs can store `category_id` for clarity. Current design uses `options->category_slug` for single-category runs.

---

## 2. UI Changes

### 2.1 CategoriesPage (/admin/categories)

**Current:** Tree with enabled toggle, parser settings in expandable panel (depth, max_pages, products_limit). `linked_to_parser` shown as icon only.

**Required additions:**

1. **parser_enabled toggle** (linked_to_parser)
   - Switch per category to include/exclude from parser
   - Call `PATCH /categories/:id` with `linked_to_parser: boolean`

2. **Parser panel per category**
   - Toggle: parser_enabled (linked_to_parser)
   - Input: max_pages
   - Input: products_limit
   - Input: depth_limit
   - Optional: last_parsed_at (read-only)

**Example UI:**
```
[Category Name] [slug] [parser_enabled: ✓] [depth] [pages] [limit] [enabled] [Парсер ▼]
  └─ Expand: Глубина: [__]  Макс. страниц: [__]  Лимит товаров: [__]  Включить парсер: [✓]
```

**API:** `categoriesApi.update(id, { linked_to_parser, parser_depth_limit, parser_max_pages, parser_products_limit })` — already supported.

---

## 3. Parser Logic

### 3.1 Load Enabled Categories

```php
$categories = Category::where('linked_to_parser', true) // or parser_enabled
    ->where('enabled', true)
    ->orderBy('sort_order')
    ->get();
```

### 3.2 Job Per Category (optional)

```php
foreach ($categories as $category) {
    RunParserJob::dispatch($jobId, $category->id, [
        'category_slug' => $category->external_slug ?? $category->slug,
        'parser_products_limit' => $category->parser_products_limit,
        'parser_max_pages' => $category->parser_max_pages,
        'parser_depth_limit' => $category->parser_depth_limit,
    ]);
}
```

### 3.3 Full vs Per-Category

- **Full parse:** One job, loops categories in `linked_to_parser = true`.
- **Per-category:** One job per category, each with `category_id` and limits from DB.

---

## 4. Queue Behavior

### 4.1 RunParserJob

```php
class RunParserJob implements ShouldQueue
{
    public $tries = 5;
    public $backoff = [10, 60, 300];  // seconds between retries

    public function handle(): void
    {
        $job = ParserJob::find($this->jobId);
        if (!$job || $job->status === 'cancelled') return;

        // Load categories WHERE linked_to_parser = true
        // Resume from current_page if status = running and job was interrupted
    }
}
```

### 4.2 Retry

- Failed job retries 5 times.
- Backoff: 10s, 60s, 300s between attempts.
- On final failure: mark job as `failed`, log error.

---

## 5. Resume Strategy

### 5.1 Persisted State

- `parser_jobs.current_page` — last processed page
- `parser_jobs.current_category_slug` — current category
- `parser_jobs.parsed_products` — count so far

### 5.2 Resume Logic

```php
$startPage = $job->current_page;  // 0 or last page before stop
$startCategoryIndex = 0;
$categories = Category::where('linked_to_parser', true)->get();

foreach ($categories as $i => $cat) {
    if ($cat->slug === $job->current_category_slug) {
        $startCategoryIndex = $i;
        break;
    }
}

for ($i = $startCategoryIndex; $i < $categories->count(); $i++) {
    $cat = $categories[$i];
    $fromPage = ($i === $startCategoryIndex) ? $startPage : 1;
    for ($page = $fromPage; $page <= $maxPages; $page++) {
        // Parse page, update job.current_page, job.current_category_slug
        $job->update(['current_page' => $page, 'current_category_slug' => $cat->slug]);
    }
}
```

### 5.3 On Stop

- `POST /parser/stop` sets `status = cancelled`, `finished_at = now()`.
- `current_page` and `current_category_slug` stay as last values.
- Next run can check for `status = cancelled` with partial progress and optionally resume (or start fresh).

---

## 6. Summary

| Area | Status | Action |
|------|--------|--------|
| DB categories | Exists | Use linked_to_parser, parser_* limits, last_parsed_at |
| DB parser_jobs | Exists | Optional: add category_id |
| Admin UI | Partial | Add parser_enabled (linked_to_parser) toggle |
| Parser logic | Partial | Ensure SELECT WHERE linked_to_parser = true |
| Queue retries | Add | $tries = 5, $backoff = [10, 60, 300] |
| Resume | Partial | Use current_page, current_category_slug |

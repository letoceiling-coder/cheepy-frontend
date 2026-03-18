# Category Sync Implementation Report

**Date:** 05.03.2025  
**Donor:** https://sadovodbaza.ru  
**Admin:** https://siteaacess.store/admin/categories

---

## Summary

Implemented category sync from donor: parse menu, build tree, sync to DB. Frontend button + auto sync on login.

---

## Donor Parsing Logic

1. **Fetch** main catalog page: `GET {base_url}/`
2. **Extract** category links: `a[href*="/"]` — paths like `/odejda`, `/odejda/kurtki`
3. **Build flat list** with:
   - `name` — from link text or slug
   - `slug` — path (e.g. `odejda/kurtki`)
   - `url` — full `https://sadovodbaza.ru/odejda`
   - `parent_slug` — parent path for hierarchy (e.g. `odejda` for `odejda/kurtki`)

**Example:**
```
/odejda        → Одежда (parent: null)
/odejda/kurtki → Куртки (parent: odejda)
/odejda/platya → Платья (parent: odejda)
```

---

## Database Sync Logic

1. **For each donor category:**
   - If slug not exists → **create** (name, slug, external_slug, source_url, parent_id)
   - If slug exists → **update** (name, parent_id, source_url)

2. **Do NOT delete** categories that have products

3. **parent_id:** Resolve parent by parent_slug → category id (parents processed first)

4. **source_url:** `https://sadovodbaza.ru/{path}`

5. **products_count:** Recalculated after sync from products table

---

## Tree Rebuild

- `parent_id` set for each category from parent_slug
- `sort_order` maintained
- `products_count` updated via `SELECT category_id, COUNT(*) FROM products GROUP BY category_id`

---

## Admin Integration

### Button

- **Page:** /admin/categories
- **Label:** Синхронизировать категории
- **Action:** `POST /api/v1/parser/categories/sync`
- **On success:** Refetch categories, toast with created/updated counts

### Auto Sync on Login

- When admin logs in: check `localStorage.categories_last_sync`
- If missing or > 24h ago → call sync in background (non-blocking)
- Store `last_synced_at` from response in localStorage

---

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/parser/categories/sync | Sync categories from donor |

**Response:**
```json
{
  "message": "Categories synced",
  "created": 5,
  "updated": 12,
  "last_synced_at": "2025-03-05T12:00:00.000000Z"
}
```

---

## Backend Implementation

Reference files:

- `docs/infrastructure/laravel/CategorySyncController.php` — route handler
- `docs/infrastructure/laravel/CategorySyncService.php` — parsing + sync logic
- `scripts/add-category-sync-route.php` — route snippet

**Required:**
- `categories.source_url` column (or `url`) — add migration if missing
- Route: `POST parser/categories/sync` with `auth:sanctum`
- `config('sadovod.base_url')` = https://sadovodbaza.ru

**Donor selectors** in CategorySyncService may need tuning for actual sadovodbaza.ru HTML structure (nav, sidebar, footer links). Adjust `$crawler->filter(...)` to match real DOM.

---

## Files Changed

| File | Change |
|------|--------|
| src/lib/api.ts | Added parserApi.categoriesSync() |
| src/admin/pages/CategoriesPage.tsx | Sync button + mutation |
| src/admin/contexts/AdminAuthContext.tsx | Auto sync on login if > 24h |
| docs/infrastructure/laravel/CategorySyncController.php | New |
| docs/infrastructure/laravel/CategorySyncService.php | New |
| scripts/add-category-sync-route.php | Route snippet |

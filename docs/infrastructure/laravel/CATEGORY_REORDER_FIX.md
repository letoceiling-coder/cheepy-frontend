# FIX: PATCH `/admin/catalog/categories/reorder` (500)

## Cause (typical)

1. **Route shadowing**: `PATCH categories/reorder` matched `categories/{id}` with `id = "reorder"` → `update(int $id)` → **TypeError → 500**.
2. **Fix**: Register `categories/reorder` **before** `categories/{id}` **and** add `->whereNumber('id')` on `{id}` routes.

## Apply on Laravel server

Copy from this repo:

- `app/Http/Controllers/Api/Admin/AdminCatalogCategoryController.php` → method `reorder()`
- `routes/admin_catalog.php` → order of routes + `whereNumber('id')`

Then:

```bash
php artisan route:clear
php artisan optimize:clear
```

## Test (replace TOKEN and host)

Full path is usually under API prefix, e.g. `/api/v1/admin/catalog/categories/reorder`:

```bash
curl -sS -X PATCH "https://online-parser.siteaacess.store/api/v1/admin/catalog/categories/reorder" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '[{"id":1,"sort_order":0},{"id":2,"sort_order":1}]'
```

Expected: **200** `{"success":true}`. Validation error: **422**. Wrong route still: check `php artisan route:list | grep categories`.

## Logs

```bash
tail -100 storage/logs/laravel.log | grep -i reorder
```

After fix, reorder should not log errors on success.

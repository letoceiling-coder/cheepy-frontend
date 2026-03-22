# CRM System Products — Deploy Instructions

## Summary

- **Frontend** (this repo): CrmModerationPage + CrmProductsPage use real API
- **Backend** (Laravel): Add `system-products` endpoints

## Step 1 — Backend patch (on server)

```bash
cd /var/www/siteaacess.store
BACKEND_PATH=/var/www/online-parser.siteaacess.store bash scripts/patch-system-products-backend.sh
```

Then add to Laravel `routes/api.php` (inside API prefix + auth group):

```php
require base_path('routes/admin_system_products.php');
```

Example (if your api.php has):

```php
Route::prefix('api/v1')->middleware(['auth:sanctum'])->group(function () {
    // ... existing routes ...
    require base_path('routes/admin_system_products.php');
});
```

Or if you use JWT: replace `auth:sanctum` with your JWT guard name.

Then:

```bash
cd /var/www/online-parser.siteaacess.store
php artisan route:clear
php artisan optimize:clear
```

## Step 2 — Verify DB

```sql
SELECT count(*) FROM system_products;
```

If table is empty, API will return `{ "data": [], "meta": {...} }` — no error.

## Step 3 — Deploy frontend

```bash
git add .
git commit -m "feat: crm products real API integration"
git push

ssh root@85.117.235.93 "bash /var/www/deploy-cheepy.sh"
```

## Step 4 — Verification

1. **Get JWT** (login at https://siteaacess.store/admin/login or CRM)

2. **curl GET system-products:**
```bash
TOKEN="YOUR_JWT"
curl -s "https://online-parser.siteaacess.store/api/v1/admin/system-products" \
  -H "Authorization: Bearer $TOKEN" | jq
```

3. **curl GET pending:**
```bash
curl -s "https://online-parser.siteaacess.store/api/v1/admin/system-products?status=pending" \
  -H "Authorization: Bearer $TOKEN" | jq
```

4. **Screenshots:** /crm/moderation and /crm/products with real data

5. **DB proof:** `SELECT count(*) FROM system_products;` on server

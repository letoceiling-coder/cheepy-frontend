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

## Step 3 — Deploy

```bash
git add .
git commit -m "feat: system products real integration"
git push

ssh root@85.117.235.93 "bash /var/www/deploy-cheepy.sh"
```

**Важно:** Перед деплоем добавьте в Laravel `routes/api.php` (один раз, вручную на сервере):
```php
require base_path('routes/admin_system_products.php');
```
(внутри группы с prefix api/v1 и auth middleware)

## Step 4 — Verification (STRICT, SERVER ONLY)

### 1. LOGIN → JWT
```bash
curl -s -X POST "https://online-parser.siteaacess.store/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}' | jq -r '.token'
```

### 2. API CHECK
```bash
TOKEN="YOUR_JWT"
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://online-parser.siteaacess.store/api/v1/admin/system-products?per_page=2" | jq
```
**Expected:** JSON with `data` array, each item: id, name, category, status, created_at.

### 3. DB CHECK
```bash
ssh root@85.117.235.93 "mysql sadavod_parser -e 'SELECT COUNT(*) FROM system_products;'"
```

### 4. UI PROOF
- https://siteaacess.store/crm/moderation — REAL data (no mock)
- https://siteaacess.store/crm/products — REAL data (no mock)

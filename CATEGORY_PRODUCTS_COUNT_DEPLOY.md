# Category Products Count — Deploy & Verification

## Summary

- **Backend:** `products_count` added to `GET /api/v1/admin/catalog/categories` (subquery from `system_products` where `category_id = catalog_categories.id`)
- **Frontend:** New "Товары" column with counts, colors (gray/green/accent), tooltip
- **JS hash after build:** `index-BW0HfF1S.js`

---

## Deploy Steps

### 1. Backend patch (REQUIRED for products_count)

On the server, the backend is at `/var/www/online-parser.siteaacess.store`.  
Apply the patch:

```bash
# SSH to server, then:
cd /var/www/siteaacess.store
git pull origin main

# Apply backend patch (requires system_products table with category_id column)
BACKEND_PATH=/var/www/online-parser.siteaacess.store php scripts/patch-catalog-products-count.php
```

If the patch fails (e.g. file structure differs), manually copy `listPaginated` from:
`docs/infrastructure/laravel/app/Services/Catalog/CatalogCategoryService.php`

**Prerequisite:** Table `system_products` must exist with `category_id` FK to `catalog_categories.id`.  
If it does not exist, the API will error; either create the table or do not apply the patch (frontend will show "—" for counts).

### 2. Deploy

```bash
bash /var/www/deploy-cheepy.sh
```

This will pull both backend and frontend, build frontend, reload nginx.

### 3. Verify deploy

```bash
curl -sL https://siteaacess.store | grep -oE 'index-[^"]+\.js'
# Expected: index-BW0HfF1S.js (or newer after rebuild)
```

---

## Verification

### API

```bash
# Login
TOKEN=$(curl -s -X POST "https://online-parser.siteaacess.store/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sadavod.loc","password":"admin123"}' | jq -r '.token')

# Get categories with products_count
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://online-parser.siteaacess.store/api/v1/admin/catalog/categories?per_page=5" | jq '.data[0]'
```

Expected: `products_count` present (number). If backend not patched, it will be absent.

### DB count match

```sql
SELECT id, name, (SELECT COUNT(*) FROM system_products WHERE category_id = catalog_categories.id) AS products_count
FROM catalog_categories
LIMIT 5;
```

Compare with API response.

### UI

- Open https://siteaacess.store/crm/categories
- Column "Товары": 0 → "Нет товаров" (gray), 1+ → "X товаров" (green), 10+ → badge (accent)
- Hover → tooltip "В этой категории находится X товаров"

# CRM System Products — Real API (No Patch)

## Summary

- **Backend** (cheepy-backend): system-products routes in Git, deployed via deploy-cheepy.sh
- **Frontend** (cheepy-frontend): CrmModerationPage + CrmProductsPage use real API

## Backend (cheepy-backend repo)

Routes are in `routes/admin_system_products.php`, required from `routes/api.php` inside v1 + JWT group.

- GET `/api/v1/admin/system-products`
- GET `/api/v1/admin/system-products?status=pending`
- GET `/api/v1/admin/system-products/{id}`
- PATCH `/api/v1/admin/system-products/{id}`

## Deploy (strict)

```bash
# Backend repo
cd /path/to/cheepy-backend  # or sadavod-laravel
git add .
git commit -m "fix: system products backend real integration (no patch)"
git push

# Frontend repo
cd /path/to/cheepy-frontend
git add .
git commit -m "fix: system products backend real integration (no patch)"
git push

# Server
ssh root@85.117.235.93 "bash /var/www/deploy-cheepy.sh"
```

## Verification (server only)

### 1. Routes
```bash
ssh root@85.117.235.93 "cd /var/www/online-parser.siteaacess.store && php artisan route:list | grep system-products"
```
Expected: `GET api/v1/admin/system-products`, `PATCH api/v1/admin/system-products/{id}`

### 2. Login → JWT
```bash
curl -s -X POST "https://online-parser.siteaacess.store/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}' | jq -r '.token'
```

### 3. API
```bash
TOKEN="YOUR_JWT"
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://online-parser.siteaacess.store/api/v1/admin/system-products?per_page=2" | jq
```

### 4. UI
- https://siteaacess.store/crm/moderation
- https://siteaacess.store/crm/products

## No patch scripts

❌ scripts/patch-system-products-backend.sh — DELETED

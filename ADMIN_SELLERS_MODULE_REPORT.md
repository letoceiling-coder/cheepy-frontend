# Admin Sellers Module Report

**Date:** 05.03.2025  
**Frontend:** https://siteaacess.store  
**Backend:** https://online-parser.siteaacess.store  
**Admin panel:** /admin

---

## Summary

Full sellers management system implemented in the admin panel.

---

## API Endpoints

### Existing (used)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/sellers` | List sellers (search, pavilion, page, per_page) |
| GET | `/api/v1/sellers/{id}` | Seller detail (by id or slug) |
| GET | `/api/v1/sellers/{id}/products` | Seller products |
| PATCH | `/api/v1/sellers/{id}` | Update seller |
| GET | `/api/v1/products` | Products list (with seller_id filter) |

### Admin endpoints (optional)

If backend adds `/admin/sellers` prefix:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/sellers` | List (search, pavilion, pagination) |
| GET | `/api/v1/admin/sellers/{id}` | Detail + products_count + products_preview |
| GET | `/api/v1/admin/sellers/{id}/products` | Products (category, status, price filters) |

Reference implementation: `docs/infrastructure/laravel/AdminSellerController.php`

---

## Database

### sellers table (required fields)

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| name | varchar(500) | |
| slug | varchar(300) | unique |
| avatar | varchar(500) | nullable (optional) |
| pavilion | varchar(300) | nullable |
| source_url | varchar(500) | nullable |
| phone | varchar(50) | nullable |
| description | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### Indexes

- INDEX on slug
- INDEX on name

Migration stub: `scripts/add-sellers-admin-migration.php`

---

## UI Pages

### 1. Sellers List (`/admin/sellers`)

- **Route:** `src/admin/pages/SellersPage.tsx`
- **Filters:** Search, pavilion (text input)
- **Table columns:** Avatar, Seller name, Pavilion, Products count, Created, Actions
- **Pagination:** 20 per page (default)
- **Actions:** View seller (link to detail)

### 2. Seller Detail (`/admin/sellers/:id`)

- **Route:** `src/admin/pages/SellerDetailPage.tsx`
- **Components:** `SellerHeader`, statistics block, `SellerProductsTable`
- **Header:** Avatar, name, pavilion, source link, phone, description
- **Statistics:** Products count, Last parsed

### 3. Seller Products (in detail page)

- **Component:** `SellerProductsTable`
- **Filters:** Search, Category, Status
- **Table:** Product, Category, Price, Status, Created, Link to product
- **Pagination:** 30 per page (default)
- **Data source:** `productsApi.list({ seller_id })`

---

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| SellerHeader | `src/admin/components/SellerHeader.tsx` | Seller info block |
| SellerProductsTable | `src/admin/components/SellerProductsTable.tsx` | Products table with filters |
| SellersPage | `src/admin/pages/SellersPage.tsx` | List page |
| SellerDetailPage | `src/admin/pages/SellerDetailPage.tsx` | Detail page |

---

## Navigation

Added to admin sidebar (`AdminSidebar.tsx`):

- **Продавцы** — `/admin/sellers` (Store icon)
- Order: Dashboard, Parser, Products, Categories, **Sellers**, Brands, Filters, AI, etc.

---

## Filters & Pagination

| Page | Filters | Default per page |
|------|---------|------------------|
| Sellers list | search, pavilion | 20 |
| Seller products | search, category, status | 30 |

---

## Frontend API (api.ts)

```ts
sellersApi.list({ search?, pavilion?, page?, per_page? })
sellersApi.get(idOrSlug)
sellersApi.products(idOrSlug, { page?, per_page?, category_id?, status?, search?, sort_by?, sort_dir? })
productsApi.list({ seller_id, ... })  // used for seller products with filters
```

---

## Files Changed / Created

- `src/lib/api.ts` — extended Seller, AdminSellerProductsParams, sellersApi
- `src/admin/pages/SellersPage.tsx` — new
- `src/admin/pages/SellerDetailPage.tsx` — new
- `src/admin/components/SellerHeader.tsx` — new
- `src/admin/components/SellerProductsTable.tsx` — new
- `src/admin/components/AdminSidebar.tsx` — added Sellers menu
- `src/App.tsx` — added routes
- `scripts/add-sellers-admin-migration.php` — migration for avatar + indexes
- `scripts/add-admin-sellers-routes.php` — route reference
- `docs/infrastructure/laravel/AdminSellerController.php` — reference controller

---

## Deploy

1. Commit and push frontend
2. Run deploy script
3. (Optional) Add backend migration and AdminSellerController if using /admin/sellers routes
4. Ensure existing `/sellers` and `/products` endpoints support: `pavilion` filter (sellers), `seller_id` (products)

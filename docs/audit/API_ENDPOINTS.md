# API_ENDPOINTS — Parser & Admin API

**Base URL**: `https://online-parser.siteaacess.store/api/v1`  
**Auth**: JWT Bearer (for admin endpoints) — `Authorization: Bearer {token}`  
**Public**: No auth for `/public/*`

---

## PUBLIC API (no auth)

| Method | Endpoint | Parameters | Response |
|--------|----------|------------|----------|
| GET | `/public/menu` | — | `{ categories: Category[] }` |
| GET | `/public/categories/{slug}/products` | page, per_page, sort_by, search, price_from, price_to | Category + products + filters |
| GET | `/public/products/{externalId}` | — | `{ product, seller_products }` |
| GET | `/public/sellers/{slug}` | page | `{ seller, data, meta }` |
| GET | `/public/search` | q, page, per_page | `{ query, data, meta }` |
| GET | `/public/featured` | limit | `{ data: Product[] }` |

---

## AUTH

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | — (JWT) | `{ user }` |
| POST | `/auth/refresh` | — (JWT) | `{ token }` |

---

## PARSER (JWT required)

| Method | Endpoint | Parameters | Response |
|--------|----------|------------|----------|
| GET | `/parser/status` | — | `{ is_running, current_job, last_completed }` |
| GET | `/parser/progress` | job_id (opt) | SSE stream of job progress |
| GET | `/parser/jobs` | page, per_page | Paginated jobs |
| GET | `/parser/jobs/{id}` | — | Job + logs |
| POST | `/parser/start` | type, categories, linked_only, products_per_category, max_pages, no_details, save_photos, save_to_db, category_slug, seller_slug | `{ message, job_id, job }` |
| POST | `/parser/stop` | — | `{ message, job_id }` |
| POST | `/parser/photos/download` | limit, product_id | `{ message, products, downloaded, failed, skipped }` |

**POST /parser/start body:**
```json
{
  "type": "full|menu_only|category|seller",
  "categories": ["slug1", "slug2"],
  "linked_only": false,
  "products_per_category": 0,
  "max_pages": 0,
  "no_details": false,
  "save_photos": false,
  "save_to_db": true,
  "category_slug": "electronics",
  "seller_slug": "seller-1"
}
```

---

## DASHBOARD (JWT)

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/dashboard` | Products/categories/sellers/parser stats, weekly_stats, top_categories, recent_logs |

---

## PRODUCTS (JWT)

| Method | Endpoint | Parameters |
|--------|----------|------------|
| GET | `/products` | search, status, category_id, seller_id, photos_only, no_photos, price_from, price_to, is_relevant, sort_by, sort_dir, page, per_page |
| GET | `/products/{id}` | — |
| PATCH | `/products/{id}` | Partial product |
| DELETE | `/products/{id}` | — |
| POST | `/products/bulk` | `{ ids, action: delete|hide|publish }` |

---

## CATEGORIES (JWT)

| Method | Endpoint | Parameters |
|--------|----------|------------|
| GET | `/categories` | tree, search, enabled_only, per_page |
| GET | `/categories/{id}` | — |
| PATCH | `/categories/{id}` | Partial category |
| POST | `/categories/reorder` | `{ items: [{ id, sort_order, parent_id }] }` |
| GET | `/categories/{id}/filters` | — |

---

## SELLERS (JWT)

| Method | Endpoint | Parameters |
|--------|----------|------------|
| GET | `/sellers` | search, status, has_products, page, per_page |
| GET | `/sellers/{slug}` | — |
| GET | `/sellers/{slug}/products` | page |
| PATCH | `/sellers/{id}` | Partial seller |

---

## BRANDS (JWT)

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/brands` | search, status, page |
| GET | `/brands/{id}` | — |
| POST | `/brands` | Partial brand |
| PUT | `/brands/{id}` | Full brand |
| DELETE | `/brands/{id}` | — |

---

## EXCLUDED RULES (JWT)

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/excluded` | scope, type, active_only, per_page |
| POST | `/excluded` | Rule object |
| PUT | `/excluded/{id}` | Rule object |
| DELETE | `/excluded/{id}` | — |
| POST | `/excluded/test` | `{ text, field?, category_id? }` |

---

## FILTERS (JWT)

| Method | Endpoint | Parameters |
|--------|----------|------------|
| GET | `/filters` | category_id, active_only |
| POST | `/filters` | Filter config |
| PUT | `/filters/{id}` | Filter config |
| DELETE | `/filters/{id}` | — |
| GET | `/filters/{categoryId}/values` | — |

---

## LOGS (JWT)

| Method | Endpoint | Parameters |
|--------|----------|------------|
| GET | `/logs` | level, module, job_id, search, page, per_page |
| DELETE | `/logs/clear` | before (date) |

---

## SETTINGS (JWT)

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/settings` | group (query) |
| PUT | `/settings` | `{ settings: Record }` |
| PUT | `/settings/{key}` | `{ value, group }` |

---

## Authentication

- **Login**: `POST /auth/login` → receive JWT
- **Header**: `Authorization: Bearer {token}`
- **Storage**: Admin stores in `localStorage.admin_token`
- **CORS**: `FRONTEND_URL` env — must include `https://siteaacess.store` for admin

---

## Rate Limits

- **Not implemented** — no rate limiting in parser API
- **Source**: `request_delay_ms` in parser only (between requests to sadovodbaza.ru)

---

## Missing Endpoints for Integration

- `GET /parser/config` — get current parser config (from settings/categories)
- `PUT /parser/config` — save parser config
- `GET /parser/cron` — get cron schedule
- `PUT /parser/cron` — set cron schedule
- Webhook for job completion (admin would need to poll or use SSE)

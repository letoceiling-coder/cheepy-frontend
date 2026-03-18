# Products Management

## Purpose

The Products page (`/admin/products`) lists parsed products with filters, pagination, and bulk actions.

## Features

- **List view**: table with thumbnail, title, price, status, category, seller
- **Filters**: search, status (all/active/hidden/excluded/error/pending), category, seller
- **Pagination**: page + per_page (default 20)
- **Bulk actions**: delete, publish (hide/unhide)
- **Row actions**: view detail, link to source

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/products` | List products. Query: `search`, `status`, `category_id`, `seller_id`, `page`, `per_page`, etc. |
| GET | `/api/v1/products/:id` | Product detail (full) |
| PATCH | `/api/v1/products/:id` | Update product (status, etc.) |
| DELETE | `/api/v1/products/:id` | Delete product |
| POST | `/api/v1/products/bulk` | Bulk action. Body: `{ ids: number[], action: 'delete' \| 'hide' \| 'publish' }` |

## Product Status

- `active` — visible
- `hidden` — hidden
- `excluded` — excluded by rule
- `error` — parse error
- `pending` — not yet processed

## Filters (Query Params)

- `search` — text search
- `status` — filter by status
- `category_id` — filter by category
- `seller_id` — filter by seller
- `photos_only`, `no_photos` — photo presence
- `price_from`, `price_to` — price range
- `is_relevant` — relevance flag
- `sort_by`, `sort_dir` — sorting

# Database Audit (Production)

Primary DB engine: MariaDB 10.11  
Database name: `sadavod_parser`  
Connection host (app): `127.0.0.1:3306`  
Access model: local-only bind (`127.0.0.1`, not public)

## Current Capacity Snapshot

From `php artisan db:show --counts`:

- Total tables: 30
- Total DB size: ~2.24 GB

Largest tables:

- `products` - ~49,031 rows, ~1.31 GB
- `product_photos` - ~2,133,700 rows, ~827.98 MB
- `product_attributes` - ~208,132 rows, ~93.66 MB
- `parser_logs` - ~55,154 rows, ~20.09 MB
- `parser_jobs` - ~5,801 rows, ~2.84 MB

## Core Functional Domains

- Catalog:
  - `categories`
  - `sellers`
  - `brands`
  - `products`
  - `product_attributes`
  - `product_photos`
- Parser runtime/control:
  - `parser_jobs`
  - `parser_progress`
  - `parser_logs`
  - `parser_settings`
  - `parser_state`
- Auth/admin:
  - `admin_users`
  - `roles`, `role_user`
- Queue/session/cache:
  - `jobs`, `failed_jobs`, `job_batches`
  - `sessions`
  - `cache`, `cache_locks`

## Main Relationships

- `products.category_id -> categories.id` (nullable FK)
- `products.seller_id -> sellers.id` (nullable FK)
- `products.brand_id -> brands.id` (nullable FK)
- `product_attributes.product_id -> products.id` (cascade delete)
- `product_attributes.category_id -> categories.id` (nullable FK)
- `product_photos.product_id -> products.id` (cascade delete)
- `parser_progress.job_id -> parser_jobs.id` (set null on delete)
- `parser_logs.job_id -> parser_jobs.id` (set null on delete)
- `categories.parent_id -> categories.id` (self hierarchy, nullable)

## Important Table Notes

### `products`

- Unique key: `external_id`
- Contains parser payload + normalized fields:
  - title/description/price
  - relations to category/seller/brand
  - parsed status and relevance flags
- Indexed by status, parsed_at, price_raw, color, relevance.

### `product_photos`

- High-volume table (2M+ rows)
- Tracks source URL, local path, hash, dimensions, status
- Compound index on `(product_id, sort_order)`.

### `product_attributes`

- Stores normalized attributes as key-value pairs
- Indexed for filtering:
  - `attr_name`
  - `attr_value`
  - `(attr_name, attr_value)`
  - `(category_id, attr_name)`
  - `(product_id, attr_name)`

### `parser_jobs`

- Tracks parser execution lifecycle:
  - status
  - progress counters
  - current action/page/category
  - started/finished timestamps
- Indexed by `status` and `created_at`.

### `parser_logs`

- Central parser event/error log
- Supports `level`, `type`, `module`, `message`, URL/product/attempt context
- Indexed for diagnostics by `(level, logged_at)`, `(module, logged_at)`, `type`.

### `parser_settings` / `parser_state`

- `parser_settings` is singleton-style runtime config row (timeouts/delays/workers/proxy/queue threshold flags)
- `parser_state` controls daemon state machine (`running`, `stopped`, `paused`, `paused_network`).

## Logical Schema (Simplified)

```text
categories (self tree)
    ^
    |
products -----> sellers
    |              ^
    |              |
    +-----> brands |
    |
    +-----> product_attributes
    |
    +-----> product_photos

parser_jobs
  | \
  |  \-> parser_logs
  \----> parser_progress

parser_settings (singleton)
parser_state    (singleton)
```

## Operational Observations

- Current schema is parser-centric and production-populated.
- `product_photos` dominates storage; retention/archival policies should be planned.
- Parser diagnostics tables (`parser_logs`, `parser_jobs`, `parser_progress`) provide good observability baseline for admin and incident analysis.

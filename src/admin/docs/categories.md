# Categories Management

## Purpose

The Categories page (`/admin/categories`) manages the hierarchical category tree and parser linkage.

## Structure

- **Tree view**: parent/child categories with expand/collapse
- **Per category**:
  - Name, slug
  - `enabled` toggle
  - `linked_to_parser` — whether parser includes this category
  - Parser limits: depth, max pages, products per category

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/categories` | List categories. Query: `tree`, `search`, `enabled_only`, `per_page` |
| GET | `/api/v1/categories/:id` | Category detail + parent + parser_settings |
| PATCH | `/api/v1/categories/:id` | Update category (enabled, linked_to_parser, parser_depth_limit, etc.) |
| POST | `/api/v1/categories/reorder` | Reorder. Body: `{ items: [{ id, sort_order, parent_id? }] }` |
| GET | `/api/v1/categories/:id/filters` | Available filters for category |

## Parser Linkage

- `linked_to_parser`: category is included in parser runs
- `parser_depth_limit`, `parser_max_pages`, `parser_products_limit`: limits for parsing

## Hierarchical Structure

- Categories have `parent_id` (null for root)
- Frontend displays tree with `children` from API
- Reorder updates `sort_order` and optionally `parent_id`

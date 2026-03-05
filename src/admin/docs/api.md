# Admin API Reference

Base URL: `https://online-parser.siteaacess.store/api/v1`

All endpoints (except login) require: `Authorization: Bearer <token>`

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Login (public). Body: email, password |
| GET | /auth/me | Current user |
| POST | /auth/refresh | Refresh token |

## Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | /dashboard | Dashboard data (products, categories, parser, logs) |

## Parser

| Method | Path | Description |
|--------|------|-------------|
| GET | /parser/status | is_running, current_job, last_completed |
| GET | /parser/stats | products_total, parser_running, queue_size |
| POST | /parser/start | Start parser job |
| POST | /parser/stop | Stop parser |
| GET | /parser/jobs | Job history (paginated) |
| GET | /parser/jobs/:id | Job detail + logs |
| GET | /parser/progress | SSE stream (job_id, token in query) |
| POST | /parser/photos/download | Download photos |

## Products

| Method | Path | Description |
|--------|------|-------------|
| GET | /products | List (filters, pagination) |
| GET | /products/:id | Detail |
| PATCH | /products/:id | Update |
| DELETE | /products/:id | Delete |
| POST | /products/bulk | Bulk action (delete, hide, publish) |

## Categories

| Method | Path | Description |
|--------|------|-------------|
| GET | /categories | List (tree, search) |
| GET | /categories/:id | Detail |
| PATCH | /categories/:id | Update |
| POST | /categories/reorder | Reorder |
| GET | /categories/:id/filters | Available filters |

## Brands

| Method | Path | Description |
|--------|------|-------------|
| GET | /brands | List |
| GET | /brands/:id | Detail |
| POST | /brands | Create |
| PUT | /brands/:id | Update |
| DELETE | /brands/:id | Delete |

## Excluded Rules

| Method | Path | Description |
|--------|------|-------------|
| GET | /excluded | List |
| POST | /excluded | Create |
| PUT | /excluded/:id | Update |
| DELETE | /excluded/:id | Delete |
| POST | /excluded/test | Test rule |

## Filters

| Method | Path | Description |
|--------|------|-------------|
| GET | /filters | List (optional category_id) |
| POST | /filters | Create |
| PUT | /filters/:id | Update |
| DELETE | /filters/:id | Delete |
| GET | /filters/:categoryId/values | Values for category |

## Logs

| Method | Path | Description |
|--------|------|-------------|
| GET | /logs | List (level, module, job_id) |
| DELETE | /logs/clear | Clear logs |

## Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | /settings | All settings (optional group) |
| PUT | /settings | Update multiple |
| PUT | /settings/:key | Update one |

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | /up | Health check (public) |
| GET | /ws-status | WebSocket + Redis + queue status (public) |
| GET | /system/status | Full system status (if deployed) |

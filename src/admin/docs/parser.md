# Parser Control Panel

## Purpose

The Parser page (`/admin/parser`) controls the product parser: start, stop, and monitor progress in real time via SSE or WebSocket.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/parser/start` | Start parser. Body: type, category_slug, save_photos, save_to_db, no_details, linked_only, products_per_category, max_pages |
| POST | `/api/v1/parser/stop` | Stop current job |
| GET | `/api/v1/parser/status` | Current job + last completed |
| GET | `/api/v1/parser/stats` | Aggregated stats |
| GET | `/api/v1/parser/jobs` | Job history (paginated) |
| GET | `/api/v1/parser/jobs/:id` | Job detail with logs |
| GET | `/api/v1/parser/progress?job_id=&token=` | SSE stream for progress |
| POST | `/api/v1/parser/photos/download` | Trigger photo download |

## Queue Workflow

1. Start parser -> API dispatches RunParserJob to queue
2. Parser worker picks up job
3. Progress sent via SSE or WebSocket
4. Frontend subscribes via EventSource or useParserChannel

## Start Options

- type: full, menu_only, category, seller
- category_slug: for type=category
- save_photos, save_to_db, no_details
- linked_only, products_per_category, max_pages

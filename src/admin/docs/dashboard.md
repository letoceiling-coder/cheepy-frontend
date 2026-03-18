# Dashboard

## Overview

The Dashboard (`/admin`) is the main overview page showing system health, product stats, and parser status.

## Widgets

### Product Stats

| Widget | Source | Description |
|--------|--------|-------------|
| Всего объявлений | `products.total` | Total products in DB |
| Новые сегодня | `products.new_today` or `system.products_today` | Products parsed today |
| Скрыто | `products.hidden` | Hidden products |
| Ошибки сегодня | `products.errors` or `system.errors_today` | Parse errors today |

### System Status

| Widget | Source | Description |
|--------|--------|-------------|
| Парсер | `parser.is_running` | Running / Stopped |
| Очередь | `system.queue_size`, `system.queue_workers` | Queue size and worker count |
| Redis | `system.redis_status` | connected / disconnected |
| WebSocket | `system.websocket` | running / stopped |
| CPU / Память | `system.cpu_load`, `system.memory_usage` | Server metrics |
| Последний парсинг | `parser.last_run_at` | Timestamp |

### Categories

- Total categories
- Enabled count

### Anti-Blocking Stats (if available)

- Requests per minute (RPM)
- Blocked requests
- Retry count

## Data Sources

| API | Endpoint | Refresh |
|-----|----------|---------|
| Dashboard | `GET /api/v1/dashboard` | On load |
| Parser stats | `GET /api/v1/parser/stats` | Every 30s (fallback) |
| System status | `GET /api/v1/system/status` | Every 5s |

WebSocket/SSE events invalidate `parser-status` and `parser-stats` queries for live updates.

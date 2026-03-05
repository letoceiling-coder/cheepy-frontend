# Admin Panel Navigation

## Menu Structure

The sidebar (`AdminSidebar`) lists all admin sections:

| Menu Item | Route | Purpose |
|-----------|-------|---------|
| Dashboard | `/admin` | Overview: products stats, parser status, queue, Redis, WebSocket |
| Парсер | `/admin/parser` | Start/stop parser, view progress, configure run options |
| Объявления | `/admin/products` | Product list, filters, bulk actions (delete, publish) |
| Категории | `/admin/categories` | Tree of categories, enable/disable, parser linkage |
| Бренды | `/admin/brands` | Brand CRUD |
| Фильтры | `/admin/filters` | Filter configuration per category |
| AI Модуль | `/admin/ai` | AI-related features (if enabled) |
| Планировщик | `/admin/scheduler` | Parser scheduling |
| Исключения | `/admin/excluded` | Excluded rules (words, phrases, regex) |
| Логи | `/admin/logs` | System and parser logs |
| Роли | `/admin/roles` | User roles (admin/editor/viewer) |
| Настройки | `/admin/settings` | Global settings (groups) |

## Link to Public Site

Sidebar includes "На сайт" → navigates to `/` (main site).

## Per-Page Backend Endpoints

| Page | Primary Endpoints |
|------|-------------------|
| Dashboard | `GET /dashboard`, `GET /parser/stats`, `GET /system/status` |
| Parser | `GET /parser/status`, `POST /parser/start`, `POST /parser/stop`, `GET /parser/progress` (SSE), `GET /parser/jobs`, `GET /categories` |
| Products | `GET /products`, `PATCH /products/:id`, `DELETE /products/:id`, `POST /products/bulk`, `GET /categories`, `GET /sellers` |
| Categories | `GET /categories`, `PATCH /categories/:id`, `POST /categories/reorder`, `GET /categories/:id/filters` |
| Brands | `GET /brands`, `POST /brands`, `PUT /brands/:id`, `DELETE /brands/:id` |
| Filters | `GET /filters`, `POST /filters`, `PUT /filters/:id`, `DELETE /filters/:id`, `GET /filters/:categoryId/values` |
| Excluded | `GET /excluded`, `POST /excluded`, `PUT /excluded/:id`, `DELETE /excluded/:id`, `POST /excluded/test` |
| Logs | `GET /logs`, `DELETE /logs/clear` |
| Settings | `GET /settings`, `PUT /settings`, `PUT /settings/:key` |

## After User Actions

- **Start Parser** → Job dispatched to queue, progress via SSE or WebSocket
- **Stop Parser** → API signals job cancellation
- **Bulk Delete Products** → `POST /products/bulk` with `action: 'delete'`
- **Category Toggle** → `PATCH /categories/:id` with `enabled`
- **Save Settings** → `PUT /settings` or `PUT /settings/:key`

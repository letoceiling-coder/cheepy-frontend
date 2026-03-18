# Admin Docs Generation Report

**Date:** 2026-03-05  
**Location:** `src/admin/docs/`  

---

## Files Created

| File | Description |
|------|-------------|
| index.md | Purpose, architecture overview, system diagram |
| navigation.md | Menu items, routes, endpoints per page |
| authentication.md | Login flow, JWT, auth guard |
| dashboard.md | Widgets, data sources, refresh intervals |
| parser.md | Parser control, API endpoints, queue workflow |
| products.md | Product list, filters, bulk actions, API |
| categories.md | Tree, parser linkage, reorder |
| websocket.md | Reverb, events, useParserChannel, SSE fallback |
| queues.md | Workers, commands, jobs |
| api.md | Full API endpoint reference |
| troubleshooting.md | CORS, JWT, queue, Redis, WebSocket, parser issues |

---

## Sections Documented

- Architecture: Admin UI → Laravel API → Queue → Parser workers → Redis → WebSocket → UI
- Navigation: 12 menu items (Dashboard, Parser, Products, Categories, Brands, Filters, AI, Scheduler, Excluded, Logs, Roles, Settings)
- Authentication: POST /auth/login, JWT, localStorage, AuthGuard
- Dashboard: Product stats, parser/queue/Redis/WebSocket status, system metrics
- Parser: Start/stop, config, progress, SSE/WebSocket
- Products: CRUD, bulk actions, filters
- Categories: Tree, enabled, linked_to_parser, parser limits
- WebSocket: Reverb, parser channel, events
- Queues: parser-worker, parser-worker-photos, reverb

---

## API Endpoints Mapped

| Group | Endpoints |
|-------|-----------|
| Auth | /auth/login, /auth/me, /auth/refresh |
| Dashboard | /dashboard |
| Parser | /parser/status, /parser/stats, /parser/start, /parser/stop, /parser/jobs, /parser/progress, /parser/photos/download |
| Products | /products, /products/:id, /products/bulk |
| Categories | /categories, /categories/:id, /categories/reorder, /categories/:id/filters |
| Brands | /brands, /brands/:id |
| Excluded | /excluded, /excluded/test |
| Filters | /filters, /filters/:categoryId/values |
| Logs | /logs, /logs/clear |
| Settings | /settings, /settings/:key |
| Health | /up, /ws-status, /system/status |

---

## UI Pages Mapped

| Page | Route | Primary APIs |
|------|-------|--------------|
| Dashboard | /admin | dashboard, parser/stats, system/status |
| Parser | /admin/parser | parser/status, parser/start, parser/stop, parser/progress (SSE), categories |
| Products | /admin/products | products, categories, sellers |
| Categories | /admin/categories | categories, categories/reorder |
| Brands | /admin/brands | brands |
| Filters | /admin/filters | filters |
| Excluded | /admin/excluded | excluded |
| Logs | /admin/logs | logs |
| Settings | /admin/settings | settings |

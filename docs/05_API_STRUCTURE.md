# API Structure (Laravel Backend)

Backend base URL: `https://online-parser.siteaacess.store/api/v1`  
Framework: Laravel 12  
API prefix: `/api` (configured in `bootstrap/app.php`)

## Route Groups

## 1) Public Monitoring / System Endpoints (no auth)

- `GET /api/v1/up` - DB/Redis basic liveness check
- `GET /api/v1/ws-status` - Reverb/Redis/workers snapshot
- `GET /api/v1/system/status` - extended runtime status snapshot
- `GET /api/v1/system/health` - health payload (db/redis/queue/broadcast/parser)
- `GET /api/v1/health` - additional health endpoint

## 2) Public Catalog API (no auth)

Prefix: `/api/v1/public`

- `GET /menu`
- `GET /categories/{slug}/products`
- `GET /products/{externalId}`
- `GET /sellers/{slug}`
- `GET /search`
- `GET /featured`

Used by storefront frontend pages.

## 3) Auth API

Prefix: `/api/v1/auth`

- `POST /login`
- `GET /me` (JWT)
- `POST /refresh` (JWT)

JWT middleware: `App\Http\Middleware\JwtMiddleware`

## 4) Admin API (JWT required)

Prefix: `/api/v1/*` with `JwtMiddleware`

Main areas:

- Dashboard: `/dashboard`
- Parser control: `/parser/*`
- Products: `/products/*`
- Categories: `/categories/*`
- Sellers: `/sellers/*`
- Brands: `/brands/*`
- Filters: `/filters/*`
- Excluded rules: `/excluded/*`
- Attribute governance: `/attribute-rules/*`, `/attribute-dictionary/*`, `/attribute-canonical/*`, `/attribute-facets/*`
- Logs: `/logs/*`
- Settings: `/settings/*`

## Parser API Surface (Key)

Prefix: `/api/v1/parser`

State/health:

- `GET /status`
- `GET /state`
- `GET /health`
- `GET /diagnostics`
- `GET /progress`
- `GET /progress-overview`
- `GET /stats`

Control operations:

- `POST /start`
- `POST /start-daemon`
- `POST /stop`
- `POST /stop-daemon`
- `POST /pause`
- `POST /restart`
- `POST /reset`

Queue/worker ops:

- `POST /queue-clear` and alias `/clear-queue`
- `POST /queue-flush`
- `POST /queue-restart` and alias `/restart-workers`
- `POST /clear-failed`
- `GET /failed-jobs`
- `POST /retry-job/{id}`
- `POST /kill-stuck`
- `POST /release-lock`

Settings:

- `GET /settings`
- `POST /settings`

Support:

- `POST /photos/download`
- `POST /categories/sync`

## Auth and Security Model

- Admin APIs are protected by JWT middleware.
- Token source:
  - `Authorization: Bearer <token>`
  - optional fallback query `?token=...`
- Middleware resolves `admin_users` and injects authenticated user into request attributes.

## API Consumers

- Frontend (`siteaacess.store`) is the main API consumer.
- Frontend base URL is controlled by `VITE_API_URL`.
- Admin panel and parser UI consume JWT-protected `/api/v1/*`.
- Storefront pages consume `/api/v1/public/*`.

## Realtime / WebSocket Side

- Reverb process runs on the backend server.
- Nginx backend vhost proxies `/app` to `127.0.0.1:8080` (WebSocket upgrade enabled).
- Frontend has Reverb env vars configured for secure host/port.

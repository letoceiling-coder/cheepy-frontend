# Backend Architecture (Laravel)

Project path: `C:\OSPanel\domains\sadavod-laravel`  
Production path: `/var/www/online-parser.siteaacess.store`

## Technology

- Framework: Laravel 12 (`laravel/framework:^12.0`)
- PHP: 8.2
- Auth library: `firebase/php-jwt`
- Scraping libs: `symfony/dom-crawler`, `symfony/css-selector`
- HTTP client: Laravel HTTP + Guzzle
- Queue/cache/session: Redis
- WebSockets: Laravel Reverb

## Folder Architecture (app layer)

- `app/Http/Controllers/Api` -> REST API controllers (auth, parser, products, sellers, settings, logs, etc.)
- `app/Http/Middleware` -> `JwtMiddleware`, `CorsMiddleware`
- `app/Services` -> parser orchestration and domain services
- `app/Services/Parser` -> stable parser helpers (`HttpClient`, `ParserLogger`, `AttributeExtractor`)
- `app/Services/SadovodParser/Parsers` -> donor-specific parsers (menu/catalog/product/seller)
- `app/Jobs` -> queue jobs (`ParserDaemonJob`, `ParseCategoryJob`, `DownloadPhotoJob`, etc.)
- `app/Listeners` -> daemon scheduling and lock release listeners
- `app/Console/Commands` -> operational commands (`parser:*`, `system:check`, `system:preflight`)
- `app/Models` -> Eloquent models for parser and catalog data

## HTTP/API Architecture

- Prefix: `/api/v1/*`
- Public routes:
  - `/api/v1/up`, `/api/v1/system/health`, `/api/v1/ws-status`
  - `/api/v1/public/*` (menu/catalog/search/public seller/product endpoints)
- Auth routes:
  - `/api/v1/auth/login`
  - `/api/v1/auth/me`, `/api/v1/auth/refresh` (JWT protected)
- Admin routes:
  - `/api/v1/*` under `JwtMiddleware`
  - parser control and diagnostics at `/api/v1/parser/*`

## Auth Model

- Login checks `admin_users` record + password hash.
- JWT token signed using HS256.
- Token extracted from `Authorization: Bearer ...` or `?token=`.
- Middleware injects authenticated admin user into request attributes.

## Queue/Jobs Model

- Queue connection: Redis
- Main queues:
  - `parser`
  - `photos`
  - `default`
- Daemon flow:
  1. `ParserDaemonJob` checks parser state + queue threshold.
  2. Creates `parser_jobs` row and dispatches parser run.
  3. On completion, `ScheduleNextParserDaemon` schedules next cycle.
- Watchdog/recovery:
  - `parser:watchdog` monitors idle/run state/workers.
  - `parser:network-recover` attempts restart from `paused_network`.

## Parser Pipeline

Core service: `DatabaseParserService`

- Initializes parsers and runtime options from `parser_settings`.
- Modes:
  - menu only
  - category
  - seller
  - full pipeline
- Full mode:
  - sync menu categories
  - enqueue category parsing jobs
  - parse products/sellers/attributes/photos
  - update progress and emit events

## Parser Stability Components

- `app/Services/Parser/HttpClient.php`:
  - timeout 60
  - retry 3 with exponential backoff
  - random delay 1.5s-3s
  - UA rotation
  - IPv4 curl option (`CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4`)
  - proxy support from `config('parser.*')`
- `ParserWatchdog`:
  - queue overload guard
  - worker count enforcement via Supervisor status
- `ParserLogger`:
  - centralized logging to parser log model/table
- `AttributeExtractor`:
  - normalized extraction of title/brand/price/size/color/description/characteristics

## Events / Broadcasting

- Parser lifecycle events (`ParserStarted`, `ParserProgressUpdated`, `ProductParsed`, `ParserFinished`, `ParserError`)
- Reverb process is running under Supervisor.
- Broadcasting default is hardened:
  - if Reverb credentials are absent -> fallback to `log`
  - in console contexts fallback path avoids CLI failures

## Cache, Session, Storage

- Cache store: Redis
- Session driver: Redis
- Queue driver: Redis
- Product photos metadata in DB; files saved via Laravel storage path.

# Environment Configuration Reference

This document captures non-secret environment and configuration behavior needed to understand production architecture.

## Backend (Laravel) - Production Profile

Production repo path: `/var/www/online-parser.siteaacess.store`

Observed non-secret env values:

- `APP_NAME=SadavodParser`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://online-parser.siteaacess.store`
- `DB_CONNECTION=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_DATABASE=sadavod_parser`
- `SESSION_DRIVER=redis`
- `QUEUE_CONNECTION=redis`
- `CACHE_STORE=redis`
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6379`
- `BROADCAST_CONNECTION=log`

## Backend Config Behavior (Important)

## Broadcasting fallback

In `config/broadcasting.php`:

- If `REVERB_APP_KEY/SECRET/ID` are missing -> default broadcaster becomes `log`.
- Otherwise default resolves to:
  - `log` in console context
  - `reverb` in runtime context unless overridden by `BROADCAST_CONNECTION`

This protects artisan/CLI from `reverb auth_key null` failures.

## Parser config

In `config/parser.php`:

- `proxy_enabled` default true
- `proxy` / `proxy_url` default `http://89.169.39.244:3128`
- `delay_min` default `1500` ms
- `delay_max` default `3000` ms
- `timeout` default `60` sec
- `workers_parser` default `2`
- `workers_photos` default `1`
- `queue_threshold` default `500`

Runtime settings are additionally managed by DB table `parser_settings`.

## Frontend (Vite) - Production Profile

Production repo path: `/var/www/siteaacess.store`

Observed deployed env file (`.env.production`):

- `VITE_API_URL=https://online-parser.siteaacess.store/api/v1`
- `VITE_REVERB_HOST=online-parser.siteaacess.store`
- `VITE_REVERB_PORT=443`
- `VITE_REVERB_SCHEME=https`
- `VITE_REVERB_APP_KEY=parser-key`

## Frontend API Base Resolution

In `src/lib/api.ts`:

- default API base is hardcoded to backend domain
- `VITE_API_URL` is used when valid
- production runtime rejects local/private LAN API targets
- production runtime avoids mixed-content (`http` API under `https` page)

## Environment Validation Tools

Backend operational commands:

- `php artisan system:check` - validates env, db, redis, queue, parser settings/proxy fields
- `php artisan system:preflight` - deploy gate for db/redis/proxy/donor accessibility

Health endpoint:

- `GET /api/v1/system/health`

## Configuration Source Of Truth

- Infrastructure-level values: server system configs (`nginx`, `supervisor`, systemd)
- App-level runtime: `.env` + Laravel config files
- Parser runtime behavior: `.env` + `config/parser.php` + DB `parser_settings`/`parser_state`

For incident response, always compare all three layers before changing behavior.

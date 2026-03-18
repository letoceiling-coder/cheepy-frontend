# SERVER_ARCHITECTURE — Full Technical Audit

**VPS**: 85.117.235.93  
**OS**: Ubuntu 24.04.4 LTS (Noble Numbat)  
**Document Date**: 2026-03-05

---

## 1. Server Structure

```
/var/www/
├── siteaacess.store/          # Admin + public site (React SPA)
│   ├── index.html
│   ├── assets/
│   ├── favicon.ico
│   └── ...
├── api.siteaacess.store/      # Placeholder (not used)
├── photos.siteaacess.store/   # Placeholder for photos
├── online-parser.siteaacess.store/   # Laravel Parser (Sadavod)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/                # Document root
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   └── artisan
└── html/                      # Default nginx
```

---

## 2. Running Services

| Service | Status | Description |
|---------|--------|-------------|
| nginx | running | Web server |
| php8.2-fpm | running | PHP-FPM for Laravel |
| mariadb | running | MariaDB 10.11.14 |
| certbot.timer | active | Let's Encrypt auto-renewal |

**Not installed/configured:**
- Redis
- Supervisor
- Queue workers (Laravel `php artisan queue:work`)
- Node.js (build done locally)

---

## 3. Nginx Routing

### siteaacess.store (main site)
- **Domain**: siteaacess.store, www.siteaacess.store
- **Root**: `/var/www/siteaacess.store`
- **SSL**: Let's Encrypt (443)
- **Type**: SPA — `try_files $uri $uri/ /index.html`
- **Routes**: All client-side (React Router) — `/`, `/admin`, `/admin/*`, `/category/*`, etc.

### online-parser.siteaacess.store
- **Domain**: online-parser.siteaacess.store
- **Root**: `/var/www/online-parser.siteaacess.store/public`
- **SSL**: Let's Encrypt (443)
- **Type**: Laravel — PHP-FPM via `/run/php/php8.2-fpm.sock`
- **API base**: `https://online-parser.siteaacess.store/api/v1`

### api.siteaacess.store
- **Status**: Placeholder (HTTP 80 only)
- **Action**: Returns `{"status":"ok","message":"API placeholder"}` on `/api/`
- **Note**: Real API is at **online-parser.siteaacess.store/api/v1**

### photos.siteaacess.store
- **Status**: Placeholder (HTTP 80 only)
- **Root**: `/var/www/photos.siteaacess.store`

---

## 4. Domains Configuration Summary

| Domain | Purpose | SSL | Backend |
|--------|---------|-----|---------|
| siteaacess.store | Admin + public SPA | Yes | Static (React build) |
| www.siteaacess.store | Same as above | Yes | Static |
| online-parser.siteaacess.store | Parser API + catalog | Yes | Laravel (PHP 8.2) |
| api.siteaacess.store | Unused placeholder | No | Static JSON |
| photos.siteaacess.store | Photos storage | No | Static |

---

## 5. Environment & Config Files

### Admin (siteaacess.store)
- **No .env on server** — build-time `VITE_*` vars embedded in JS bundle
- **Required at build**: `VITE_API_URL=https://online-parser.siteaacess.store/api/v1`

### Parser (online-parser)
- **Path**: `/var/www/online-parser.siteaacess.store/.env`
- **Key vars**: APP_URL, DB_*, SADAVOD_*, FRONTEND_URL (CORS)

---

## 6. Cron Jobs

**System crontab** (`/etc/crontab`):
- Default Ubuntu: anacron, hourly, daily, weekly, monthly
- **No parser-related cron** — no scheduled parsing

**`/etc/cron.d/`**:
- `certbot` — SSL renewal
- `php` — PHP session cleanup
- No custom parser cron

---

## 7. Queue Workers & Supervisor

- **Supervisor**: Not installed
- **Laravel queue**: Uses `database` driver (tables: `jobs`, `job_batches`, `failed_jobs`)
- **Queue worker**: Not running — no `php artisan queue:work`
- **Parser execution**: Started via `exec()` in ParserController, runs `php artisan parser:run {id}` in background

---

## 8. Database

- **MariaDB**: localhost:3306
- **Database**: `sadavod_parser`
- **User**: `sadavod`
- **Single database** — Admin and Parser share none; Admin has no backend DB (API-only from parser)

# FINAL_ARCHITECTURE — Recommended Integration Architecture

---

## 1. Recommended System Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL (siteaacess.store)                    │
│                         React SPA + Vite                                  │
│                         /admin/* routes                                   │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 │ REST API (HTTPS)
                                 │ VITE_API_URL = https://online-parser.siteaacess.store/api/v1
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    PARSER SERVICE (online-parser.siteaacess.store)        │
│                    Laravel 12 + PHP 8.2                                   │
│                    - REST API                                              │
│                    - Parser logic                                          │
│                    - Single DB                                             │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  MariaDB        │   │  sadovodbaza.ru │   │  Redis (opt)    │
│  sadavod_parser │   │  (HTML source)  │   │  Queue/Cache    │
└─────────────────┘   └─────────────────┘   └─────────────────┘
          │
          │  Optional: move parser to queue
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    QUEUE WORKERS (Supervisor)                             │
│                    php artisan queue:work                                 │
│                    - Parse jobs                                            │
│                    - Photo download                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Admin Panel** | UI for parser control, products, categories, settings; calls Parser API |
| **Parser API** | REST API, auth, orchestration, DB access |
| **Parser Worker** | Run parse jobs (in-process or via queue) |
| **Database** | Single source of truth |
| **Queue** | Async jobs (parse, photos) — optional but recommended |
| **Redis** | Queue driver + cache — optional |

---

## 3. Recommendations

### 3.1 Immediate (No New Services)
- Wire Admin ParserPage to real API (status, start, stop, progress)
- Set `VITE_API_URL=https://online-parser.siteaacess.store/api/v1` for production build
- Add `https://siteaacess.store` to Parser `FRONTEND_URL` (CORS)
- Load categories from `/categories` for parser category filter

### 3.2 Short-Term
- Add cron: `* * * * * php /var/www/online-parser.siteaacess.store/artisan schedule:run`
- Define parser schedule in Laravel `app/Console/Kernel.php`
- Persist parser config: new `settings` entries or `/parser/config` API
- Use SSE `progressStream()` in Admin for live progress

### 3.3 Medium-Term
- Install Supervisor, run `queue:work`
- Move parser to queue job instead of exec()
- Add `/health` endpoint for monitoring
- Serve photos: nginx alias or Laravel route for `storage/app/photos`
- Point `photos.siteaacess.store` to photo storage

### 3.4 Long-Term
- Redis for queue + cache
- Optional: separate parser microservice
- Webhooks for job completion (if admin needs push)
- Parser stats dashboard (parsed/day, errors, duration)

---

## 4. Data Flow (Recommended)

```
Admin: Start Parse
    → POST /parser/start { options }
    → Parser creates job, dispatches to queue (or exec)
    → Worker runs DatabaseParserService
    → Saves to products, categories, sellers
    → Admin polls /parser/status or subscribes to SSE /parser/progress
    → Admin fetches /products, /categories for display
```

---

## 5. api.siteaacess.store

**Options:**
1. **Remove** — use online-parser directly
2. **Proxy** — nginx `proxy_pass` to online-parser (unify domain)
3. **Separate API** — future Node/PHP API for other services (not needed now)

Recommendation: Use online-parser directly; remove or repurpose api subdomain.

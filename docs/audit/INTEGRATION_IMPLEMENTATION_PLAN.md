# INTEGRATION_IMPLEMENTATION_PLAN — Step-by-Step

---

## Phase 1: Audit & Configuration (1–2 days)

### 1.1 Environment
- [ ] Set `VITE_API_URL=https://online-parser.siteaacess.store/api/v1` in Cheepy build (`.env.production` or build command)
- [ ] Add `FRONTEND_URL=https://siteaacess.store,https://www.siteaacess.store` to Parser `.env`
- [ ] Rebuild Admin SPA and deploy to siteaacess.store
- [ ] Verify CORS: Admin can call Parser API from browser

### 1.2 Auth
- [ ] Create admin user in Parser DB: `admin_users` table
- [ ] Ensure Admin login calls `POST /auth/login`, stores JWT in `admin_token`
- [ ] Verify protected routes send `Authorization: Bearer {token}`

---

## Phase 2: API Normalization (2–3 days)

### 2.1 ParserPage Integration
- [ ] Replace mock data in `ParserPage.tsx` with `parserApi.status()`, `parserApi.start()`, `parserApi.stop()`
- [ ] Load categories from `categoriesApi.list()` for category filter
- [ ] Map form fields to `StartParserOptions`: type, categories, linked_only, products_per_category, max_pages, save_photos, save_to_db
- [ ] Call `parserApi.progressStream(jobId)` for real-time progress (EventSource)
- [ ] Replace mock logs with `logsApi.list({ job_id })` or logs from job detail

### 2.2 Dashboard Integration
- [ ] Replace `mockDashboard` with `dashboardApi.get()` if Dashboard uses mock
- [ ] Verify Dashboard displays real products/categories/parser stats

### 2.3 Products, Categories, Other Pages
- [ ] Ensure ProductsPage, CategoriesPage, etc. use `productsApi`, `categoriesApi` (not mock)
- [ ] Remove or gate mock data with feature flag if needed

---

## Phase 3: Parser Config & Settings (1–2 days)

### 3.1 Parser Config API (optional)
- [ ] Add `GET /parser/config` — returns merged config from settings + defaults
- [ ] Add `PUT /parser/config` — saves to `settings` table (group=parser)
- [ ] Admin Settings page: load/save parser config via API

### 3.2 Categories Parser Settings
- [ ] Admin CategoriesPage: edit `linked_to_parser`, `parser_products_limit`, `parser_max_pages`
- [ ] Ensure PATCH `/categories/{id}` supports these fields

---

## Phase 4: Parser Job System (2–3 days)

### 4.1 Keep Current (exec) — Minimal
- [ ] Document current `exec(parser:run)` behavior
- [ ] Add timeout handling if possible
- [ ] Improve error reporting in parser_logs

### 4.2 Move to Queue (Recommended)
- [ ] Create Laravel Job `RunParserJob`
- [ ] `ParserController::start` → `RunParserJob::dispatch($job)`
- [ ] Install Supervisor
- [ ] Add Supervisor config: `php artisan queue:work --queue=default`
- [ ] Start queue worker

---

## Phase 5: Cron & Scheduler (1 day)

- [ ] Add Laravel schedule in `app/Console/Kernel.php`:
  ```php
  $schedule->command('parser:run', ['--type=full'])->cron('0 */6 * * *');
  ```
- [ ] Add to server crontab: `* * * * * cd /var/www/online-parser.siteaacess.store && php artisan schedule:run >> /dev/null 2>&1`
- [ ] Optional: Make cron expression configurable via settings

---

## Phase 6: Monitoring & Logging (1–2 days)

- [ ] Add `GET /up` or `GET /health` (Laravel has `/up` by default)
- [ ] Ensure `parser_logs` are queryable via `GET /logs?job_id=X`
- [ ] Admin LogsPage: use `logsApi.list()` with filters
- [ ] Optional: External monitoring (UptimeRobot, etc.) for /up

---

## Phase 7: Photos & Static Assets (1 day)

- [ ] Create nginx location or Laravel route to serve `storage/app/photos`
- [ ] Or symlink: `public/photos` → `../storage/app/photos`
- [ ] Ensure product photo URLs point to correct domain (photos.siteaacess.store or same domain)

---

## Phase 8: Testing & Scaling (ongoing)

- [ ] Test full flow: Admin start parse → products appear → public pages show data
- [ ] Test auth: login, protected routes, token refresh
- [ ] Load test parser with large category set
- [ ] Consider Redis for queue if DB queue becomes bottleneck

---

## Checklist Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| 1 | Env, CORS, auth | P0 |
| 2 | ParserPage, Dashboard, Products real API | P0 |
| 3 | Parser config API | P1 |
| 4 | Queue (optional) | P1 |
| 5 | Cron | P1 |
| 6 | Health, logs | P2 |
| 7 | Photos | P2 |
| 8 | Testing | P0 |

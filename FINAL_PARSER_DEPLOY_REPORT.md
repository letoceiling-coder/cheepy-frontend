# Final Parser Deploy Report

**Date:** 2025-03-14  
**Server:** root@85.117.235.93

---

## 1. Commits

### Backend (cheepy-backend)

- **Commit:** `585fc1c` — parser daemon fixes: parser_state only, STOP clears queue, watchdog/daemon check
- **Pushed:** 547d4df → 585fc1c

### Frontend (cheepy-frontend)

- **Commit:** `81cc007` — Parser: Parser Control vs System Tools, parser state, pause
- **Pushed:** c045938 → 81cc007

---

## 2. Server Deploy Steps

### Backend
- `cd /var/www/online-parser.siteaacess.store`
- `git fetch origin` / `git reset --hard origin/main`
- `composer install --no-dev --optimize-autoloader`
- `php artisan migrate --force` — migration `2026_03_06_100002_create_parser_state_table` executed
- `php artisan config:clear` / `config:cache` / `route:cache`
- `php artisan queue:restart`

### Frontend
- `cd /var/www/siteaacess.store`
- `git fetch origin` / `git reset --hard origin/main`
- `npm ci` / `npm run build`
- `systemctl reload nginx`

---

## 3. Verification

### Backend commit on server
- `git rev-parse HEAD` → `585fc1c` (matches GitHub)

### Parser status (at deploy time)
- Parser running: yes (job #5756 — existing job)
- Daemon enabled: no (from parser_state)
- Queue parser: 3538
- Queue photos: 144385
- Queue workers: 0 (workers were down, watchdog restarted them)

### Watchdog
- `php artisan parser:watchdog --dry-run` → "Watchdog: restarted workers (queue had jobs, workers were dead)"
- When parser_state = STOPPED, watchdog exits early and does not dispatch daemon

---

## 4. Changes Summary

### Backend
- `parser_state` table as single source of truth
- Removed `parser_daemon_enabled` usage
- STOP: clears queues (parser, photos), restarts workers, sets parser_state = STOPPED
- ParserDaemonJob: exits if parser_state !== RUNNING, log "Parser daemon blocked (state=...)"
- ScheduleNextParserDaemon: skips if parser_state !== RUNNING
- ParserWatchdog: returns early if parser_state !== RUNNING (no daemon dispatch)

### Frontend
- Parser Control: Start Parser, Stop Parser, Pause Parser, Один прогон
- System Tools: Reset Queue, Clear Failed Jobs, Restart Workers, Release Lock
- GET /parser/state, POST /parser/pause

---

## 5. Test: STOP → REFRESH

**Ожидаемое поведение:**
1. Открыть https://siteaacess.store/admin/parser
2. Нажать Stop Parser
3. Обновить страницу (Refresh)
4. Парсер не должен запускаться автоматически

**Проверка:** Выполнить вручную и убедиться, что после Stop и обновления страницы парсер остаётся остановленным. parser_state берётся из БД, daemon и watchdog не запускают daemon при status = STOPPED.

---

## 6. Logs

В `storage/logs/laravel.log` видны ошибки Pusher (Payload too large) — не связаны с парсером. При status = STOPPED в логах будет строка: `Parser daemon blocked (state=stopped)` при попытке обработки ParserDaemonJob.

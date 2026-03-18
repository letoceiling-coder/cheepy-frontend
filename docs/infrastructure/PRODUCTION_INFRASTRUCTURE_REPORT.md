# PRODUCTION INFRASTRUCTURE REPORT

**Parser Service**: https://online-parser.siteaacess.store  
**Server**: Ubuntu 24.04 VPS  
**Date**: _Fill after implementation_

---

## 1. System Architecture

```
Admin SPA (siteaacess.store)
         │
         ▼
Parser API (Laravel)
         │
    ┌────┴────┐
    │  Redis  │  ← Queue, Cache, Session
    └────┬────┘
         │
    ┌────┴────┐
    │Supervisor│  ← queue:work (default + photos)
    └────┬────┘
         │
    ┌────┴────┐
    │ MariaDB │  ← Products, categories, parser_jobs
    └────┬────┘
         │
    External source (sadovodbaza.ru)
```

---

## 2. Queue Architecture

| Queue | Worker | Purpose |
|-------|--------|---------|
| default | parser-worker_00, parser-worker_01 | RunParserJob |
| photos | parser-worker-photos_00 | DownloadPhotosJob |

---

## 3. Supervisor Config

- **File**: /etc/supervisor/conf.d/parser-worker.conf
- **Workers**: 2× default queue
- **User**: www-data
- **Log**: storage/logs/worker.log

---

## 4. Redis Config

- **Host**: 127.0.0.1
- **Port**: 6379
- **Usage**: QUEUE_CONNECTION, CACHE_DRIVER, SESSION_DRIVER

---

## 5. Scheduler Config

| Task | Cron | Command |
|------|------|---------|
| Parser full | 0 */6 * * * | parser:run --type=full |
| Photo download | 0 * * * * | DownloadPhotosJob |
| Prune failed | 0 3 * * * | queue:prune-failed |

System cron: `* * * * * php artisan schedule:run`

---

## 6. API Compatibility (Preserved)

| Endpoint | Method | Response |
|----------|--------|----------|
| /parser/start | POST | { job_id, message, job } |
| /parser/status | GET | { is_running, current_job, last_completed } |
| /parser/progress | GET | SSE stream |

---

## 7. New Endpoints

| Endpoint | Purpose |
|----------|---------|
| GET /health | Database, Redis, parser_last_run |
| GET /system/status | Memory, disk, queue, Redis (auth) |
| GET /parser/stats | Aggregated stats |
| GET /parser/stats/daily | Daily breakdown |
| GET /parser/stats/errors | Error stats |

---

## 8. Monitoring

- Health: GET /health (external monitoring)
- System: GET /system/status (internal)
- Logs: storage/logs/laravel.log, worker.log
- Failed jobs: failed_jobs table, queue:failed

---

## 9. Test Results

| Test | Status |
|------|--------|
| RunParserJobTest | _ |
| HealthTest | _ |
| E2E pipeline | _ |

---

## 10. Deployment Checklist

- [ ] Redis installed and running
- [ ] Supervisor workers RUNNING
- [ ] Cron for schedule:run
- [ ] .env: QUEUE_CONNECTION=redis
- [ ] parser_stats migration run
- [ ] ParserController uses dispatch() not exec()

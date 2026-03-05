# Production Infrastructure Implementation

Runbooks and code to convert the parser system to production-ready architecture.

---

## Quick Start

1. **Server audit** — Run `SERVER_AUDIT.md` commands via SSH, fill in results.
2. **Install Redis** — Use `scripts/01-install-redis.sh`, follow `REDIS_SETUP_REPORT.md`.
3. **Install Supervisor** — Use `scripts/02-install-supervisor.sh`, copy `scripts/parser-worker.conf`.
4. **Apply Laravel code** — Copy files from `laravel/` per `laravel/README.md`.
5. **Update ParserController** — Replace `exec()` with `RunParserJob::dispatch()`, see `laravel/PARSER_CONTROLLER_PATCH.md`.
6. **Add cron** — `* * * * * php artisan schedule:run`.
7. **Verify** — Health check, queue workers, E2E test.

---

## Documents

| Document | Purpose |
|----------|---------|
| [SERVER_AUDIT.md](SERVER_AUDIT.md) | SSH audit template |
| [ERROR_HANDLING.md](ERROR_HANDLING.md) | Retry, logging, failed jobs |
| [REDIS_SETUP_REPORT.md](REDIS_SETUP_REPORT.md) | Redis installation |
| [SUPERVISOR_SETUP_REPORT.md](SUPERVISOR_SETUP_REPORT.md) | Supervisor + workers |
| [SCHEDULER_SETUP_REPORT.md](SCHEDULER_SETUP_REPORT.md) | Cron + Laravel scheduler |
| [SECURITY_CHECK.md](SECURITY_CHECK.md) | JWT, CORS, rate limit |
| [PERFORMANCE_TEST.md](PERFORMANCE_TEST.md) | Load test |
| [E2E_TEST_REPORT.md](E2E_TEST_REPORT.md) | Full pipeline test |
| [PRODUCTION_INFRASTRUCTURE_REPORT.md](PRODUCTION_INFRASTRUCTURE_REPORT.md) | Final summary |

---

## Laravel Code

All Laravel files are in `laravel/`. See `laravel/README.md` for application steps.

---

## API Compatibility

**Must not break:**
- `POST /parser/start` → returns `{ job_id }`
- `GET /parser/status`
- `GET /parser/progress` (SSE)

# System Audit — Index

Full system audit and production validation for parser + admin.

---

## Phase Order

| Phase | Document |
|-------|----------|
| 1 | [SERVER_INFRASTRUCTURE_AUDIT.md](SERVER_INFRASTRUCTURE_AUDIT.md) |
| 2 | [REDIS_VALIDATION_REPORT.md](REDIS_VALIDATION_REPORT.md) |
| 3 | [QUEUE_VALIDATION_REPORT.md](QUEUE_VALIDATION_REPORT.md) |
| 4 | [PARSER_PIPELINE_AUDIT.md](PARSER_PIPELINE_AUDIT.md) |
| 5 | [API_AUDIT_REPORT.md](API_AUDIT_REPORT.md) |
| 6 | [SSE_PROGRESS_TEST.md](SSE_PROGRESS_TEST.md) |
| 7 | [DATABASE_PERFORMANCE_REPORT.md](DATABASE_PERFORMANCE_REPORT.md) |
| 8 | [LOAD_TEST_REPORT.md](LOAD_TEST_REPORT.md) |
| 9 | [ANTI_BLOCKING_REPORT.md](ANTI_BLOCKING_REPORT.md) |
| 10 | [HIGH_SCALE_ARCHITECTURE_REPORT.md](HIGH_SCALE_ARCHITECTURE_REPORT.md) |
| 11 | [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) |
| 12 | [E2E_VALIDATION_REPORT.md](E2E_VALIDATION_REPORT.md) |
| 13 | [FINAL_SYSTEM_AUDIT.md](FINAL_SYSTEM_AUDIT.md) |

---

## Quick Start

1. SSH to server.
2. Run commands from Phase 1–3 (infrastructure).
3. Run commands from Phase 4–7 (parser, API, DB).
4. Run load tests (Phase 8).
5. Apply anti-blocking (Phase 9) per `../infrastructure/laravel/ANTI_BLOCKING_INTEGRATION.md`.
6. Security and E2E (Phase 11–12).
7. Fill FINAL_SYSTEM_AUDIT.

---

## Local API Test

```bash
./scripts/audit-api.sh
```

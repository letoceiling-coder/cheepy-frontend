# QUEUE VALIDATION REPORT

**Date**: 2026-03-05

---

## Configuration

| Item | Value |
|------|-------|
| QUEUE_CONNECTION | redis |
| parser-worker | 4 processes, RUNNING |
| parser-worker-photos | 2 processes, RUNNING |

## Parser Execution

- **RunParserJob::dispatch($jobId)** — replaces exec()
- Job queued to `default`
- Worker processes via DatabaseParserService
- Retries: 3, backoff: 60s, 300s, 900s
- Timeout: 3600s (1 hour)

# PARSER PIPELINE AUDIT

**Date**: 2026-03-05

---

## Flow (Updated)

- POST /parser/start → ParserController::start
- Creates ParserJob in DB
- **RunParserJob::dispatch($job->id)** — queued to Redis (replaces exec)
- Worker picks job from `default` queue
- DatabaseParserService::run($job)
- Products saved, parser_jobs updated, parser_logs created

## Exec Removed

- Previous: exec("php artisan parser:run {id}")
- Current: RunParserJob::dispatch($job->id)

## Queue Workers

- 4× parser-worker (default queue)
- 2× parser-worker-photos (photos queue)

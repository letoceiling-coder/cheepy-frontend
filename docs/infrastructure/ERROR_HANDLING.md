# Error Handling (Step 9)

---

## 1. Parser Errors

All parser errors should be recorded in:

- **parser_logs** — via `$this->log('error', ...)` in DatabaseParserService
- **Laravel logs** — `storage/logs/laravel.log`
- **failed_jobs** — when RunParserJob fails after retries

---

## 2. Retry Configuration

RunParserJob:
- `$tries = 3`
- `$backoff = [60, 300, 900]` — 1m, 5m, 15m
- Transient errors (network, timeouts) will retry
- Permanent errors (validation, missing data) — consider `release()` with delay or fail immediately

---

## 3. Logging Improvements

In `DatabaseParserService` and parsers:

```php
try {
    // parse logic
} catch (\Throwable $e) {
    Log::error('Parser error', [
        'job_id' => $job->id,
        'category' => $category ?? null,
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ]);
    $this->log('error', $e->getMessage(), ['exception' => $e->getMessage()]);
    throw $e;
}
```

---

## 4. Failed Job Handling

```bash
# View failed jobs
php artisan queue:failed

# Retry
php artisan queue:retry all
php artisan queue:retry {id}

# Prune old
php artisan queue:prune-failed --hours=168
```

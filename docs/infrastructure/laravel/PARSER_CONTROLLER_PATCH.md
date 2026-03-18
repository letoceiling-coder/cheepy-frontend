# Parser Controller Patch

**CRITICAL**: Do NOT change the API response format for:
- `POST /parser/start` → must return `{ job_id, message, job }`
- `GET /parser/status` → unchanged
- `GET /parser/progress` → unchanged (SSE)

---

## Replace exec() with dispatch()

In `ParserController::start()` (or equivalent), change from:

```php
// OLD
exec("php " . base_path('artisan') . " parser:run {$job->id} > /dev/null 2>&1 &");
return response()->json(['message' => '...', 'job_id' => $job->id, 'job' => $job]);
```

To:

```php
// NEW
\App\Jobs\RunParserJob::dispatch($job->id);
return response()->json(['message' => 'Parser job queued', 'job_id' => $job->id, 'job' => $job]);
```

The response format remains identical. The job runs via queue worker instead of exec.

---

## Optional: Record stats on job completion

In `RunParserJob::handle()` or in `DatabaseParserService`, after job completes:

```php
app(\App\Services\ParserStatsService::class)->recordJob($job);
```

Or use a model observer on ParserJob when status becomes 'completed'.

<?php
/**
 * Add these routes to your api routes file (e.g. routes/api.php or routes/api/v1.php).
 * Health endpoints can be public for monitoring; optionally protect with API key.
 *
 * Routes: GET /health, GET /up (simple ok for admin header)
 */

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

// GET /up — minimal health for admin status indicator (green/red)
Route::get('/up', function () {
    try {
        DB::connection()->getPdo();
        if (config('queue.default') === 'redis') {
            Redis::ping();
        }
        return response()->json(['status' => 'ok']);
    } catch (\Throwable $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 503);
    }
});

// GET /health — full health check
Route::get('/health', function () {
    $status = 'ok';
    $db = false;
    $redis = false;
    $queueWorkers = 'unknown';
    $parserLastRun = null;

    try {
        DB::connection()->getPdo();
        DB::connection()->getDatabaseName();
        $db = true;
    } catch (\Throwable $e) {
        $status = 'degraded';
    }

    try {
        Redis::ping();
        $redis = true;
    } catch (\Throwable $e) {
        $status = 'degraded';
    }

    // Last completed parser job
    $lastJob = \App\Models\ParserJob::where('status', 'completed')->latest('finished_at')->first();
    if ($lastJob) {
        $parserLastRun = $lastJob->finished_at?->toIso8601String();
    }

    return response()->json([
        'status' => $status,
        'database' => $db ? 'connected' : 'disconnected',
        'redis' => $redis ? 'connected' : 'disconnected',
        'queue_workers' => $queueWorkers,
        'parser_last_run' => $parserLastRun,
        'timestamp' => now()->toIso8601String(),
    ]);
});

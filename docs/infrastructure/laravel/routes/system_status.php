<?php
/**
 * Add to api routes. Protects with auth middleware.
 * GET /system/status — system monitoring (memory, CPU, disk, queue)
 */

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Queue;

Route::get('/system/status', function () {
    $memory = [];
    if (function_exists('memory_get_usage')) {
        $memory['current_mb'] = round(memory_get_usage(true) / 1024 / 1024, 2);
        $memory['peak_mb'] = round(memory_get_peak_usage(true) / 1024 / 1024, 2);
    }

    $disk = [];
    $laravelPath = base_path();
    if (is_dir($laravelPath)) {
        $free = @disk_free_space($laravelPath);
        $total = @disk_total_space($laravelPath);
        if ($free !== false && $total !== false) {
            $disk['free_gb'] = round($free / 1024 / 1024 / 1024, 2);
            $disk['total_gb'] = round($total / 1024 / 1024 / 1024, 2);
            $disk['used_percent'] = round((1 - $free / $total) * 100, 1);
        }
    }

    $queue = [];
    try {
        $queue['default'] = Queue::connection('redis')->size('default');
        $queue['photos'] = Queue::connection('redis')->size('photos');
    } catch (\Throwable $e) {
        $queue['error'] = $e->getMessage();
    }

    $redisStatus = 'unknown';
    try {
        Redis::ping();
        $redisStatus = 'connected';
    } catch (\Throwable $e) {
        $redisStatus = 'disconnected';
    }

    return response()->json([
        'memory' => $memory,
        'disk' => $disk,
        'queue' => $queue,
        'redis' => $redisStatus,
        'timestamp' => now()->toIso8601String(),
    ]);
})->middleware('auth:api'); // or your JWT middleware name

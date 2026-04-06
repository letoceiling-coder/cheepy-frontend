<?php
$path = '/var/www/online-parser.siteaacess.store/routes/api.php';
$content = file_get_contents($path);

$insert = <<<'PHP'

    // System monitoring (dashboard)
    Route::get('system/status', function () {
        $redisStatus = 'disconnected';
        try {
            \Illuminate\Support\Facades\Redis::ping();
            $redisStatus = 'connected';
        } catch (\Throwable $e) {}

        $reverb = 'stopped';
        try {
            $port = (int) (config('reverb.servers.reverb.port') ?? env('REVERB_SERVER_PORT', 8080));
            $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 2);
            if ($fp) {
                fclose($fp);
                $reverb = 'running';
            } elseif (function_exists('shell_exec')) {
                $ps = trim((string) @shell_exec('ps aux | grep reverb | grep -v grep'));
                $reverb = $ps !== '' ? 'running' : 'stopped';
            }
        } catch (\Throwable $e) {}

        $queueWorkers = 0;
        try {
            if (function_exists('shell_exec')) {
                $out = trim((string) @shell_exec('ps aux 2>/dev/null | grep -E "queue:work" | grep -v grep | wc -l'));
                $queueWorkers = (int) $out;
            }
        } catch (\Throwable $e) {}

        $queueSize = 0;
        try {
            $queueSize = \Illuminate\Support\Facades\Queue::connection('redis')->size('default');
        } catch (\Throwable $e) {}

        $running = \App\Models\ParserJob::whereIn('status', ['running', 'pending'])->exists();
        $lastJob = \App\Models\ParserJob::where('status', 'completed')->latest('finished_at')->first();
        $lastParserRun = $lastJob?->finished_at?->toIso8601String();

        $productsTotal = \App\Models\Product::count();
        $productsToday = \App\Models\Product::whereDate('parsed_at', today())->count();
        $errorsToday = \App\Models\Product::where('status', 'error')->whereDate('status_changed_at', today())->count();

        $cpuLoad = '—';
        if (function_exists('sys_getloadavg')) {
            $la = @sys_getloadavg();
            $cpuLoad = $la ? implode(' ', array_map(fn($v) => round($v, 2), $la)) : '—';
        }

        $memoryUsage = '—';
        if (is_readable('/proc/meminfo')) {
            $m = file_get_contents('/proc/meminfo');
            preg_match('/MemTotal:\s+(\d+)/', $m, $mt);
            preg_match('/MemAvailable:\s+(\d+)/', $m, $ma);
            if ($mt && $ma) {
                $total = (int)$mt[1] / 1024;
                $avail = (int)$ma[1] / 1024;
                $used = round($total - $avail);
                $memoryUsage = $used . 'M / ' . round($total) . 'M';
            }
        }

        return response()->json([
            'parser_running' => $running,
            'queue_workers' => $queueWorkers,
            'queue_size' => $queueSize,
            'products_total' => $productsTotal,
            'products_today' => $productsToday,
            'errors_today' => $errorsToday,
            'last_parser_run' => $lastParserRun,
            'redis_status' => $redisStatus,
            'websocket' => $reverb,
            'cpu_load' => $cpuLoad,
            'memory_usage' => $memoryUsage,
            'timestamp' => now()->toIso8601String(),
        ]);
    });
PHP;

$needle = "    // Dashboard\n    Route::get('dashboard', [DashboardController::class, 'index']);";
$pos = strpos($content, $needle);
if ($pos === false) {
    echo "Could not find insertion point\n";
    exit(1);
}
$content = substr_replace($content, $needle . "\n\n" . trim($insert), $pos, strlen($needle));
file_put_contents($path, $content);
echo "OK\n";

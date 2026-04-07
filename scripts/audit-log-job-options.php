<?php

/**
 * Log JOB OPTIONS for the latest ParserJob (constructor side effect).
 * Run from Laravel root: php audit-log-job-options.php
 */

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$job = \App\Models\ParserJob::query()->orderByDesc('id')->first();
if (!$job) {
    fwrite(STDERR, "No parser_jobs row.\n");
    exit(1);
}

new \App\Services\DatabaseParserService($job);

echo "Logged JOB OPTIONS for parser_job id={$job->id}\n";

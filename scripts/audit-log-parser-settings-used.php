<?php

/**
 * Bootstrap Laravel and log PARSER SETTINGS USED (same keys as ParserDaemonJob)
 * without creating a ParserJob. Run from Laravel root: php audit-log-parser-settings-used.php
 */

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$st = \App\Models\ParserSetting::current();
$rawIds = $st->default_category_ids;
$ids = is_array($rawIds) ? array_values(array_filter(array_map('intval', $rawIds))) : [];
$options = [
    'categories' => $ids,
    'linked_only' => (bool) $st->default_linked_only,
    'products_per_category' => (int) ($st->default_products_per_category ?? 0),
    'max_pages' => (int) ($st->default_max_pages ?? 0),
    'no_details' => (bool) ($st->default_no_details ?? false),
    'save_photos' => (bool) $st->download_photos,
    'save_to_db' => true,
];

\Illuminate\Support\Facades\Log::warning('PARSER SETTINGS USED', $options);

echo json_encode($options, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

<?php
/** Place in Laravel root, run: php audit-parser-settings-server.php */
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== ParserSetting::first() ===\n";
$s = \App\Models\ParserSetting::first();
if (!$s) {
    echo "NULL\n";
} else {
    echo json_encode($s->only([
        'id',
        'default_max_pages',
        'default_category_ids',
        'download_photos',
        'default_linked_only',
        'default_products_per_category',
        'default_no_details',
    ]), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
}

echo "\n=== parser_jobs last 5 (id, type, options) ===\n";
$rows = \Illuminate\Support\Facades\DB::table('parser_jobs')
    ->orderByDesc('id')
    ->limit(5)
    ->get(['id', 'type', 'options']);
foreach ($rows as $r) {
    echo $r->id . ' | ' . $r->type . ' | ' . $r->options . "\n";
}

echo "\n=== Raw options column (newest id) ===\n";
$raw = \Illuminate\Support\Facades\DB::table('parser_jobs')->orderByDesc('id')->value('options');
var_dump($raw);

echo "\n=== Simulated ParserDaemonJob options (same formula as job, no DB write) ===\n";
$st = \App\Models\ParserSetting::current();
$rawIds = $st->default_category_ids;
$simIds = is_array($rawIds) ? array_values(array_filter(array_map('intval', $rawIds))) : [];
$sim = [
    'categories' => $simIds,
    'linked_only' => (bool) $st->default_linked_only,
    'products_per_category' => (int) ($st->default_products_per_category ?? 0),
    'max_pages' => (int) ($st->default_max_pages ?? 0),
    'no_details' => (bool) ($st->default_no_details ?? false),
    'save_photos' => (bool) $st->download_photos,
    'save_to_db' => true,
];
echo json_encode($sim, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

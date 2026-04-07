<?php
/**
 * One-off audit: run on Laravel app root: php scripts/audit-parser-settings.php
 * (copy to server /tmp if path differs)
 */
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
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

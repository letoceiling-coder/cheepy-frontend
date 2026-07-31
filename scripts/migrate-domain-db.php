<?php

declare(strict_types=1);

/**
 * Replace legacy siteaacess.store domains in text/json columns.
 * By default scans config/integration/CMS tables only (fast).
 * Set FULL_DB_SCAN=1 to scan all tables (slow on large catalogs).
 */

$root = getenv('BACKEND_ROOT') ?: '/var/www/online-parser.siteaacess.store';
if (! is_file($root . '/artisan')) {
    fwrite(STDERR, "Backend not found at {$root}\n");
    exit(1);
}

require $root . '/vendor/autoload.php';
$app = require $root . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$from = [
    'siteaacess.store',
    'online-parser.siteaacess.store',
    'ollama.siteaacess.store',
    'www.siteaacess.store',
];
$to = [
    'cheepy.shop',
    'online-parser.cheepy.shop',
    'ollama.cheepy.shop',
    'www.cheepy.shop',
];

$priorityTables = [
    'settings',
    'parser_settings',
    'ai_provider_integrations',
    'social_oauth_integrations',
    'mail_integrations',
    'sms_integrations',
    'delivery_integrations',
    'payment_providers',
    'saas_api_keys',
    'cms_pages',
    'cms_page_blocks',
    'cms_page_versions',
    'constructor_layout_templates',
    'constructor_layout_template_blocks',
    'marketing_email_templates',
    'marketing_campaigns',
    'marketing_news',
    'crm_media_files',
    'users',
    'sessions',
    'cache',
    'jobs',
    'failed_jobs',
];

$db = DB::connection();
$dbName = $db->getDatabaseName();
$fullScan = getenv('FULL_DB_SCAN') === '1';
$tables = $fullScan
    ? array_map(static fn ($row) => $row->{'Tables_in_' . $dbName}, $db->select('SHOW TABLES'))
    : $priorityTables;

$updated = 0;

foreach ($tables as $table) {
    $exists = $db->selectOne(
        'SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        [$dbName, $table]
    );
    if (! $exists) {
        continue;
    }

    $cols = $db->select(
        'SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        [$dbName, $table]
    );

    foreach ($cols as $col) {
        $type = strtolower($col->DATA_TYPE);
        if (! preg_match('/char|text|json|blob/', $type)) {
            continue;
        }
        $name = $col->COLUMN_NAME;

        foreach ($from as $i => $old) {
            $new = $to[$i];
            $has = (int) $db->selectOne(
                'SELECT COUNT(*) AS c FROM `' . $table . '` WHERE `' . $name . '` LIKE ? LIMIT 1',
                ['%' . $old . '%']
            )->c;
            if ($has === 0) {
                continue;
            }

            $n = $db->update(
                'UPDATE `' . $table . '` SET `' . $name . '` = REPLACE(`' . $name . '`, ?, ?) WHERE `' . $name . '` LIKE ?',
                [$old, $new, '%' . $old . '%']
            );
            $updated += $n;
            if ($n > 0) {
                echo "{$table}.{$name}: {$n} rows ({$old} -> {$new})\n";
            }
        }
    }
}

echo "DB rows updated: {$updated}\n";

<?php

declare(strict_types=1);

/**
 * Replace legacy siteaacess.store domains in text/json columns.
 * Run: php scripts/migrate-domain-db.php
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

$db = DB::connection();
$tables = $db->select('SHOW TABLES');
$key = 'Tables_in_' . $db->getDatabaseName();
$updated = 0;

foreach ($tables as $row) {
    $table = $row->{$key};
    $cols = $db->select('SHOW COLUMNS FROM `' . $table . '`');
    foreach ($cols as $col) {
        $type = strtolower($col->Type);
        if (! preg_match('/char|text|json|blob/', $type)) {
            continue;
        }
        $name = $col->Field;
        foreach ($from as $i => $old) {
            $new = $to[$i];
            $n = $db->update(
                'UPDATE `' . $table . '` SET `' . $name . '` = REPLACE(`' . $name . '`, ?, ?) WHERE `' . $name . '` LIKE ?',
                [$old, $new, '%' . $old . '%']
            );
            $updated += $n;
        }
    }
}

echo "DB rows updated: {$updated}\n";

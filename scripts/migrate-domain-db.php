<?php

declare(strict_types=1);

/**
 * Replace legacy siteaacess.store domains in text/json columns.
 * Skips columns with no matches for faster runs on large databases.
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
$dbName = $db->getDatabaseName();
$tables = $db->select('SHOW TABLES');
$key = 'Tables_in_' . $dbName;
$updated = 0;

foreach ($tables as $row) {
    $table = $row->{$key};
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
                'SELECT COUNT(*) AS c FROM `' . $table . '` WHERE `' . $name . '` LIKE ?',
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

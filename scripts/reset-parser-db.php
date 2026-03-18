<?php
// Run on server: php reset-parser-db.php
chdir('/var/www/online-parser.siteaacess.store');
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$n = Illuminate\Support\Facades\DB::table('parser_jobs')->whereIn('status', ['running', 'pending'])->update(['status' => 'stopped']);
echo "Updated $n parser_jobs to stopped\n";

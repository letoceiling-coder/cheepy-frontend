#!/usr/bin/env bash
set -u

cd /var/www/online-parser.siteaacess.store

echo "== MenuParser test =="
php -r 'require "vendor/autoload.php"; $app=require "bootstrap/app.php"; $kernel=$app->make(Illuminate\Contracts\Console\Kernel::class); $kernel->bootstrap(); try { $mp=$app->make(App\Services\SadovodParser\Parsers\MenuParser::class); $res=$mp->parse(); echo "OK categories=".(is_array($res["categories"]??null)?count($res["categories"]):0).(isset($res["cached"])?" cached=1":"").PHP_EOL; } catch (Throwable $e) { echo "ERR ".$e->getMessage().PHP_EOL; }' || true

echo "== CategorySyncService test =="
php -r 'require "vendor/autoload.php"; $app=require "bootstrap/app.php"; $kernel=$app->make(Illuminate\Contracts\Console\Kernel::class); $kernel->bootstrap(); try { $svc=$app->make(App\Services\CategorySyncService::class); $out=$svc->sync(); echo json_encode($out, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES).PHP_EOL; } catch (Throwable $e) { echo "ERR ".$e->getMessage().PHP_EOL; }' || true

echo "== CategorySyncController test (expect 503 on block, not 500) =="
php -r 'require "vendor/autoload.php"; $app=require "bootstrap/app.php"; $kernel=$app->make(Illuminate\Contracts\Console\Kernel::class); $kernel->bootstrap(); $controller=$app->make(App\Http\Controllers\Api\CategorySyncController::class); $svc=$app->make(App\Services\CategorySyncService::class); $resp=$controller($svc); echo $resp->getStatusCode()." ".$resp->getContent().PHP_EOL;'


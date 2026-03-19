#!/usr/bin/env bash
set -eu
cd /var/www/online-parser.siteaacess.store
php artisan tinker --execute='$s = app(\App\Services\Catalog\AutoMappingService::class); $s->logManualOverride(1, 1, 100); $s->logManualOverride(1, 1, 100); echo "last3\n"; var_export(\Illuminate\Support\Facades\DB::table("auto_mapping_logs")->where("donor_category_id", 1)->orderByDesc("id")->limit(3)->get()->toArray());'

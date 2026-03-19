#!/usr/bin/env bash
set -eu
cd /var/www/online-parser.siteaacess.store
echo "=== auto_mapping_logs by decision ==="
php artisan tinker --execute='var_export(Illuminate\Support\Facades\DB::table("auto_mapping_logs")->selectRaw("decision, COUNT(*) as c")->groupBy("decision")->get()->toArray());'
echo ""
echo "=== sample logs ==="
php artisan tinker --execute='var_export(Illuminate\Support\Facades\DB::table("auto_mapping_logs")->orderByDesc("id")->limit(5)->get()->toArray());'
echo ""
echo "=== manual mappings count ==="
php artisan tinker --execute='echo Illuminate\Support\Facades\DB::table("category_mapping")->where("is_manual",1)->count();'
echo ""
echo "=== duplicates donor_category_id ==="
php artisan tinker --execute='var_export(Illuminate\Support\Facades\DB::select("SELECT donor_category_id, COUNT(1) as c FROM category_mapping GROUP BY donor_category_id HAVING COUNT(1) > 1"));'

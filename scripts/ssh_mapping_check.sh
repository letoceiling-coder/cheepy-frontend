#!/usr/bin/env bash
set -eu
cd /var/www/online-parser.siteaacess.store
echo "=== Duplicates (expect empty) ==="
php artisan tinker --execute='var_export(DB::select("SELECT donor_category_id, COUNT(1) as c FROM category_mapping GROUP BY donor_category_id HAVING COUNT(1) > 1"));'
echo ""
echo "=== Last 10 rows ==="
php artisan tinker --execute='var_export(DB::select("SELECT id, donor_category_id, catalog_category_id, confidence, is_manual, updated_at FROM category_mapping ORDER BY updated_at DESC LIMIT 10"));'

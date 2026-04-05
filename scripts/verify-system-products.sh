#!/bin/bash
set -e
cd /var/www/online-parser.siteaacess.store

echo "=== 1. TABLES CHECK ==="
mysql sadavod_parser -e "SHOW TABLES LIKE 'system_products';"
mysql sadavod_parser -e "SHOW TABLES LIKE 'product_sources';"
mysql sadavod_parser -e "SHOW TABLES LIKE 'system_product_attributes';"
mysql sadavod_parser -e "SHOW TABLES LIKE 'system_product_photos';"

echo "=== 2. DESCRIBE system_products ==="
mysql sadavod_parser -e "DESCRIBE system_products;"

echo "=== 3. MIGRATE STATUS ==="
php artisan migrate:status

#!/bin/bash
set -e
cd /var/www/online-parser.siteaacess.store

DB_USER=$(grep "^DB_USERNAME=" .env | cut -d= -f2)
DB_PASS=$(grep "^DB_PASSWORD=" .env | cut -d= -f2)
DB_NAME=$(grep "^DB_DATABASE=" .env | cut -d= -f2)

echo "DB: $DB_NAME"

mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" <<'SQL'
DROP TABLE IF EXISTS attribute_value_normalization;
DROP TABLE IF EXISTS attribute_dictionary;
DELETE FROM migrations WHERE migration LIKE '2026_03_06_200000%';
DELETE FROM migrations WHERE migration LIKE '2026_03_06_200001%';
ALTER TABLE product_attributes DROP COLUMN IF EXISTS confidence;
ALTER TABLE product_attributes DROP INDEX IF EXISTS idx_pa_attr_name;
ALTER TABLE product_attributes DROP INDEX IF EXISTS idx_pa_attr_value;
ALTER TABLE product_attributes DROP INDEX IF EXISTS idx_pa_name_value;
SQL

echo "Cleaned. Running migrations..."
php artisan migrate --force
echo "=== DONE ==="

#!/bin/bash
cd /var/www/online-parser.siteaacess.store

# Drop partially created tables from failed migration
mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" -e "
  DROP TABLE IF EXISTS attribute_value_normalization;
  DROP TABLE IF EXISTS attribute_dictionary;
  DELETE FROM migrations WHERE migration LIKE '2026_03_06_200000%';
  DELETE FROM migrations WHERE migration LIKE '2026_03_06_200001%';
  ALTER TABLE product_attributes DROP COLUMN IF EXISTS confidence;
  DROP INDEX IF EXISTS idx_pa_attr_name ON product_attributes;
  DROP INDEX IF EXISTS idx_pa_attr_value ON product_attributes;
  DROP INDEX IF EXISTS idx_pa_name_value ON product_attributes;
" 2>/dev/null

# Re-run migrations
php artisan migrate --force
echo "--- DONE ---"

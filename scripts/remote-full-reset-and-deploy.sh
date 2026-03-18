#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="/var/www/online-parser.siteaacess.store"
FRONTEND_DIR="/var/www/siteaacess.store"

echo "== CONNECTED: $(hostname) =="

echo "== BACKEND: stop workers =="
cd "$BACKEND_DIR"
php artisan queue:restart || true
supervisorctl stop all || true

DB_NAME=""
if [ -f .env ]; then
  while IFS= read -r line; do
    case "$line" in
      DB_DATABASE=*)
        DB_NAME="${line#DB_DATABASE=}"
        break
        ;;
    esac
  done < .env
fi
DB_NAME="${DB_NAME%$'\r'}"
DB_NAME="${DB_NAME%\"}"; DB_NAME="${DB_NAME#\"}"
DB_NAME="${DB_NAME%\'}"; DB_NAME="${DB_NAME#\'}"
if [ -z "$DB_NAME" ]; then
  echo "WARNING: DB_DATABASE not found in .env; mysql commands may fail."
else
  echo "DB selected: $DB_NAME"
fi

echo "== BACKEND: stop active parser jobs =="
mysql -e "
UPDATE parser_jobs
SET status='stopped'
WHERE status IN ('running','pending');
" ${DB_NAME:+-D "$DB_NAME"} || true

echo "== BACKEND: clear redis queues =="
redis-cli FLUSHDB || true
php artisan queue:flush || true

echo "== BACKEND: truncate parsed data =="
mysql -e "
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE product_photos;
TRUNCATE product_attributes;
TRUNCATE products;
TRUNCATE sellers;
TRUNCATE parser_logs;
SET FOREIGN_KEY_CHECKS=1;
" ${DB_NAME:+-D "$DB_NAME"}

echo "== BACKEND: update code =="
git fetch origin
git reset --hard origin/main

echo "== BACKEND: install deps =="
composer install --no-dev --optimize-autoloader
if [ -f package.json ]; then
  npm install
  npm run build
fi

echo "== BACKEND: migrate =="
php artisan migrate --force

echo "== BACKEND: verify migration/schema =="
php artisan migrate:status || true
mysql -e "SHOW COLUMNS FROM sellers LIKE 'avatar_url';" ${DB_NAME:+-D "$DB_NAME"} || true
mysql -e "SELECT COUNT(*) AS products FROM products; SELECT COUNT(*) AS sellers FROM sellers;" ${DB_NAME:+-D "$DB_NAME"} || true

echo "== BACKEND: clear caches =="
php artisan optimize:clear || true
php artisan config:clear || true
php artisan route:clear || true
php artisan cache:clear || true

echo "== SERVICES: restart =="
supervisorctl reread || true
supervisorctl update || true
supervisorctl start all || true
systemctl reload nginx || true

echo "== VERIFY: system status & menu =="
supervisorctl status || true
redis-cli ping || true
curl -s http://localhost/api/v1/system/status || true
echo
curl -s https://online-parser.siteaacess.store/api/v1/public/menu | head -c 300 || true
echo

echo "== FRONTEND: update and build =="
cd "$FRONTEND_DIR"
git fetch origin
git reset --hard origin/main
npm install
npm run build
systemctl reload nginx || true

echo "== DONE =="

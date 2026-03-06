#!/bin/bash
# Full production reset and redeploy parser system
# Server: ssh root@85.117.235.93
# Project: /var/www/online-parser.siteaacess.store

set -e
cd /var/www/online-parser.siteaacess.store || exit 1

echo "=== 1. STOP PARSER AND WORKERS ==="
php artisan queue:restart
supervisorctl stop all || true

echo "=== 2. STOP ACTIVE PARSER JOBS ==="
mysql -e "
UPDATE parser_jobs
SET status='stopped'
WHERE status IN ('running','pending');
" 2>/dev/null || echo "MySQL update skipped (no parser_jobs)"

echo "=== 3. CLEAR REDIS QUEUES ==="
redis-cli FLUSHDB || true
php artisan queue:flush || true

echo "=== 4. CLEAN WRONG PARSED DATA ==="
mysql -e "
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE product_photos;
TRUNCATE product_attributes;
TRUNCATE products;
TRUNCATE sellers;
TRUNCATE parser_logs;
SET FOREIGN_KEY_CHECKS=1;
"

echo "=== 5. PULL LATEST CODE ==="
git fetch origin
git reset --hard origin/main

echo "=== 6. INSTALL DEPENDENCIES ==="
composer install --no-dev --optimize-autoloader
npm install

echo "=== 7. BUILD FRONTEND ==="
npm run build

echo "=== 8. RUN MIGRATIONS ==="
php artisan migrate --force

echo "=== 9. CLEAR CACHES ==="
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear

echo "=== 10. RESTART SERVICES ==="
supervisorctl reread
supervisorctl update
supervisorctl start all
systemctl reload nginx

echo "=== 11. VERIFY ==="
supervisorctl status
redis-cli ping
curl -s http://localhost/api/v1/system/status | head -c 200
echo ""
mysql -e "SELECT COUNT(*) as products FROM products; SELECT COUNT(*) as sellers FROM sellers;"

echo "=== DONE: Parser reset complete ==="

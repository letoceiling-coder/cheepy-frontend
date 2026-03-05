#!/bin/bash
# Deploy parser changes to production — run ON SERVER via SSH
# Usage: scp this file + api.php to server, then: bash deploy-to-server.sh

set -e
APP_PATH="/var/www/online-parser.siteaacess.store"
cd "$APP_PATH"

echo "=== 1. Composer ==="
composer install --no-dev --optimize-autoloader

echo "=== 2. Migrations ==="
php artisan migrate --force

echo "=== 3. Clear caches ==="
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear

echo "=== 4. Verify routes ==="
php artisan route:list | grep -E "api/v1/(up|health|ws-status)" || true

echo "=== 5. Test health locally ==="
curl -s "http://127.0.0.1/api/v1/up" 2>/dev/null || curl -s "https://online-parser.siteaacess.store/api/v1/up" || true
echo ""
curl -s "https://online-parser.siteaacess.store/api/v1/ws-status" 2>/dev/null || true
echo ""

echo ""
echo "Deploy complete. Run: curl https://online-parser.siteaacess.store/api/v1/ws-status"

#!/bin/bash
set -euo pipefail

FRONTEND_ROOT=/var/www/siteaacess.store
BACKEND_ROOT=/var/www/online-parser.siteaacess.store
SCRIPT_DIR="$FRONTEND_ROOT/scripts"

echo "=== DB ==="
BACKEND_ROOT="$BACKEND_ROOT" php "$SCRIPT_DIR/migrate-domain-db.php"

echo "=== Backend cache ==="
cd "$BACKEND_ROOT"
php artisan config:cache
php artisan queue:restart

echo "=== Cleanup ==="
truncate -s 0 "$BACKEND_ROOT/storage/logs/laravel.log"
find "$BACKEND_ROOT/storage/logs" -name '*.log.*' -mtime +7 -delete 2>/dev/null || true
find "$FRONTEND_ROOT" -maxdepth 1 -type d -name 'dist.backup.*' -exec rm -rf {} + 2>/dev/null || true

echo "=== Frontend build ==="
cat > "$FRONTEND_ROOT/.env.production" <<EOF
VITE_API_URL=https://online-parser.cheepy.shop/api/v1
VITE_REVERB_HOST=online-parser.cheepy.shop
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=parser-key
EOF
cd "$FRONTEND_ROOT"
set -a
source .env.production
set +a
npm ci
npm run build

echo "=== Services ==="
nginx -t
systemctl reload nginx
supervisorctl restart reverb || true

if [ -f /var/www/deploy.sh ]; then
  sed -i 's|online-parser.siteaacess.store|online-parser.cheepy.shop|g; s|https://siteaacess.store|https://cheepy.shop|g' /var/www/deploy.sh
fi

echo "=== Health ==="
curl -sf "https://online-parser.cheepy.shop/api/v1/health"
echo
curl -sfI "https://cheepy.shop" | head -3
echo "=== FINISH ==="

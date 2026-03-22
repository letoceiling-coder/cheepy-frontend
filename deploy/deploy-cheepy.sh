#!/bin/bash
#
# CHEEPY DEPLOY — единственная разрешённая команда деплоя
# ANY OTHER DEPLOY METHOD IS FORBIDDEN
#
# Использование: bash /var/www/deploy-cheepy.sh
#

set -e

echo "===== CHEEPY DEPLOY START ====="

BACKEND_PATH="/var/www/online-parser.siteaacess.store"
FRONTEND_PATH="/var/www/siteaacess.store"

# ---------------- BACKEND ----------------
echo "----- BACKEND -----"
cd $BACKEND_PATH

echo "[1/6] Git pull..."
git pull origin main

echo "[2/6] Composer install..."
composer install --no-dev --optimize-autoloader

echo "[3/6] Migrate..."
php artisan migrate --force

echo "[4/6] Seed (optional)..."
php artisan db:seed --force || true

echo "[5/6] Cache clear..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

echo "[6/6] Queue restart..."
php artisan queue:restart || true

echo "Fix permissions..."
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

# ---------------- FRONTEND ----------------
echo "----- FRONTEND -----"
cd $FRONTEND_PATH

echo "[1/3] Git pull..."
git pull origin main

echo "[2/3] Install deps..."
npm install

echo "[3/3] Build..."
npm run build

# ---------------- SYSTEM ----------------
echo "----- SYSTEM -----"

echo "Reload nginx..."
systemctl reload nginx

# ---------------- HEALTH CHECK ----------------
echo "----- HEALTH CHECK -----"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://online-parser.siteaacess.store/api/v1/health)
FRONT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://siteaacess.store)

echo "API STATUS: $API_STATUS"
echo "FRONT STATUS: $FRONT_STATUS"

if [ "$API_STATUS" != "200" ]; then
  echo "❌ API FAILED"
  exit 1
fi

if [ "$FRONT_STATUS" != "200" ]; then
  echo "❌ FRONT FAILED"
  exit 1
fi

echo "===== DEPLOY DONE (OK) ====="

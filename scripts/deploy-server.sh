#!/bin/bash
set -e

echo "===== DEPLOY START ====="

# BACKEND
cd /var/www/online-parser.siteaacess.store
git fetch origin
git reset --hard origin/main

composer install --no-dev --optimize-autoloader

php artisan migrate --force
php artisan optimize:clear
php artisan optimize

php artisan queue:restart

chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "Backend updated"

# FRONTEND
cd /var/www/siteaacess.store
git fetch origin
git reset --hard origin/main

npm install
npm run build

echo "Frontend built"

# SERVICES
supervisorctl restart all
systemctl reload nginx

echo "===== DEPLOY COMPLETE ====="

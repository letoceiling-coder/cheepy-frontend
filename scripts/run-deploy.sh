#!/bin/bash
# Run on server via: ssh root@85.117.235.93 "bash -s" < scripts/run-deploy.sh
# Or: ssh root@85.117.235.93 "bash /var/www/deploy.sh"

set -e
cd /var/www/online-parser.siteaacess.store
git pull origin main
composer install --no-dev --optimize-autoloader
cp .env.example .env 2>/dev/null || true
php artisan key:generate 2>/dev/null || true
php artisan migrate --force
php artisan optimize
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

cd /var/www/siteaacess.store
git pull origin main
npm install
npm run build

systemctl reload nginx
supervisorctl restart all
echo "Deploy completed."

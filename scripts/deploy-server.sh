#!/bin/bash
set -e
echo "Updating backend..."
cd /var/www/online-parser.siteaacess.store
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize

echo "Restarting queue workers..."
supervisorctl restart all

echo "Updating frontend..."
cd /var/www/siteaacess.store
git pull
npm install
npm run build

echo "Reloading nginx..."
systemctl reload nginx

echo "Deploy completed."

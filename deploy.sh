#!/bin/bash

set -e

echo "🚀 START DEPLOY"

########################################
# STEP 1 — PUSH LOCAL
########################################

echo "📦 PUSH FRONTEND"
cd ~/cheepy-frontend
git add .
git commit -m "deploy frontend" || echo "no changes frontend"
git push origin main

echo "📦 PUSH BACKEND"
cd ~/cheepy-backend
git add .
git commit -m "deploy backend" || echo "no changes backend"
git push origin main

########################################
# STEP 2 — SERVER
########################################

ssh root@85.117.235.93 << 'EOF'

set -e

echo "🧠 SERVER DEPLOY START"

########################################
# BACKEND
########################################

cd /var/www/online-parser.siteaacess.store

git reset --hard
git clean -fd
git checkout main
git pull origin main

composer install --no-dev --optimize-autoloader

php artisan migrate --force

php artisan config:clear
php artisan cache:clear
php artisan route:clear

########################################
# FRONTEND
########################################

cd /var/www/siteaacess.store

git reset --hard
git clean -fd
git checkout main
git pull origin main

npm ci
npm run build

########################################
# SERVICES
########################################

systemctl reload nginx

supervisorctl restart all
supervisorctl status

########################################
# HEALTH CHECK
########################################

curl -f https://online-parser.siteaacess.store/api/health
curl -f https://siteaacess.store

echo "✅ DEPLOY DONE"

EOF

echo "🎉 ALL DONE"

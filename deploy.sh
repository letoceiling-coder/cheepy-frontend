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

echo "🔍 BACKEND VERSION"
git rev-parse HEAD

composer install --no-dev --optimize-autoloader --no-interaction

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

echo "🔍 FRONTEND VERSION"
git rev-parse HEAD

npm ci
npm run build

if [ ! -d "dist" ]; then
  echo "❌ BUILD FAILED: dist not found"
  exit 1
fi

echo "📦 DIST CONTENT"
ls -la dist | head -n 5

########################################
# SERVICES
########################################

systemctl reload nginx
systemctl is-active nginx

supervisorctl restart all

echo "🔍 CHECK WORKERS"
supervisorctl status

if supervisorctl status | grep -E "STOPPED|FATAL|EXITED"; then
  echo "❌ WORKERS FAILED"
  exit 1
fi

########################################
# HEALTH CHECK
########################################

echo "🩺 HEALTH CHECK"

RESPONSE=$(curl -s https://online-parser.siteaacess.store/api/health)

echo "$RESPONSE"

if ! echo "$RESPONSE" | grep -q '"status"'; then
  echo "❌ INVALID HEALTH RESPONSE STRUCTURE"
  exit 1
fi

if ! echo "$RESPONSE" | grep -q '"status":"ok"'; then
  echo "❌ API NOT HEALTHY"
  exit 1
fi

curl -f https://siteaacess.store

echo "✅ DEPLOY DONE"

EOF

echo "🎉 ALL DONE"

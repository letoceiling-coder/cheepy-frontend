#!/bin/bash
set -e

# Deploy script for Cheepy (backend + frontend).
# Copy to server: scp scripts/deploy.sh root@85.117.235.93:/var/www/deploy.sh
# Run: ssh root@85.117.235.93 "bash /var/www/deploy.sh"
# NOTE: This script never overwrites .env (git reset only affects tracked files; .env is gitignored).

echo "===== DEPLOY START ====="

# -----------------------------------------------------------------------------
# BACKEND
# -----------------------------------------------------------------------------
cd /var/www/online-parser.siteaacess.store
git fetch origin
git reset --hard origin/main

# Ensure JWT_SECRET exists and is >= 32 chars (required by firebase/php-jwt HS256)
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo "WARN: .env not found, creating from .env.example"
  cp .env.example .env 2>/dev/null || touch .env
fi
JWT_VAL=$(grep -E '^JWT_SECRET=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'")
LEN=${#JWT_VAL}
if [ -z "$JWT_VAL" ] || [ "$LEN" -lt 32 ]; then
  NEW_KEY=$(openssl rand -hex 32)
  if grep -q '^JWT_SECRET=' "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_KEY|" "$ENV_FILE"
  else
    echo "JWT_SECRET=$NEW_KEY" >> "$ENV_FILE"
  fi
  echo "JWT_SECRET was missing or too short; generated new key (length 64)"
fi

composer install --no-dev --optimize-autoloader

php artisan migrate --force
php artisan optimize:clear
php artisan cache:clear
php artisan route:clear
php artisan config:cache

php artisan queue:restart

chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "Backend updated"

# -----------------------------------------------------------------------------
# FRONTEND
# -----------------------------------------------------------------------------
cd /var/www/siteaacess.store
git fetch origin
git reset --hard origin/main

npm install
npm run build

echo "Frontend built"

# -----------------------------------------------------------------------------
# SERVICES
# -----------------------------------------------------------------------------
supervisorctl restart all
systemctl reload nginx

echo "===== DEPLOY COMPLETE ====="

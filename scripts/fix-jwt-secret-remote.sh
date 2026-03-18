#!/bin/bash
# Run on server: ssh root@85.117.235.93 'bash -s' < scripts/fix-jwt-secret-remote.sh
cd /var/www/online-parser.siteaacess.store
NEW_KEY=$(openssl rand -hex 32)
if grep -q '^JWT_SECRET=' .env 2>/dev/null; then
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${NEW_KEY}|" .env
else
  echo "JWT_SECRET=${NEW_KEY}" >> .env
fi
php artisan config:clear
php artisan config:cache
echo "JWT_SECRET updated (64 chars)"
echo "Test login: POST https://online-parser.siteaacess.store/api/v1/auth/login"

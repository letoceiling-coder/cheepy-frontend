#!/bin/bash

set -euo pipefail

echo "🚀 START DEPLOY"

########################################
# Репозитории на машине, где запускается скрипт
########################################
# deploy.sh лежит в корне фронтенд-репо (cheepy). Бэкенд по умолчанию — соседний каталог sadavod-laravel
# (типично C:\OSPanel\domains\cheepy и C:\OSPanel\domains\sadavod-laravel в Git Bash: /c/OSPanel/domains/...).
# При другом расположении: export CHEEPY_BACKEND_ROOT=/path/to/cheepy-backend
#
DEPLOY_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHEEPY_FRONTEND_ROOT="${CHEEPY_FRONTEND_ROOT:-$DEPLOY_SCRIPT_DIR}"
CHEEPY_BACKEND_ROOT="${CHEEPY_BACKEND_ROOT:-$(cd "$DEPLOY_SCRIPT_DIR/../sadavod-laravel" 2>/dev/null && pwd || true)}"

if [[ -z "${CHEEPY_FRONTEND_ROOT:-}" ]] || [[ ! -d "$CHEEPY_FRONTEND_ROOT/.git" ]]; then
  echo "❌ Фронтенд-репозиторий не найден: ${CHEEPY_FRONTEND_ROOT:-<пусто>} (ожидается .git)"
  exit 1
fi
if [[ -z "${CHEEPY_BACKEND_ROOT:-}" ]] || [[ ! -d "$CHEEPY_BACKEND_ROOT/.git" ]]; then
  echo "❌ Бэкенд-репозиторий не найден: ${CHEEPY_BACKEND_ROOT:-<пусто>}"
  echo "   Ожидается соседний каталог ../sadavod-laravel от deploy.sh или задайте: export CHEEPY_BACKEND_ROOT=/path/to/repo"
  exit 1
fi

echo "📂 FRONTEND: $CHEEPY_FRONTEND_ROOT"
echo "📂 BACKEND:  $CHEEPY_BACKEND_ROOT"

########################################
# STEP 1 — PUSH LOCAL
########################################

echo "📦 PUSH FRONTEND"
cd "$CHEEPY_FRONTEND_ROOT"
git add .
git commit -m "deploy frontend" || echo "no changes frontend"
git push origin main

echo "📦 PUSH BACKEND"
cd "$CHEEPY_BACKEND_ROOT"
git add .
git commit -m "deploy backend" || echo "no changes backend"
git push origin main

########################################
# STEP 2 — SERVER (SSH от root: единый сценарий с prod)
########################################

ssh root@85.117.235.93 << 'EOF'

set -euo pipefail

echo "🧠 SERVER DEPLOY START (user: $(whoami))"

# Git 2.35+: при владельце репозитория не root — иначе git в /var/www/siteaacess.store падает с «dubious ownership»
if ! git config --global --get-all safe.directory 2>/dev/null | grep -Fxq '/var/www/siteaacess.store'; then
  git config --global --add safe.directory /var/www/siteaacess.store
fi

########################################
# BACKEND
########################################

cd /var/www/online-parser.siteaacess.store

git fetch origin
git checkout main
git reset --hard origin/main

# Удаляем только безопасный мусор; не трогаем .env и типичные runtime-каталоги Laravel
git clean -fd \
  -e .env \
  -e '.env.*' \
  -e storage \
  -e bootstrap/cache

echo "🔍 BACKEND VERSION"
git rev-parse HEAD

export COMPOSER_ALLOW_SUPERUSER=1
composer install --no-dev --optimize-autoloader --no-interaction

php artisan migrate --force

php artisan optimize:clear

php artisan config:cache

php artisan queue:restart

# PHP-FPM / воркеры обычно работают от www-data — выравниваем владельцев после деплоя от root
chown -R www-data:www-data storage bootstrap/cache || true

########################################
# FRONTEND
########################################

cd /var/www/siteaacess.store

git fetch origin
git checkout main
git reset --hard origin/main

# Не удаляем .env и не трогаем собранный dist до npm run build — исключаем .env; dist пересоберём
git clean -fd \
  -e .env \
  -e '.env.*'

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
# HEALTH CHECK (JSON с пробелами или без: "status": "ok" / "status":"ok")
########################################

echo "🩺 HEALTH CHECK"

RESPONSE=$(curl -sS https://online-parser.siteaacess.store/api/health)

echo "$RESPONSE"

if ! echo "$RESPONSE" | grep -q '"status"'; then
  echo "❌ INVALID HEALTH RESPONSE STRUCTURE"
  exit 1
fi

if ! echo "$RESPONSE" | grep -qE '"status"[[:space:]]*:[[:space:]]*"ok"'; then
  echo "❌ API NOT HEALTHY"
  exit 1
fi

curl -fS https://siteaacess.store

echo "✅ DEPLOY DONE"

EOF

echo "🎉 ALL DONE"

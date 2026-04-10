#!/usr/bin/env bash
# Одноразово: подтянуть бэкенд, убрать частично созданные таблицы конструктора, migrate + seeder.
set -euo pipefail
ssh root@85.117.235.93 'bash -s' << 'REMOTE'
set -euo pipefail
cd /var/www/online-parser.siteaacess.store
git fetch origin
git reset --hard origin/main
php artisan tinker --execute="Schema::dropIfExists('constructor_layout_template_blocks'); Schema::dropIfExists('constructor_layout_templates');"
php artisan migrate --force
php artisan db:seed --class=ConstructorLayoutTemplatesSeeder --force
echo OK
REMOTE

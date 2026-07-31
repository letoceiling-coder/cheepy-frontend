#!/bin/bash
# Migrate Cheepy production from siteaacess.store → cheepy.shop
# Run on server: bash /var/www/siteaacess.store/scripts/migrate-domain-cheepy-shop.sh

set -euo pipefail

FRONTEND_ROOT="${FRONTEND_ROOT:-/var/www/siteaacess.store}"
BACKEND_ROOT="${BACKEND_ROOT:-/var/www/online-parser.siteaacess.store}"
OLD_FRONT="siteaacess.store"
OLD_API="online-parser.siteaacess.store"
OLD_OLLAMA="ollama.siteaacess.store"
NEW_FRONT="cheepy.shop"
NEW_API="online-parser.cheepy.shop"
NEW_OLLAMA="ollama.cheepy.shop"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { echo "[$(date -Iseconds)] $*"; }

log "=== 1. Nginx vhosts ==="
install -m 644 "$SCRIPT_DIR/nginx-cheepy-shop-frontend.conf" /etc/nginx/sites-available/cheepy.shop
install -m 644 "$SCRIPT_DIR/nginx-online-parser-cheepy-shop.conf" /etc/nginx/sites-available/online-parser.cheepy.shop
ln -sf /etc/nginx/sites-available/cheepy.shop /etc/nginx/sites-enabled/cheepy.shop
ln -sf /etc/nginx/sites-available/online-parser.cheepy.shop /etc/nginx/sites-enabled/online-parser.cheepy.shop

if [ -f /etc/nginx/sites-enabled/ollama.siteaacess.store ]; then
  real=$(readlink -f /etc/nginx/sites-enabled/ollama.siteaacess.store 2>/dev/null || echo /etc/nginx/sites-enabled/ollama.siteaacess.store)
  sed 's/ollama\.siteaacess\.store/ollama.cheepy.shop/g; s/listen \[::\]:443 ssl ipv6only=on/listen [::]:443 ssl/g' "$real" > /etc/nginx/sites-available/ollama.cheepy.shop
  ln -sf /etc/nginx/sites-available/ollama.cheepy.shop /etc/nginx/sites-enabled/ollama.cheepy.shop
  log "Created nginx: ollama.cheepy.shop"
fi

# Avoid duplicate ipv6 listen options while old vhosts remain enabled during DNS transition.
for old_vhost in siteaacess.store online-parser.siteaacess.store ollama.siteaacess.store; do
  f="/etc/nginx/sites-enabled/${old_vhost}"
  if [ -f "$f" ] || [ -L "$f" ]; then
    sed -i 's/listen \[::\]:443 ssl ipv6only=on/listen [::]:443 ssl/g' "$(readlink -f "$f" 2>/dev/null || echo "$f")"
  fi
done

nginx -t
systemctl reload nginx

log "=== 2. SSL (certbot) ==="
certbot certonly --nginx -d cheepy.shop -d www.cheepy.shop --non-interactive --agree-tos -m admin@${NEW_FRONT} --keep-until-expiring 2>/dev/null || \
  certbot --nginx -d cheepy.shop -d www.cheepy.shop --non-interactive --agree-tos -m admin@${NEW_FRONT} --redirect 2>/dev/null || log "WARN: certbot cheepy.shop — check manually"

certbot certonly --nginx -d online-parser.cheepy.shop --non-interactive --agree-tos -m admin@${NEW_FRONT} --keep-until-expiring 2>/dev/null || \
  certbot --nginx -d online-parser.cheepy.shop --non-interactive --agree-tos -m admin@${NEW_FRONT} --redirect 2>/dev/null || log "WARN: certbot API — check manually"

if [ -f /etc/nginx/sites-available/ollama.cheepy.shop ]; then
  certbot certonly --nginx -d ollama.cheepy.shop --non-interactive --agree-tos -m admin@${NEW_FRONT} --keep-until-expiring 2>/dev/null || \
    log "WARN: certbot ollama — check manually"
fi

nginx -t && systemctl reload nginx

log "=== 3. Backend .env ==="
ENV="$BACKEND_ROOT/.env"
if [ -f "$ENV" ]; then
  sed -i "s|https://${OLD_FRONT}|https://${NEW_FRONT}|g" "$ENV"
  sed -i "s|https://${OLD_API}|https://${NEW_API}|g" "$ENV"
  sed -i "s|${OLD_API}|${NEW_API}|g" "$ENV"
  sed -i "s|${OLD_FRONT}|${NEW_FRONT}|g" "$ENV"
  sed -i "s|${OLD_OLLAMA}|${NEW_OLLAMA}|g" "$ENV"
  grep -q '^FRONTEND_URL=' "$ENV" && sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=https://${NEW_FRONT},https://www.${NEW_FRONT},http://cheepy.loc|" "$ENV"
  grep -q '^SANCTUM_STATEFUL_DOMAINS=' "$ENV" && sed -i "s|^SANCTUM_STATEFUL_DOMAINS=.*|SANCTUM_STATEFUL_DOMAINS=${NEW_FRONT},www.${NEW_FRONT}|" "$ENV"
  grep -q '^APP_URL=' "$ENV" && sed -i "s|^APP_URL=.*|APP_URL=https://${NEW_API}|" "$ENV"
  grep -q '^REVERB_HOST=' "$ENV" && sed -i "s|^REVERB_HOST=.*|REVERB_HOST=${NEW_API}|" "$ENV"
  grep -q '^MAIL_FROM_ADDRESS=' "$ENV" && sed -i "s|^MAIL_FROM_ADDRESS=.*|MAIL_FROM_ADDRESS=\"noreply@${NEW_FRONT}\"|" "$ENV"
  sed -i '/^nSOCIAL_OAUTH/d' "$ENV"
  grep -q '^SOCIAL_OAUTH_FRONTEND_BASE=' "$ENV" || echo "SOCIAL_OAUTH_FRONTEND_BASE=https://${NEW_FRONT}" >> "$ENV"
fi

log "=== 4. Frontend .env for build ==="
cat > "$FRONTEND_ROOT/.env.production" <<EOF
VITE_API_URL=https://${NEW_API}/api/v1
VITE_REVERB_HOST=${NEW_API}
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=parser-key
EOF

log "=== 5. DB domain replace ==="
cd "$BACKEND_ROOT"
php artisan optimize:clear
php -r "
require 'vendor/autoload.php';
\$app = require 'bootstrap/app.php';
\$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
\$from = ['siteaacess.store', 'online-parser.siteaacess.store', 'ollama.siteaacess.store', 'www.siteaacess.store'];
\$to   = ['cheepy.shop', 'online-parser.cheepy.shop', 'ollama.cheepy.shop', 'www.cheepy.shop'];
\$db = DB::connection();
\$tables = \$db->select('SHOW TABLES');
\$key = 'Tables_in_' . \$db->getDatabaseName();
\$updated = 0;
foreach (\$tables as \$row) {
  \$table = \$row->\$key;
  \$cols = \$db->select('SHOW COLUMNS FROM `' . \$table . '`');
  foreach (\$cols as \$col) {
    \$type = strtolower(\$col->Type);
    if (!preg_match('/char|text|json|blob/', \$type)) continue;
    \$name = \$col->Field;
    foreach (\$from as \$i => \$old) {
      \$new = \$to[\$i];
      \$n = \$db->update('UPDATE `' . \$table . '` SET `' . \$name . '` = REPLACE(`' . \$name . '`, ?, ?) WHERE `' . \$name . '` LIKE ?', [\$old, \$new, '%' . \$old . '%']);
      \$updated += \$n;
    }
  }
}
echo \"DB rows updated: \$updated\n\";
"

cd "$BACKEND_ROOT"
php artisan config:cache
php artisan queue:restart

log "=== 6. Cleanup logs & backups ==="
truncate -s 0 "$BACKEND_ROOT/storage/logs/laravel.log" 2>/dev/null || true
find "$BACKEND_ROOT/storage/logs" -name '*.log.*' -mtime +7 -delete 2>/dev/null || true
find "$FRONTEND_ROOT" -maxdepth 1 -type d -name 'dist.backup.*' -exec rm -rf {} + 2>/dev/null || true
docker system prune -af --filter 'until=168h' 2>/dev/null || true

log "=== 7. Rebuild frontend ==="
cd "$FRONTEND_ROOT"
export $(grep -v '^#' .env.production | xargs)
npm ci
npm run build

log "=== 8. Health ==="
curl -sf -o /dev/null -w "frontend: %{http_code}\n" -H "Host: ${NEW_FRONT}" http://127.0.0.1/ || true
curl -sf -o /dev/null -w "api: %{http_code}\n" "https://${NEW_API}/api/v1/health" || true
supervisorctl restart reverb 2>/dev/null || true
supervisorctl status | head -15

log "=== MIGRATION DONE ==="

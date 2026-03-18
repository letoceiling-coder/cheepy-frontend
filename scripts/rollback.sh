#!/bin/bash
# Rollback frontend or backend
# Run on server: bash /var/www/rollback.sh [frontend|backend]
# Or: ssh root@85.117.235.93 "bash /var/www/rollback.sh frontend"

set -e
LOG_DIR="${LOG_DIR:-/var/log/cheepy}"
mkdir -p "$LOG_DIR"

log() { echo "[$(date -Iseconds)] $*" | tee -a "$LOG_DIR/rollback.log"; }

PART="${1:-frontend}"
case "$PART" in
  frontend)
    cd /var/www/siteaacess.store
    LATEST=$(ls -td dist.backup.* 2>/dev/null | head -1)
    if [ -z "$LATEST" ]; then
      log "ERROR: No frontend backup found"
      exit 1
    fi
    log "Rollback frontend: restoring from $LATEST"
    rm -rf dist
    cp -a "$LATEST" dist
    chown -R www-data:www-data dist 2>/dev/null || true
    systemctl reload nginx 2>/dev/null || true
    log "Frontend rollback done"
    ;;
  backend)
    log "Backend rollback: resetting to previous git commit"
    cd /var/www/online-parser.siteaacess.store
    PREV=$(git rev-parse HEAD~1 2>/dev/null || true)
    if [ -z "$PREV" ]; then
      log "ERROR: Cannot find previous commit"
      exit 1
    fi
    git reset --hard "$PREV"
    composer install --no-dev --optimize-autoloader
    php artisan migrate:rollback --step=1 --force 2>/dev/null || log "WARN: migrate:rollback skipped (check manually)"
    php artisan optimize:clear
    php artisan config:cache
    php artisan queue:restart
    chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
    supervisorctl restart all 2>/dev/null || true
    log "Backend rollback done (at $PREV)"
    ;;
  *)
    echo "Usage: $0 frontend|backend"
    exit 1
    ;;
esac

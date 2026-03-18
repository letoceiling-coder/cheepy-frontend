#!/bin/bash
# Production deploy for Cheepy (backend + frontend)
# Copy to server: scp scripts/deploy.sh root@85.117.235.93:/var/www/deploy.sh
# Run: ssh root@85.117.235.93 "bash /var/www/deploy.sh"
# Or: bash scripts/deploy-remote.sh
#
# Features: backup before deploy, health-check after, logging, rollback on fail
# Usage: bash deploy.sh [frontend|backend|all]  (default: all)

set -e
PART="${1:-all}"
LOG_DIR="${LOG_DIR:-/var/log/cheepy}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deploy.log"
BACKUP_KEEP=5

log() { echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"; }

health_check() {
  curl -sf --connect-timeout 5 "https://siteaacess.store" -o /dev/null && \
  curl -sf --connect-timeout 5 "https://online-parser.siteaacess.store/api/v1/up" -o /dev/null
}

cleanup_old_backups() {
  local dir="$1"
  local pattern="$2"
  cd "$dir"
  ls -td $pattern 2>/dev/null | tail -n +$((BACKUP_KEEP+1)) | xargs -r rm -rf
  cd - >/dev/null
}

log "===== DEPLOY START (part=$PART) ====="

# Pre-deploy checks
if ! curl -sf --connect-timeout 3 "https://online-parser.siteaacess.store/api/v1/up" -o /dev/null 2>/dev/null; then
  log "WARN: API pre-check failed (server may be down or unreachable)"
fi
DISK=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
[ -n "$DISK" ] && [ "$DISK" -gt 90 ] && { log "ERROR: Disk usage ${DISK}%"; exit 1; }

# -----------------------------------------------------------------------------
# BACKEND
# -----------------------------------------------------------------------------
if [ "$PART" = "backend" ] || [ "$PART" = "all" ]; then
log "Backend deploy..."
cd /var/www/online-parser.siteaacess.store
git fetch origin
git reset --hard origin/main

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  log "WARN: .env not found, creating from .env.example"
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
  log "JWT_SECRET was missing or short; generated new key"
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

log "Backend updated"

# -----------------------------------------------------------------------------
# FRONTEND (with backup)
# -----------------------------------------------------------------------------
if [ "$PART" = "frontend" ] || [ "$PART" = "all" ]; then
BACKUP_NAME=""
log "Frontend deploy..."
cd /var/www/siteaacess.store

# Backup current dist before overwrite
if [ -d dist ] && [ -n "$(ls -A dist 2>/dev/null)" ]; then
  BACKUP_NAME="dist.backup.$(date +%Y%m%d_%H%M%S)"
  cp -a dist "$BACKUP_NAME"
  log "Backup: $BACKUP_NAME"
  cleanup_old_backups /var/www/siteaacess.store "dist.backup.*"
fi

git fetch origin
git reset --hard origin/main

npm ci 2>/dev/null || npm install
npm run build

# Verify build
if [ ! -f dist/index.html ]; then
  log "ERROR: Frontend build failed (no dist/index.html)"
  if [ -n "$BACKUP_NAME" ] && [ -d "$BACKUP_NAME" ]; then
    log "Rollback: restoring $BACKUP_NAME"
    rm -rf dist
    mv "$BACKUP_NAME" dist
  fi
  exit 1
fi

log "Frontend built"
fi

# -----------------------------------------------------------------------------
# SERVICES
# -----------------------------------------------------------------------------
if [ "$PART" = "all" ] || [ "$PART" = "backend" ]; then
  supervisorctl restart all
fi
systemctl reload nginx

# -----------------------------------------------------------------------------
# HEALTH CHECK
# -----------------------------------------------------------------------------
log "Health check..."
if health_check; then
  log "===== DEPLOY COMPLETE (OK) ====="
else
  log "WARN: Health check failed. Site may be unavailable. Consider: bash /var/www/rollback.sh frontend"
  exit 1
fi

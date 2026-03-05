#!/bin/bash
# Complete Server Audit Script — run on VPS via SSH
# Usage: scp server-audit.sh user@server:/tmp/ && ssh user@server "bash /tmp/server-audit.sh"

set -e
OUTDIR="/tmp/audit-output"
mkdir -p "$OUTDIR"

echo "=== Phase 1: Server Infrastructure ==="
{
  echo "# SERVER INFRASTRUCTURE AUDIT"
  echo "Date: $(date -Iseconds)"
  echo ""
  echo "## OS"
  cat /etc/os-release 2>/dev/null || true
  echo ""
  echo "## CPU cores: $(nproc)"
  echo ""
  echo "## Memory"
  free -h
  echo ""
  echo "## Disk"
  df -h
  echo ""
  echo "## Swap"
  swapon --show 2>/dev/null || echo "No swap"
  echo ""
  echo "## PHP"
  php -v 2>/dev/null || echo "PHP not found"
  echo ""
  echo "## MariaDB/MySQL"
  mysql --version 2>/dev/null || mariadb --version 2>/dev/null || echo "Not found"
  echo ""
  echo "## Services"
  for s in nginx php8.2-fpm mariadb redis-server supervisor; do
    printf "%-20s " "$s:"
    systemctl is-active "$s" 2>/dev/null || echo "not found"
  done
  echo ""
  echo "## Supervisor workers"
  supervisorctl status 2>/dev/null || echo "Supervisor not running"
  echo ""
  echo "## Cron (root)"
  crontab -l 2>/dev/null || echo "No crontab"
  echo ""
  echo "## Cron (www-data)"
  crontab -u www-data -l 2>/dev/null || echo "No www-data crontab"
  echo ""
  echo "## Laravel path"
  ls -la /var/www/online-parser.siteaacess.store/artisan 2>/dev/null || echo "Not found"
} > "$OUTDIR/SERVER_INFRASTRUCTURE_AUDIT.md"

echo "=== Phase 2: Redis ==="
{
  echo "# REDIS VALIDATION REPORT"
  echo "Date: $(date -Iseconds)"
  echo ""
  echo "## redis-cli ping"
  redis-cli ping 2>/dev/null || echo "FAIL: Redis not reachable"
  echo ""
  echo "## redis-cli info memory"
  redis-cli info memory 2>/dev/null || true
  echo ""
  echo "## appendonly"
  redis-cli config get appendonly 2>/dev/null || echo "N/A"
  echo ""
  echo "## Queue sizes"
  echo "default: $(redis-cli LLEN queues:default 2>/dev/null || echo 'N/A')"
  echo "photos: $(redis-cli LLEN queues:photos 2>/dev/null || echo 'N/A')"
} > "$OUTDIR/REDIS_VALIDATION_REPORT.md"

echo "=== Phase 3: Supervisor config ==="
{
  echo "# QUEUE VALIDATION REPORT"
  echo "Date: $(date -Iseconds)"
  echo ""
  echo "## parser-worker.conf"
  cat /etc/supervisor/conf.d/parser-worker.conf 2>/dev/null || echo "File not found"
  echo ""
  echo "## parser-worker-photos.conf"
  cat /etc/supervisor/conf.d/parser-worker-photos.conf 2>/dev/null || echo "File not found"
  echo ""
  echo "## supervisorctl status"
  supervisorctl status 2>/dev/null || echo "N/A"
} > "$OUTDIR/QUEUE_VALIDATION_REPORT.md"

echo "=== Phase 4: Laravel tinker (Redis) ==="
cd /var/www/online-parser.siteaacess.store 2>/dev/null && {
  php artisan tinker --execute="
    try {
      \Cache::store('redis')->put('audit_test', 'ok', 60);
      \$v = \Cache::store('redis')->get('audit_test');
      echo 'Laravel Redis: ' . (\$v === 'ok' ? 'OK' : 'FAIL') . PHP_EOL;
      echo 'Queue size: ' . \Queue::connection('redis')->size('default') . PHP_EOL;
    } catch (\Throwable \$e) {
      echo 'Laravel Redis: FAIL - ' . \$e->getMessage() . PHP_EOL;
    }
  " 2>/dev/null >> "$OUTDIR/REDIS_VALIDATION_REPORT.md" || true
} || true

echo "=== Phase 5: .env check ==="
{
  echo "# ENV CHECK"
  echo ""
  grep -E "QUEUE_CONNECTION|CACHE_DRIVER|REDIS" /var/www/online-parser.siteaacess.store/.env 2>/dev/null | sed 's/=.*/=***/' || echo "Cannot read .env"
} >> "$OUTDIR/QUEUE_VALIDATION_REPORT.md"

echo "=== Audit complete. Output in $OUTDIR ==="
ls -la "$OUTDIR"

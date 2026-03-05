#!/bin/bash
# Full server validation — run ON SERVER via SSH
# Outputs to stdout; redirect to file for audit docs

OUT="$1"
[ -z "$OUT" ] && OUT="/tmp/validation-output.txt"

exec > >(tee -a "$OUT") 2>&1

echo "=== $(date) FULL SERVER VALIDATION ==="

echo ""
echo "--- 1. Health ---"
curl -s "https://online-parser.siteaacess.store/api/v1/up" | head -c 200
echo ""
curl -s "https://online-parser.siteaacess.store/api/v1/health" | head -c 500
echo ""
echo ""
echo "--- 1b. WebSocket status ---"
curl -s "https://online-parser.siteaacess.store/api/v1/ws-status" | head -c 200
echo ""

echo ""
echo "--- 2. Redis ---"
redis-cli ping 2>/dev/null || echo "Redis: FAIL"
redis-cli config get appendonly 2>/dev/null
redis-cli LLEN queues:default 2>/dev/null

echo ""
echo "--- 3. Supervisor ---"
supervisorctl status 2>/dev/null || echo "Supervisor: FAIL"

echo ""
echo "--- 4. Services ---"
for s in nginx php8.2-fpm mariadb redis-server supervisor; do
  printf "%-20s %s\n" "$s:" "$(systemctl is-active $s 2>/dev/null || echo '?')"
done

echo ""
echo "--- 5. Laravel Tinker (Redis) ---"
cd /var/www/online-parser.siteaacess.store 2>/dev/null && php artisan tinker --execute="
try {
  \Cache::store('redis')->put('validate','ok',60);
  echo 'Cache: ' . (\Cache::store('redis')->get('validate') === 'ok' ? 'OK' : 'FAIL') . PHP_EOL;
  echo 'Queue size: ' . \Queue::connection('redis')->size('default') . PHP_EOL;
} catch (\Throwable \$e) { echo 'Redis: ' . \$e->getMessage() . PHP_EOL; }
" 2>/dev/null || echo "Tinker: SKIP"

echo ""
echo "=== Validation complete. Output: $OUT ==="

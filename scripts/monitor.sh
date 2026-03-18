#!/bin/bash
# Monitoring script - run via cron every 5 min
# Crontab: */5 * * * * /var/www/siteaacess.store/scripts/monitor.sh
# Or from repo: bash scripts/monitor.sh (run on server)
#
# Checks: Frontend, API, WebSocket status
# Logs to /var/log/cheepy/health.log

LOG_DIR="${LOG_DIR:-/var/log/cheepy}"
LOG_FILE="$LOG_DIR/health.log"
mkdir -p "$LOG_DIR"

check() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "000")
  echo "$(date -Iseconds) $name HTTP $code" >> "$LOG_FILE"
  [ "$code" = "200" ]
}

FAIL=0
check "frontend" "https://siteaacess.store" || FAIL=1
check "api" "https://online-parser.siteaacess.store/api/v1/up" || FAIL=1

# ws-status (optional - may require auth)
curl -s --connect-timeout 3 "https://online-parser.siteaacess.store/api/v1/ws-status" | head -c 200 >> "$LOG_FILE" 2>/dev/null || true
echo "" >> "$LOG_FILE"

[ $FAIL -eq 0 ] && exit 0
exit 1

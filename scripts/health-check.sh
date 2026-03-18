#!/bin/bash
# Health check for Cheepy production
# Usage: ./scripts/health-check.sh [--quiet]
# Exit 0 = OK, 1 = FAIL

set -e
QUIET=""
[ "$1" = "--quiet" ] && QUIET=1

check() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    [ -z "$QUIET" ] && echo "OK $name ($code)"
    return 0
  else
    [ -z "$QUIET" ] && echo "FAIL $name (HTTP $code)"
    return 1
  fi
}

FAIL=0
check "Frontend https://siteaacess.store" "https://siteaacess.store" || FAIL=1
check "API /up" "https://online-parser.siteaacess.store/api/v1/up" || FAIL=1

[ $FAIL -eq 0 ] && exit 0
exit 1

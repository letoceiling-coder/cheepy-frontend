#!/bin/bash
# Run on server: bash scripts/check-payments-db.sh
# Requires: mysql access (from Laravel .env or my.cnf)

cd /var/www/online-parser.siteaacess.store 2>/dev/null || true
DB=$(grep DB_DATABASE .env 2>/dev/null | cut -d= -f2)
[ -z "$DB" ] && DB="sadavod_parser"

echo "=== payment_webhook_logs (last 5) ==="
mysql -D "$DB" -N -e "SELECT id, provider, provider_event_id, status, LEFT(COALESCE(error,''),50) FROM payment_webhook_logs ORDER BY id DESC LIMIT 5" 2>/dev/null || echo "Need mysql credentials"

echo ""
echo "=== payments succeeded (atol_uuid) ==="
mysql -D "$DB" -N -e "SELECT id, atol_status, atol_uuid FROM payments WHERE status='succeeded' ORDER BY id DESC LIMIT 5" 2>/dev/null || echo "Need mysql credentials"

#!/bin/bash
# Test CRM payment-providers API with real token
# Usage: ./crm-api-test.sh [email] [password]
# Default: admin@sadavod.loc admin123

EMAIL="${1:-admin@sadavod.loc}"
PASS="${2:-admin123}"
API="https://online-parser.siteaacess.store/api/v1"

echo "=== Login ==="
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  exit 1
fi
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "=== GET /crm/payment-providers ==="
curl -s "$API/crm/payment-providers" \
  -H "Authorization: Bearer $TOKEN"

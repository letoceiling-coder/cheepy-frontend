#!/bin/bash
# API audit script — run locally, requires curl and jq
# Usage: ./scripts/audit-api.sh [BASE_URL]

BASE="${1:-https://online-parser.siteaacess.store/api/v1}"
# Try /up or /health — routes may vary

echo "=== API Audit: $BASE ==="

# Health (no auth)
echo ""
echo "1. GET /up"
curl -s -o /dev/null -w "%{http_code}" "$BASE/up"
echo " (expect 200)"

echo ""
echo "2. GET /health"
curl -s "$BASE/health" | jq . 2>/dev/null || curl -s "$BASE/health"

# Login (requires valid credentials)
echo ""
echo "3. POST /auth/login (test format)"
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' | jq . 2>/dev/null || echo "(401/422 expected for invalid creds)"

echo ""
echo "Done. For full audit use valid JWT and test protected endpoints."

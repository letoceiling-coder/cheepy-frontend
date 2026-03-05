#!/bin/bash
# Verify category counts: frontend vs admin vs database
# Usage: ./scripts/verify-category-counts.sh [API_BASE]
# Example: ./scripts/verify-category-counts.sh https://online-parser.siteaacess.store/api/v1

BASE="${1:-https://online-parser.siteaacess.store/api/v1}"
echo "=== Category count verification ==="
echo "API: $BASE"
echo ""

# Frontend/public menu (no auth)
MENU_COUNT=$(curl -s "$BASE/public/menu" | grep -o '"id":' | wc -l)
echo "1. GET /public/menu (categories count): $MENU_COUNT"

# Admin categories (requires auth — will get 401 without token)
echo "2. GET /categories?tree=true (admin, auth required)"
echo "   Run with token: curl -H 'Authorization: Bearer TOKEN' $BASE/categories?tree=true"

# Database (via SSH/mysql)
echo ""
echo "3. Database (run on server):"
echo "   mysql -u USER -p DB -e \"SELECT COUNT(*) as total FROM categories;\""
echo "   mysql -u USER -p DB -e \"SELECT COUNT(*) as with_products FROM categories WHERE products_count > 0;\""
echo ""
echo "Expected: menu count ≈ admin tree count ≈ DB total (flat count may differ from tree nodes)"

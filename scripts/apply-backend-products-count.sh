#!/bin/bash
# Apply products_count patch to backend CatalogCategoryService.
# Run on server BEFORE or AFTER deploy: bash scripts/apply-backend-products-count.sh

BACKEND_PATH="${BACKEND_PATH:-/var/www/online-parser.siteaacess.store}"
SVC="$BACKEND_PATH/app/Services/Catalog/CatalogCategoryService.php"

if [ ! -f "$SVC" ]; then
  echo "Not found: $SVC"
  exit 1
fi

if grep -q "products_count" "$SVC"; then
  echo "Already patched."
  exit 0
fi

# Add DB facade use
sed -i 's/use Illuminate\\Support\\Collection;/use Illuminate\\Support\\Collection;\nuse Illuminate\\Support\\Facades\\DB;/' "$SVC"

# Replace listPaginated body (simplified - ensure listPaginated has the subquery)
# For robustness, use php script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
php "$SCRIPT_DIR/patch-catalog-products-count.php" 2>/dev/null || {
  echo "Run patch manually. Copy from docs/infrastructure/laravel/app/Services/Catalog/CatalogCategoryService.php"
  exit 1
}
echo "Done."

#!/bin/bash
#
# Copy system-products API (controller, models, routes) from docs to Laravel backend.
# Run on server: bash scripts/patch-system-products-backend.sh
# Or: BACKEND_PATH=/var/www/online-parser.siteaacess.store bash scripts/patch-system-products-backend.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/docs/infrastructure/laravel"
BACKEND="${BACKEND_PATH:-/var/www/online-parser.siteaacess.store}"

if [ ! -d "$BACKEND" ]; then
  echo "Backend path not found: $BACKEND"
  exit 1
fi

echo "Patching backend at: $BACKEND"
echo "Source: $SRC"

# Models
mkdir -p "$BACKEND/app/Models"
cp -v "$SRC/app/Models/SystemProduct.php" "$BACKEND/app/Models/SystemProduct.php" 2>/dev/null || true
cp -v "$SRC/app/Models/ProductSource.php" "$BACKEND/app/Models/ProductSource.php" 2>/dev/null || true

# Controller
mkdir -p "$BACKEND/app/Http/Controllers/Api/Admin"
cp -v "$SRC/app/Http/Controllers/Api/Admin/AdminSystemProductController.php" "$BACKEND/app/Http/Controllers/Api/Admin/AdminSystemProductController.php"

# Routes
cp -v "$SRC/routes/admin_system_products.php" "$BACKEND/routes/admin_system_products.php"

echo ""
echo "Files copied. Now add to routes/api.php (or your API route file):"
echo "  require base_path('routes/admin_system_products.php');"
echo ""
echo "Place it inside the API prefix group with auth middleware, e.g.:"
echo "  Route::prefix('api/v1')->middleware(['auth:sanctum'])->group(function () {"
echo "      require base_path('routes/admin_system_products.php');"
echo "  });"
echo ""
echo "Then run: php artisan route:clear && php artisan optimize:clear"

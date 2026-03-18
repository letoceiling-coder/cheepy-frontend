#!/bin/bash
# Merge blocks, sections, components, pages from strict-copy-dev
# EXCLUDES: src/admin, src/crm (no changes to /admin)

set -e
cd "$(dirname "$0")/.."

echo "=== 1. Creating rollback tag ==="
TAG="before-merge-strict-$(date +%Y%m%d-%H%M)"
git tag "$TAG"
echo "Tag created: $TAG"
echo "To rollback: git checkout $TAG"

echo ""
echo "=== 2. Fetching strict ==="
git fetch strict

echo ""
echo "=== 3. Merging only public-facing paths (no admin, no crm) ==="
# Paths to pull from strict/main
PATHS=(
  "src/components/sections"
  "src/components/home"
  "src/components/Header.tsx"
  "src/components/Footer.tsx"
  "src/components/HeroSlider.tsx"
  "src/components/ProductGrid.tsx"
  "src/components/ProductCard.tsx"
  "src/components/CategoryBanners.tsx"
  "src/components/LookOfTheDay.tsx"
  "src/components/MegaMenu.tsx"
  "src/components/MobileCatalogMenu.tsx"
  "src/components/MobileBottomNav.tsx"
  "src/components/BrandLogo.tsx"
  "src/components/CategoryIcon.tsx"
  "src/components/PageTransition.tsx"
  "src/components/ScrollToTop.tsx"
  "src/components/InformBlock.tsx"
  "src/components/SellersSection.tsx"
  "src/components/MapSection.tsx"
  "src/pages/Index.tsx"
  "src/pages/NotFound.tsx"
  "src/pages/AuthPage.tsx"
  "src/pages/BrandPage.tsx"
  "src/pages/BrandsListPage.tsx"
  "src/pages/CategoryPage.tsx"
  "src/pages/ProductPage.tsx"
  "src/pages/SellerPage.tsx"
  "src/pages/SellersListPage.tsx"
  "src/pages/FavoritesPage.tsx"
  "src/pages/CartPage.tsx"
)

for p in "${PATHS[@]}"; do
  if git checkout "strict/main" -- "$p" 2>/dev/null; then
    echo "  + $p"
  else
    echo "  - $p (skip)"
  fi
done

echo ""
echo "=== 4. Verifying admin untouched ==="
if git diff --name-only HEAD | grep -q "^src/admin/"; then
  echo "ERROR: admin files were modified! Rolling back..."
  git checkout HEAD -- src/admin/
  exit 1
fi
echo "OK: src/admin/ not modified"

echo ""
echo "=== 5. Done. Build and deploy. Rollback: git checkout $TAG -- . ==="

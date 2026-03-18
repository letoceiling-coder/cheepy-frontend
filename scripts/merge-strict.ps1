# Merge blocks, sections, components, pages from strict-copy-dev
# EXCLUDES: src/admin, src/crm (no changes to /admin)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$TAG = "before-merge-strict-$(Get-Date -Format 'yyyyMMdd-HHmm')"
Write-Host "=== 1. Creating rollback tag: $TAG ===" -ForegroundColor Cyan
git tag $TAG
Write-Host "To rollback: git checkout $TAG -- ." -ForegroundColor Yellow

Write-Host ""
Write-Host "=== 2. Fetching strict ===" -ForegroundColor Cyan
git fetch strict

Write-Host ""
Write-Host "=== 3. Merging paths (no admin) ===" -ForegroundColor Cyan
$PATHS = @(
  "src/components/sections",
  "src/components/home",
  "src/components/Header.tsx",
  "src/components/Footer.tsx",
  "src/components/HeroSlider.tsx",
  "src/components/ProductGrid.tsx",
  "src/components/ProductCard.tsx",
  "src/components/CategoryBanners.tsx",
  "src/components/LookOfTheDay.tsx",
  "src/components/MegaMenu.tsx",
  "src/components/MobileCatalogMenu.tsx",
  "src/components/MobileBottomNav.tsx",
  "src/components/BrandLogo.tsx",
  "src/components/CategoryIcon.tsx",
  "src/components/PageTransition.tsx",
  "src/components/ScrollToTop.tsx",
  "src/components/InformBlock.tsx",
  "src/components/SellersSection.tsx",
  "src/components/MapSection.tsx",
  "src/pages/Index.tsx",
  "src/pages/NotFound.tsx",
  "src/pages/AuthPage.tsx",
  "src/pages/BrandPage.tsx",
  "src/pages/BrandsListPage.tsx",
  "src/pages/CategoryPage.tsx",
  "src/pages/ProductPage.tsx",
  "src/pages/SellerPage.tsx",
  "src/pages/SellersListPage.tsx",
  "src/pages/FavoritesPage.tsx",
  "src/pages/CartPage.tsx"
)

foreach ($p in $PATHS) {
  try {
    git checkout "strict/main" -- $p 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "  + $p" -ForegroundColor Green }
    else { Write-Host "  - $p (skip)" -ForegroundColor Gray }
  } catch {
    Write-Host "  - $p (skip)" -ForegroundColor Gray
  }
}

Write-Host ""
Write-Host "=== 4. Verifying admin untouched ===" -ForegroundColor Cyan
$modified = git diff --name-only HEAD 2>$null
if ($modified -match "^src/admin/") {
  Write-Host "ERROR: admin modified! Rolling back..." -ForegroundColor Red
  git checkout HEAD -- src/admin/
  exit 1
}
Write-Host "OK: src/admin/ not modified" -ForegroundColor Green

Write-Host ""
Write-Host "=== Done. Rollback: git checkout $TAG -- . ===" -ForegroundColor Yellow

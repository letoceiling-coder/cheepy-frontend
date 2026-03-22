#!/usr/bin/env php
<?php
/**
 * Patch CatalogCategoryService to add products_count.
 * Run on server: php scripts/patch-catalog-products-count.php
 * Or: php /var/www/siteaacess.store/scripts/patch-catalog-products-count.php
 *
 * Target: BACKEND_PATH/app/Services/Catalog/CatalogCategoryService.php
 */
$base = getenv('BACKEND_PATH') ?: null;
$backendPaths = array_values(array_filter([
    $base ? rtrim($base, '/') . '/app/Services/Catalog/CatalogCategoryService.php' : null,
    __DIR__ . '/../../online-parser.siteaacess.store/app/Services/Catalog/CatalogCategoryService.php',
    '/var/www/online-parser.siteaacess.store/app/Services/Catalog/CatalogCategoryService.php',
]));
$path = null;
foreach ($backendPaths as $p) {
    if (file_exists($p)) {
        $path = $p;
        break;
    }
}
if (!$path) {
    fwrite(STDERR, "CatalogCategoryService.php not found. Set BACKEND_PATH or run from server.\n");
    exit(1);
}

$content = file_get_contents($path);
if (strpos($content, 'products_count') !== false) {
    echo "Already patched (products_count present).\n";
    exit(0);
}

$old = <<<'PHP'
<?php

namespace App\Services\Catalog;

use App\Models\CatalogCategory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CatalogCategoryService
{

    public function getTree(): Collection
PHP;
$new = <<<'PHP'
<?php

namespace App\Services\Catalog;

use App\Models\CatalogCategory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CatalogCategoryService
{

    public function getTree(): Collection
PHP;

if (strpos($content, $old) === false) {
    fwrite(STDERR, "Could not find expected block. File may have changed.\n");
    exit(1);
}
$content = str_replace($old, $new, $content);

$old2 = <<<'PHP'
    public function listPaginated(int $perPage = 50): LengthAwarePaginator
    {
        return CatalogCategory::with('parent')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage);
    }
PHP;
$new2 = <<<'PHP'
    public function listPaginated(int $perPage = 50): LengthAwarePaginator
    {
        $productsCountSub = DB::table('system_products')
            ->selectRaw('count(*)')
            ->whereColumn('system_products.category_id', 'catalog_categories.id');

        return CatalogCategory::with('parent')
            ->selectRaw('catalog_categories.*')
            ->selectSub($productsCountSub, 'products_count')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage);
    }
PHP;

if (strpos($content, $old2) === false) {
    fwrite(STDERR, "Could not find listPaginated block. File may have changed.\n");
    exit(1);
}
$content = str_replace($old2, $new2, $content);

file_put_contents($path, $content);
echo "Patched: $path\n";

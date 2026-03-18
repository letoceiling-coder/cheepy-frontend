<?php
/**
 * Add admin sellers routes to routes/api.php
 * Include in Route::prefix('v1')->middleware(['auth:sanctum'])->group() or similar
 *
 * GET  /admin/sellers           - list (search, pavilion, page, per_page)
 * GET  /admin/sellers/{id}      - detail + products_count + products_preview
 * GET  /admin/sellers/{id}/products - products (category_id, status, price_from, price_to, sort_by, sort_dir, page, per_page)
 */
$code = <<<'PHP'

// Admin Sellers
Route::prefix('admin')->group(function () {
    Route::get('sellers', [\App\Http\Controllers\Api\AdminSellerController::class, 'index']);
    Route::get('sellers/{id}', [\App\Http\Controllers\Api\AdminSellerController::class, 'show']);
    Route::get('sellers/{id}/products', [\App\Http\Controllers\Api\AdminSellerController::class, 'products']);
});

PHP;
echo $code;

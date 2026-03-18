<?php

use App\Http\Controllers\Api\Admin\AdminCatalogCategoryController;
use App\Http\Controllers\Api\Admin\AdminCategoryMappingController;
use App\Http\Controllers\Api\Admin\AdminDonorCategoryController;
use Illuminate\Support\Facades\Route;

/*
| Catalog Phase 1 — Admin API (CATALOG_ARCHITECTURE_V2).
| Mount under your API prefix, e.g. Route::prefix('api')->group(base_path('routes/admin_catalog.php'));
| Or in api.php: require base_path('routes/admin_catalog.php'); (if prefix already applied)
|
| Expected full paths:
|   GET    /api/admin/catalog/categories
|   POST   /api/admin/catalog/categories
|   PATCH  /api/admin/catalog/categories/reorder   (must be BEFORE categories/{id} or use whereNumber on id)
|   PATCH  /api/admin/catalog/categories/{id}
|   DELETE /api/admin/catalog/categories/{id}
|   GET    /api/admin/catalog/donor-categories
|   GET    /api/admin/catalog/category-mapping
|   POST   /api/admin/catalog/category-mapping
|   DELETE /api/admin/catalog/category-mapping/{id}
*/

Route::prefix('admin/catalog')->group(function () {
    Route::get('categories', [AdminCatalogCategoryController::class, 'index']);
    Route::patch('categories/reorder', [AdminCatalogCategoryController::class, 'reorder']);
    Route::post('categories', [AdminCatalogCategoryController::class, 'store']);
    Route::patch('categories/{id}', [AdminCatalogCategoryController::class, 'update'])->whereNumber('id');
    Route::delete('categories/{id}', [AdminCatalogCategoryController::class, 'destroy'])->whereNumber('id');

    Route::get('donor-categories', [AdminDonorCategoryController::class, 'index']);

    Route::get('category-mapping', [AdminCategoryMappingController::class, 'index']);
    Route::post('category-mapping', [AdminCategoryMappingController::class, 'store']);
    Route::delete('category-mapping/{id}', [AdminCategoryMappingController::class, 'destroy']);
});

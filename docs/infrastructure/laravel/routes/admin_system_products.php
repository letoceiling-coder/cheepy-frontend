<?php

use App\Http\Controllers\Api\Admin\AdminSystemProductController;
use Illuminate\Support\Facades\Route;

/*
| Admin System Products — CRM products (system_products)
| Mount under /api prefix (e.g. Route::prefix('api')->middleware(['auth:sanctum'])->group(...))
|
| Full paths:
|   GET    /api/admin/system-products
|   GET    /api/admin/system-products?status=pending
|   PATCH  /api/admin/system-products/{id}
*/

Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {
    Route::get('system-products', [AdminSystemProductController::class, 'index']);
    Route::get('system-products/{id}', [AdminSystemProductController::class, 'show'])->whereNumber('id');
    Route::patch('system-products/{id}', [AdminSystemProductController::class, 'update'])->whereNumber('id');
});

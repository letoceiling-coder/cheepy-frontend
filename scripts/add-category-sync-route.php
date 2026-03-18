<?php
/**
 * Add category sync route to routes/api.php
 * Add before or inside parser group:
 *
 * Route::post('parser/categories/sync', [\App\Http\Controllers\Api\CategorySyncController::class, '__invoke'])
 *     ->middleware('auth:sanctum');
 */

$snippet = <<<'PHP'

// Category sync from donor
Route::post('parser/categories/sync', \App\Http\Controllers\Api\CategorySyncController::class)
    ->middleware('auth:sanctum');

PHP;
echo $snippet;

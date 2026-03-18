# Catalog Phase 1 — Dual Category System

Implements **CATALOG_ARCHITECTURE_V2.md**: donor_categories, catalog_categories, category_mapping. No products or parser integration.

## Copy into Laravel project

Target: `C:\OSPanel\domains\sadavod-laravel` (local) or `/var/www/online-parser.siteaacess.store` (server).

| Source (this folder) | Target (Laravel project) |
|----------------------|---------------------------|
| database/migrations/2026_03_16_100000_create_catalog_categories_table.php | database/migrations/ |
| database/migrations/2026_03_16_100001_create_donor_categories_table.php | database/migrations/ |
| database/migrations/2026_03_16_100002_create_category_mapping_table.php | database/migrations/ |
| app/Models/CatalogCategory.php | app/Models/ |
| app/Models/DonorCategory.php | app/Models/ |
| app/Models/CategoryMapping.php | app/Models/ |
| app/Services/Catalog/CatalogCategoryService.php | app/Services/Catalog/ |
| app/Services/Catalog/DonorCategoryService.php | app/Services/Catalog/ |
| app/Services/Catalog/CategoryMappingService.php | app/Services/Catalog/ |
| app/Events/CatalogCategoryCreated.php | app/Events/ |
| app/Events/CatalogCategoryUpdated.php | app/Events/ |
| app/Events/CatalogCategoryDeleted.php | app/Events/ |
| app/Events/CatalogMappingCreated.php | app/Events/ |
| app/Listeners/LogCatalogCategoryCreated.php | app/Listeners/ |
| app/Listeners/LogCatalogCategoryUpdated.php | app/Listeners/ |
| app/Listeners/LogCatalogCategoryDeleted.php | app/Listeners/ |
| app/Listeners/LogCatalogMappingCreated.php | app/Listeners/ |
| app/Http/Controllers/Api/Admin/AdminCatalogCategoryController.php | app/Http/Controllers/Api/Admin/ |
| app/Http/Controllers/Api/Admin/AdminDonorCategoryController.php | app/Http/Controllers/Api/Admin/ |
| app/Http/Controllers/Api/Admin/AdminCategoryMappingController.php | app/Http/Controllers/Api/Admin/ |
| routes/admin_catalog.php | routes/ |
| tests/Feature/CatalogCategoryTest.php | tests/Feature/ |

## EventServiceProvider

In `app/Providers/EventServiceProvider.php`, add to `$listen`:

```php
use App\Events\CatalogCategoryCreated;
use App\Events\CatalogCategoryUpdated;
use App\Events\CatalogCategoryDeleted;
use App\Events\CatalogMappingCreated;
use App\Listeners\LogCatalogCategoryCreated;
use App\Listeners\LogCatalogCategoryUpdated;
use App\Listeners\LogCatalogCategoryDeleted;
use App\Listeners\LogCatalogMappingCreated;

protected $listen = [
    // ... existing
    CatalogCategoryCreated::class => [LogCatalogCategoryCreated::class],
    CatalogCategoryUpdated::class => [LogCatalogCategoryUpdated::class],
    CatalogCategoryDeleted::class => [LogCatalogCategoryDeleted::class],
    CatalogMappingCreated::class => [LogCatalogMappingCreated::class],
];
```

## Routes registration

In `routes/api.php` (or your API route file), add:

```php
Route::prefix('api')->middleware(['auth:api'])->group(function () {
    require base_path('routes/admin_catalog.php');
});
```

Adjust prefix to match your API (e.g. `api/v1`) and use your admin/JWT middleware.

## Migrations

```bash
php artisan migrate
```

## Tests

```bash
php artisan test --filter=CatalogCategoryTest
```

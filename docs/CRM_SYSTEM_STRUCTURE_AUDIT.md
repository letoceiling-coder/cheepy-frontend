# CRM System Structure Audit

**Source:** Code + migrations. No assumptions.

---

## 1. DATABASE STRUCTURE

### Table List (from migrations)

| Table | Purpose |
|-------|---------|
| **products** | Donor products (parser output, sadovodbaza.ru) |
| **product_photos** | Downloaded photos for products |
| **product_attributes** | Normalized attributes (attr_name, attr_value) |
| **categories** | Parser categories (parent/child tree, parser config) |
| **catalog_categories** | CRM catalog tree (separate from parser) |
| **donor_categories** | Donor category structure (from parser) |
| **category_mapping** | donor_category_id → catalog_category_id (1:1) |
| **system_products** | Marketplace products (admin-editable layer) |
| **product_sources** | Links system_products ↔ products (donor) |
| **system_product_attributes** | Attributes for system_products |
| **system_product_photos** | Photos for system_products |
| **sellers** | Donor sellers |
| **brands** | Brands |
| **filters_config** | Category filter config |
| **excluded_rules** | Parser exclusion rules |
| **parser_jobs** | Parser job tracking |
| **parser_logs** | Parser logs |
| **parser_progress** | Progress tracking |
| **parser_settings** | Parser settings |
| **parser_state** | Parser state |
| **admin_users** | Admin auth |
| **settings** | App settings |
| **auto_mapping_logs** | Category mapping suggestions |
| **payments** | Payment records |
| **payment_webhook_logs** | Webhook events |
| **payment_providers** | Tinkoff/Sber/ATOL config |
| **saas_api_keys** | API keys + balance |
| **api_usage_logs** | Usage tracking |

### products
| Column | Type |
|--------|------|
| id | bigint PK |
| external_id | string unique |
| source_url | string nullable |
| title | string |
| price | string nullable |
| price_raw | int nullable |
| description | text nullable |
| category_id | FK → categories |
| seller_id | FK → sellers |
| brand_id | FK → brands |
| category_slugs | json nullable |
| color, size_range | string nullable |
| characteristics | json nullable |
| status | string default 'active' |
| is_relevant | bool |
| photos | json |
| photos_count | int |
| parsed_at | timestamp |
| ... | |

**Status:** active, hidden, excluded, error, pending

### categories (parser)
| Column | Type |
|--------|------|
| id | bigint PK |
| external_slug | string unique |
| name | string |
| slug | string unique |
| parent_id | FK → categories |
| sort_order | int |
| enabled | bool |
| linked_to_parser | bool |
| parser_products_limit | int |
| parser_max_pages | int |
| ... | |

### category_mapping
| Column | Type |
|--------|------|
| id | bigint PK |
| donor_category_id | FK → donor_categories |
| catalog_category_id | FK → catalog_categories |
| confidence | tinyint |
| is_manual | bool |
| unique(donor_category_id) | |

### catalog_categories
| Column | Type |
|--------|------|
| id | bigint PK |
| name | string |
| slug | string unique |
| parent_id | FK → catalog_categories |
| sort_order | int |
| is_active | bool |
| embedding | json nullable |
| ... | |

### system_products
| Column | Type |
|--------|------|
| id | bigint PK |
| name | string |
| description | text |
| price | string |
| price_raw | int |
| status | string default 'draft' |
| seller_id | FK → sellers |
| category_id | FK → catalog_categories |
| brand_id | FK → brands |
| ... | |

**Status:** draft, pending, approved, published, needs_review

---

## 2. MODELS

### Product
- **Table:** products
- **Fillable:** external_id, source_url, title, price, price_raw, description, category_id, seller_id, brand_id, category_slugs, color, size_range, characteristics, status, is_relevant, photos, photos_count, parsed_at, ...
- **Casts:** category_slugs/characteristics/photos → array, photos_downloaded/is_relevant → bool
- **Relations:**
  - category() → belongsTo(Category)
  - seller() → belongsTo(Seller)
  - brand() → belongsTo(Brand)
  - photoRecords() → hasMany(ProductPhoto)
  - attributes() → hasMany(ProductAttribute)

### Category
- **Table:** categories
- **Relations:**
  - parent() → belongsTo(Category)
  - children() → hasMany(Category)
  - products() → hasMany(Product)
  - filtersConfig() → hasMany(FilterConfig)
  - excludedRules() → hasMany(ExcludedRule)

### CategoryMapping
- **Table:** category_mapping
- **Relations:**
  - donorCategory() → belongsTo(DonorCategory)
  - catalogCategory() → belongsTo(CatalogCategory)

### CatalogCategory
- **Table:** catalog_categories
- **Relations:**
  - parent() → belongsTo(CatalogCategory)
  - children() → hasMany(CatalogCategory)
  - mappings() → hasMany(CategoryMapping)
  - donorCategories() → belongsToMany(DonorCategory via category_mapping)

### DonorCategory
- **Table:** donor_categories
- **Relations:**
  - parent() → belongsTo(DonorCategory)
  - children() → hasMany(DonorCategory)
  - mapping() → hasOne(CategoryMapping)
  - catalogCategories() → belongsToMany(CatalogCategory via category_mapping)

### SystemProduct
- **Table:** system_products
- **Status constants:** draft, pending, approved, published, needs_review
- **Relations:**
  - seller() → belongsTo(Seller)
  - category() → belongsTo(CatalogCategory)
  - brand() → belongsTo(Brand)
  - attributes() → hasMany(SystemProductAttribute)
  - photos() → hasMany(SystemProductPhoto)
  - productSources() → hasMany(ProductSource)
  - donorProducts() → belongsToMany(Product via product_sources)

---

## 3. RELATIONS MAP

```
categories (parser)          catalog_categories (CRM)
    │                                │
    ├── parent/children              ├── parent/children
    └── products                     └── category_mapping
                                          │
donor_categories  ◄──category_mapping──►  catalog_category_id
    │
    └── (from parser, external_id)

products (donor)  ◄──product_sources──►  system_products
    │                                        │
    ├── category → categories                ├── category → catalog_categories
    ├── seller → sellers                    ├── attributes
    ├── brand → brands                      └── photos
    ├── photoRecords → product_photos
    └── attributes → product_attributes
```

**Dual category system:**
- **categories** = parser/donor categories (sadovodbaza structure)
- **catalog_categories** = CRM catalog (admin-managed)
- **category_mapping** = donor_category ↔ catalog_category (1:1)
- **donor_categories** = parsed donor category tree

---

## 4. STATUS SYSTEM

### products.status
- **Values:** active, hidden, excluded, error, pending
- **Used in:** ProductController filters, bulk actions

### system_products.status
- **Constants:** draft, pending, approved, published, needs_review
- **Used in:** Moderation flow (SystemProductController, not deployed)

### moderation (mock)
- **Values:** pending, approved, rejected
- **Source:** moderationItems mock data

---

## 5. API ENDPOINTS

### Products (Parser/Admin)
| Method | Path | Controller |
|--------|------|------------|
| GET | /api/v1/admin/parser/products | ProductController::index |
| GET | /api/v1/admin/parser/products/{id} | ProductController::show |
| PATCH | /api/v1/admin/parser/products/{id} | ProductController::update |
| DELETE | /api/v1/admin/parser/products/{id} | ProductController::destroy |
| POST | /api/v1/admin/parser/products/bulk | ProductController::bulk |

**Filters:** search, status, category_id, seller_id, photos_only, no_photos, price_from, price_to, is_relevant

### Categories (Parser)
| Method | Path | Controller |
|--------|------|------------|
| GET | /api/v1/categories | CategoryController::index |
| GET | /api/v1/categories/{id} | CategoryController::show |
| PATCH | /api/v1/categories/{id} | CategoryController::update |
| POST | /api/v1/categories/reorder | CategoryController::reorder |
| GET | /api/v1/categories/{id}/filters | CategoryController::availableFilters |

### Catalog (Admin)
| Method | Path | Controller |
|--------|------|------------|
| GET | /api/v1/admin/catalog/categories | CatalogCategoryController::index |
| POST | /api/v1/admin/catalog/categories | CatalogCategoryController::store |
| PATCH | /api/v1/admin/catalog/categories/reorder | CatalogCategoryController::reorder |
| PATCH | /api/v1/admin/catalog/categories/{id} | CatalogCategoryController::update |
| DELETE | /api/v1/admin/catalog/categories/{id} | CatalogCategoryController::destroy |
| GET | /api/v1/admin/catalog/donor-categories | DonorCategoryController::index |
| GET | /api/v1/admin/catalog/category-mapping | CategoryMappingController::index |
| POST | /api/v1/admin/catalog/category-mapping | CategoryMappingController::store |
| DELETE | /api/v1/admin/catalog/category-mapping/{id} | CategoryMappingController::destroy |
| GET | /api/v1/admin/catalog/mapping/suggestions | MappingSuggestionController::index |

### Moderation
- **No dedicated controller.** Moderation = SystemProduct status flow.
- SystemProductController (system-products) — **commented out, not deployed**.

### Public
| Method | Path |
|--------|------|
| GET | /api/v1/public/categories/{slug}/products |
| GET | /api/v1/public/products/{externalId} |

---

## 6. FRONTEND STATE (REAL vs MOCK)

| Page | Data Source | REAL/MOCK |
|------|-------------|-----------|
| **CrmProductsPage** | crmProducts from mock-data | **MOCK** |
| **CrmProductDetailPage** | (navigate to /crm/products/{id}) | MOCK (no API) |
| **CrmModerationPage** | moderationItems from mock/moderation | **MOCK** |
| **CrmModerationDetailPage** | mock | **MOCK** |
| **CrmCategoriesPage** | adminCatalogApi.catalogCategoriesList | **REAL** |
| **MappingPage** (catalog/mapping) | adminCatalogApi.categoryMappingList, donorCategories, suggestions | **REAL** |
| **CrmIntegrationsPage** | crmPaymentProvidersApi.list | **REAL** |
| **CrmProviderDetailPage** | crmPaymentProvidersApi | **REAL** |
| **CrmApiKeysPage** | crmApi.apiKeys | **REAL** |
| **ProductsPage** (Admin/Parser) | productsApi | **REAL** (admin/parser/products) |
| **ProductDetailPage** (Admin) | productsApi | **REAL** |

---

## 7. SUMMARY

- **products** = donor/parser products (sadovodbaza)
- **system_products** = CRM marketplace products (NOT deployed in API)
- **categories** = parser categories
- **catalog_categories** = CRM catalog
- **category_mapping** = donor ↔ catalog
- **CrmProductsPage** = MOCK (no API connection)
- **CrmModerationPage** = MOCK (SystemProduct API not deployed)
- **CrmCategoriesPage** = REAL (admin/catalog/categories)
- **MappingPage** = REAL (admin/catalog)
- **Admin ProductsPage** = REAL (admin/parser/products)

# API DOCUMENTATION

**Base URL:** `https://online-parser.siteaacess.store/api/v1` (or VITE_API_URL)  
**Prefix:** All routes under `api` (Laravel) and `v1` (route group).  
**Auth:** JWT in `Authorization: Bearer <token>` or query `token`. Public and health routes do not require auth.

---

## 1. Health & System Status (No Auth)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/up | Closure | DB + Redis check; 200 { status: ok } or 503 |
| GET | /api/v1/ws-status | Closure | Redis, Reverb, queue workers count |
| GET | /api/v1/system/status | Closure | parser_running, queue_workers, queue_size, products_total, products_today, errors_today, last_parser_run, redis_status, websocket, cpu_load, memory_usage, disk, timestamp, + ParserMetricsService |
| GET | /api/v1/health | Closure | status, database, redis, parser_last_run, timestamp |

---

## 2. Public API (No Auth)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/public/menu | PublicController@menu | Menu/categories for storefront |
| GET | /api/v1/public/categories/{slug}/products | PublicController@categoryProducts | Products + filters for category; query: page, per_page, sort_by, search, price_from, price_to, etc. |
| GET | /api/v1/public/products/{externalId} | PublicController@product | Single product by external_id |
| GET | /api/v1/public/sellers/{slug} | PublicController@seller | Seller by slug + products (paginated) |
| GET | /api/v1/public/search | PublicController@search | Search products; query: q, page, per_page |
| GET | /api/v1/public/featured | PublicController@featured | Featured products; query: limit |

---

## 3. Auth (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| POST | /api/v1/auth/login | AuthController@login | Body: email, password. Returns token + user. 401 if invalid. |
| GET | /api/v1/auth/me | AuthController@me | Requires JWT. Returns current user from token. |
| POST | /api/v1/auth/refresh | AuthController@refresh | Requires JWT. Returns new token. |

---

## 4. Dashboard (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/dashboard | DashboardController@index | Dashboard stats for admin |

---

## 5. Parser (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/parser/status | ParserController@status | is_running, current_job, last_completed |
| GET | /api/v1/parser/stats | ParserController@stats | products_total, products_today, parser_running, queue_size, last_job, etc. |
| GET | /api/v1/parser/progress | ParserController@progress | Current job progress (saved_products, errors_count, current_action, etc.) |
| GET | /api/v1/parser/jobs | ParserController@jobs | List parser jobs (paginated) |
| GET | /api/v1/parser/jobs/{id} | ParserController@jobDetail | Single job detail |
| POST | /api/v1/parser/start | ParserController@start | Create ParserJob, dispatch RunParserJob. Body: type (full|menu_only|category|seller), categories, linked_only, products_per_category, max_pages, no_details, save_photos, category_slug, seller_slug. 409 if already running. |
| POST | /api/v1/parser/stop | ParserController@stop | Set all running/pending jobs to stopped; clear parser_running in Redis. Returns jobs_stopped. |
| POST | /api/v1/parser/photos/download | ParserController@downloadPhotos | Trigger photo download (implementation-specific) |
| POST | /api/v1/parser/categories/sync | CategorySyncController | Invokable. Run MenuParser, sync categories to DB. Returns created, updated, last_synced_at. |

---

## 6. Attribute Rules (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/attribute-rules | AttributeRuleController@index | List rules; query: attribute_key, enabled |
| POST | /api/v1/attribute-rules | AttributeRuleController@store | Create rule; body: attribute_key, display_name, rule_type, pattern, attr_type, priority, apply_synonyms, enabled |
| PATCH | /api/v1/attribute-rules/{id} | AttributeRuleController@update | Update rule |
| DELETE | /api/v1/attribute-rules/{id} | AttributeRuleController@destroy | Delete rule |
| GET | /api/v1/attribute-rules/audit | AttributeRuleController@audit | Audit: total_products, products_with_attributes, total_attribute_rows, attributes (per attr_name: count, unique_values, avg_confidence, top_values) |
| GET | /api/v1/attribute-rules/synonyms | AttributeRuleController@synonymsIndex | List synonyms; query: attribute_key |
| POST | /api/v1/attribute-rules/synonyms | AttributeRuleController@synonymsStore | Create synonym |
| DELETE | /api/v1/attribute-rules/synonyms/{id} | AttributeRuleController@synonymsDestroy | Delete synonym |
| POST | /api/v1/attribute-rules/test | AttributeRuleController@test | Body: text. Returns extracted attributes from AttributeExtractionService. |
| POST | /api/v1/attribute-rules/rebuild | AttributeRuleController@rebuild | Run AttributeExtractionService::rebuildAll() (sync). Returns processed, saved. |

---

## 7. Attribute Dictionary (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/attribute-dictionary | AttributeRuleController@dictionaryIndex | List dictionary entries; query: attribute_key |
| POST | /api/v1/attribute-dictionary | AttributeRuleController@dictionaryStore | Create entry; body: attribute_key, value, sort_order |
| PATCH | /api/v1/attribute-dictionary/{id} | AttributeRuleController@dictionaryUpdate | Update entry |
| DELETE | /api/v1/attribute-dictionary/{id} | AttributeRuleController@dictionaryDestroy | Delete entry |

---

## 8. Attribute Canonical (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/attribute-canonical | AttributeRuleController@canonicalIndex | List normalizations; query: attribute_key, search; paginated |
| POST | /api/v1/attribute-canonical | AttributeRuleController@canonicalStore | Create; body: attribute_key, raw_value, normalized_value |
| PATCH | /api/v1/attribute-canonical/{id} | AttributeRuleController@canonicalUpdate | Update normalized_value |
| DELETE | /api/v1/attribute-canonical/{id} | AttributeRuleController@canonicalDestroy | Delete |

---

## 9. Attribute Facets (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/attribute-facets | AttributeRuleController@facets | Query: category_id, min_confidence. Returns facet counts per attribute (size, color, material, etc.) from AttributeFacetService (cached). |
| POST | /api/v1/attribute-facets/rebuild | AttributeRuleController@facetsRebuild | Rebuild facet cache for category_id. |

---

## 10. Products (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/products | ProductController@index | List products; pagination and filters |
| GET | /api/v1/products/{id} | ProductController@show | Single product |
| PATCH | /api/v1/products/{id} | ProductController@update | Update product |
| DELETE | /api/v1/products/{id} | ProductController@destroy | Delete product |
| POST | /api/v1/products/bulk | ProductController@bulk | Bulk action |

---

## 11. Categories (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/categories | CategoryController@index | List categories |
| GET | /api/v1/categories/{id} | CategoryController@show | Single category |
| PATCH | /api/v1/categories/{id} | CategoryController@update | Update category |
| POST | /api/v1/categories/reorder | CategoryController@reorder | Reorder categories |
| GET | /api/v1/categories/{id}/filters | CategoryController@availableFilters | Available filters for category |

---

## 12. Sellers (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/sellers | SellerController@index | List sellers |
| GET | /api/v1/sellers/{slug} | SellerController@show | Seller by slug or id |
| GET | /api/v1/sellers/{slug}/products | SellerController@products | Products of seller; query: page, per_page, status, category_id, search |
| PATCH | /api/v1/sellers/{id} | SellerController@update | Update seller |

---

## 13. Brands (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/brands | BrandController@index | List brands |
| GET | /api/v1/brands/{id} | BrandController@show | Single brand |
| POST | /api/v1/brands | BrandController@store | Create brand |
| PUT | /api/v1/brands/{id} | BrandController@update | Update brand |
| DELETE | /api/v1/brands/{id} | BrandController@destroy | Delete brand |

---

## 14. Excluded Rules (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/excluded | ExcludedController@index | List excluded rules |
| POST | /api/v1/excluded | ExcludedController@store | Create |
| PUT | /api/v1/excluded/{id} | ExcludedController@update | Update |
| DELETE | /api/v1/excluded/{id} | ExcludedController@destroy | Delete |
| POST | /api/v1/excluded/test | ExcludedController@test | Test rule |

---

## 15. Filters Config (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/filters | FilterController@index | List filter configs |
| POST | /api/v1/filters | FilterController@store | Create |
| PUT | /api/v1/filters/{id} | FilterController@update | Update |
| DELETE | /api/v1/filters/{id} | FilterController@destroy | Delete |
| GET | /api/v1/filters/{categoryId}/values | FilterController@values | Filter values for category |

---

## 16. Logs (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/logs | LogController@index | List parser logs |
| DELETE | /api/v1/logs/clear | LogController@clear | Clear logs |

---

## 17. Settings (JWT)

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| GET | /api/v1/settings | SettingController@index | List settings |
| PUT | /api/v1/settings | SettingController@update | Update multiple |
| PUT | /api/v1/settings/{key} | SettingController@updateOne | Update one |

---

## 18. Admin Users & Roles (JWT)

(If routes exist in api.php or other files:)

- AdminUserController: CRUD admin users.
- AdminRoleController: CRUD roles.

Exact paths should be verified in routes/api.php (they may be under a prefix). From the audit, admin users and roles are used; frontend has UsersPage and RolesPage calling an API—check api.ts for exact paths (e.g. adminUsers, adminRoles).

---

## Summary by Module

- **Health:** /up, /ws-status, /system/status, /health  
- **Public:** /public/menu, /public/categories/{slug}/products, /public/products/{id}, /public/sellers/{slug}, /public/search, /public/featured  
- **Auth:** /auth/login, /auth/me, /auth/refresh  
- **Parser:** /parser/status, /parser/stats, /parser/progress, /parser/jobs, /parser/jobs/{id}, /parser/start, /parser/stop, /parser/photos/download, /parser/categories/sync  
- **Attributes:** attribute-rules (CRUD, audit, synonyms, test, rebuild), attribute-dictionary (CRUD), attribute-canonical (CRUD), attribute-facets (GET, rebuild)  
- **Data:** products, categories, sellers, brands, excluded, filters, logs, settings  

All routes above under `/api/v1` except Laravel health at `/up` (may be at root or under api depending on bootstrap).

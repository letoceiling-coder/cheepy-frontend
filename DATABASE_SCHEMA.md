# DATABASE SCHEMA

**Backend:** Laravel + MySQL  
**Migrations path:** database/migrations/

This document lists all tables, columns, types, indexes, and foreign keys. ER description at the end.

---

## 1. Core Business Tables

### categories

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK, auto_increment |
| external_slug | varchar(200) | YES | - | UNIQUE |
| name | varchar(500) | NO | - | - |
| slug | varchar(200) | NO | - | UNIQUE |
| url | varchar(500) | YES | - | - |
| parent_id | bigint unsigned | YES | - | FK → categories.id, nullOnDelete |
| sort_order | int | NO | 0 | - |
| icon | varchar(50) | YES | - | - |
| enabled | boolean | NO | true | - |
| linked_to_parser | boolean | NO | false | - |
| parser_products_limit | int | NO | 0 | - |
| parser_max_pages | int | NO | 0 | - |
| parser_depth_limit | int | NO | 0 | - |
| products_count | int | NO | 0 | - |
| subcategory_options_count | bigint unsigned | NO | 0 | - |
| last_parsed_at | timestamp | YES | - | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Purpose:** Category tree from donor menu. parent_id self-reference. external_slug from donor; slug for URLs.

---

### sellers

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| slug | varchar(300) | NO | - | UNIQUE |
| name | varchar(500) | NO | - | - |
| source_url | varchar(500) | YES | - | - |
| pavilion | varchar(300) | YES | - | - |
| pavilion_line | varchar(50) | YES | - | - |
| pavilion_number | varchar(50) | YES | - | - |
| description | text | YES | - | - |
| phone | varchar(50) | YES | - | - |
| whatsapp_url | varchar(500) | YES | - | - |
| whatsapp_number | varchar(50) | YES | - | - |
| telegram_url | varchar(500) | YES | - | - |
| vk_url | varchar(500) | YES | - | - |
| external_shop_id | varchar(50) | YES | - | - |
| status | varchar(20) | NO | active | - |
| is_verified | boolean | NO | false | - |
| rating | decimal(3,2) | NO | 0 | - |
| products_count | int | NO | 0 | - |
| seller_categories | json | YES | - | - |
| last_parsed_at | timestamp | YES | - | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Migration add-on:** avatar_url (varchar 500) added in 2026_03_05_120000.

**Purpose:** Sellers from donor /s/{slug}. Products reference seller_id.

---

### brands

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| name | varchar(500) | NO | - | UNIQUE |
| slug | varchar(200) | NO | - | UNIQUE |
| logo_url | varchar(500) | YES | - | - |
| logo_local_path | varchar(500) | YES | - | - |
| status | varchar(20) | NO | active | - |
| seo_title | varchar(500) | YES | - | - |
| seo_description | text | YES | - | - |
| category_ids | json | YES | - | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Purpose:** Brands; products may have brand_id.

---

### products

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| external_id | varchar(50) | NO | - | UNIQUE |
| source_url | varchar(500) | YES | - | - |
| title | varchar(500) | NO | '' | - |
| price | varchar(100) | YES | - | - |
| price_raw | int unsigned | YES | - | INDEX |
| description | text | YES | - | - |
| category_id | bigint unsigned | YES | - | FK → categories.id, nullOnDelete, INDEX |
| seller_id | bigint unsigned | YES | - | FK → sellers.id, nullOnDelete, INDEX |
| brand_id | bigint unsigned | YES | - | FK → brands.id, nullOnDelete, INDEX |
| category_slugs | json | YES | - | - |
| color | varchar(200) | YES | - | INDEX |
| size_range | varchar(200) | YES | - | - |
| characteristics | json | YES | - | - |
| source_link | varchar(500) | YES | - | - |
| source_published_at | timestamp | YES | - | - |
| color_external_id | varchar(50) | YES | - | - |
| status | varchar(20) | NO | active | INDEX |
| is_relevant | boolean | NO | true | INDEX |
| relevance_checked_at | timestamp | YES | - | - |
| parse_error | text | YES | - | - |
| photos | json | YES | - | - |
| photos_downloaded | boolean | NO | false | - |
| photos_count | int | NO | 0 | - |
| parsed_at | timestamp | YES | - | INDEX |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Purpose:** Products from donor; external_id from donor URL.

---

### product_photos

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| product_id | bigint unsigned | NO | - | FK → products.id, cascadeOnDelete |
| original_url | varchar(500) | NO | - | - |
| medium_url | varchar(500) | YES | - | - |
| local_path | varchar(500) | YES | - | - |
| local_medium_path | varchar(500) | YES | - | - |
| cdn_url | varchar(500) | YES | - | - |
| hash | varchar(64) | YES | - | - |
| mime_type | varchar(50) | YES | - | - |
| file_size | int unsigned | YES | - | - |
| width | smallint unsigned | YES | - | - |
| height | smallint unsigned | YES | - | - |
| is_primary | boolean | NO | false | - |
| sort_order | int | NO | 0 | - |
| download_status | varchar(20) | NO | pending | INDEX |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Index:** (product_id, sort_order), download_status.

---

### product_attributes

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| product_id | bigint unsigned | NO | - | FK → products.id, cascadeOnDelete |
| category_id | bigint unsigned | YES | - | FK → categories.id, nullOnDelete |
| attr_name | varchar(200) | NO | - | INDEX (idx_pa_attr_name), (attr_name, attr_value) |
| attr_value | varchar(500) | NO | - | INDEX (idx_pa_attr_value) |
| attr_type | varchar(20) | NO | text | - |
| confidence | float | NO | 1.0 | (added in upgrade_attribute_system) |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Indexes:** (category_id, attr_name), (product_id, attr_name), idx_pa_attr_name, idx_pa_attr_value, idx_pa_name_value.

**Purpose:** Normalized attributes per product (size, color, material, etc.); filled by AttributeExtractionService.

---

## 2. Parser Tables

### parser_jobs

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| type | varchar(50) | NO | full | - |
| options | json | YES | - | - |
| status | varchar(20) | NO | pending | INDEX |
| total_categories | int | NO | 0 | - |
| parsed_categories | int | NO | 0 | - |
| total_products | int | NO | 0 | - |
| parsed_products | int | NO | 0 | - |
| saved_products | int | NO | 0 | - |
| errors_count | int | NO | 0 | - |
| photos_downloaded | int | NO | 0 | - |
| photos_failed | int | NO | 0 | - |
| current_action | varchar(500) | YES | - | - |
| current_page | int | NO | 0 | - |
| total_pages | int | NO | 0 | - |
| current_category_slug | varchar(200) | YES | - | - |
| pid | bigint unsigned | YES | - | - |
| log_file | varchar(500) | YES | - | - |
| started_at | timestamp | YES | - | - |
| finished_at | timestamp | YES | - | - |
| error_message | text | YES | - | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Index:** status, created_at. **Purpose:** One row per parser run; progress and result.

---

### parser_logs

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| job_id | bigint unsigned | YES | - | FK → parser_jobs.id, nullOnDelete, INDEX |
| level | varchar(20) | NO | info | INDEX (level, logged_at) |
| module | varchar(50) | NO | Parser | INDEX (module, logged_at) |
| message | varchar(1000) | NO | - | - |
| context | json | YES | - | - |
| entity_type | varchar(50) | YES | - | - |
| entity_id | varchar(100) | YES | - | - |
| logged_at | timestamp | NO | CURRENT | - |

---

## 3. Admin & RBAC

### admin_users

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| name | varchar(200) | NO | - | - |
| email | varchar(200) | NO | - | UNIQUE |
| password | varchar(255) | NO | - | - |
| role | varchar(50) | NO | editor | - |
| permissions | json | YES | - | - |
| last_login_at | timestamp | YES | - | - |
| last_login_ip | varchar(45) | YES | - | - |
| is_active | boolean | NO | true | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Purpose:** Admin panel users; JWT sub = id.

---

### roles

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| name | varchar(100) | NO | - | - |
| slug | varchar(100) | NO | - | UNIQUE |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Purpose:** Roles (admin, editor, viewer). Seeded in 2026_03_05_200002.

---

### role_user

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| user_id | bigint unsigned | NO | - | PK, FK → admin_users.id, cascade |
| role_id | bigint unsigned | NO | - | PK, FK → roles.id, cascade |

**Purpose:** Pivot admin_users ↔ roles.

---

## 4. Attribute System (Rules & Normalization)

### attribute_rules

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| attribute_key | varchar(60) | NO | - | INDEX (attribute_key, enabled, priority) |
| display_name | varchar(120) | NO | - | - |
| rule_type | varchar(20) | NO | regex | - |
| pattern | varchar(500) | NO | - | - |
| apply_synonyms | boolean | NO | true | - |
| attr_type | varchar(20) | NO | text | - |
| priority | smallint unsigned | NO | 100 | - |
| enabled | boolean | NO | true | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Purpose:** Rules for AttributeExtractionService (regex/keyword per attribute_key).

---

### attribute_synonyms

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| attribute_key | varchar(60) | YES | - | UNIQUE (attribute_key, word) |
| word | varchar(200) | NO | - | INDEX |
| normalized_value | varchar(200) | NO | - | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

---

### attribute_value_normalization

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| attribute_key | varchar(60) | NO | - | INDEX, UNIQUE (attribute_key, raw_value) |
| raw_value | varchar(300) | NO | - | - |
| normalized_value | varchar(300) | NO | - | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Purpose:** Map raw extracted value → canonical value (e.g. "turkey" → "Турция").

---

### attribute_dictionary

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| attribute_key | varchar(60) | NO | - | INDEX, UNIQUE (attribute_key, value) |
| value | varchar(300) | NO | - | - |
| sort_order | smallint unsigned | NO | 100 | INDEX (attribute_key, sort_order) |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

**Purpose:** Allowed values per attribute for filters and validation.

---

## 5. Config & Rules

### settings

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| group | varchar(100) | NO | general | INDEX |
| key | varchar(200) | NO | - | UNIQUE |
| value | text | YES | - | - |
| type | varchar(20) | NO | string | - |
| label | varchar(500) | YES | - | - |
| description | text | YES | - | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

---

### excluded_rules

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| pattern | varchar(500) | NO | - | - |
| type | varchar(20) | NO | word | - |
| action | varchar(20) | NO | hide | - |
| replacement | varchar(500) | YES | - | - |
| scope | varchar(20) | NO | global | INDEX |
| category_id | bigint unsigned | YES | - | FK → categories.id, nullOnDelete |
| product_type | varchar(200) | YES | - | - |
| apply_to_fields | json | YES | - | - |
| expires_at | timestamp | YES | - | - |
| is_active | boolean | NO | true | INDEX |
| priority | int | NO | 0 | - |
| comment | varchar(500) | YES | - | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

---

### filters_config

| Column | Type | Nullable | Default | Index/Key |
|--------|------|----------|---------|-----------|
| id | bigint unsigned | NO | - | PK |
| category_id | bigint unsigned | NO | - | FK → categories.id, cascadeOnDelete |
| attr_name | varchar(200) | NO | - | UNIQUE (category_id, attr_name) |
| display_name | varchar(500) | NO | - | - |
| display_type | varchar(20) | NO | checkbox | - |
| sort_order | int | NO | 0 | - |
| range_min | decimal(10,2) | YES | - | - |
| range_max | decimal(10,2) | YES | - | - |
| preset_values | json | YES | - | - |
| is_active | boolean | NO | true | INDEX (category_id, is_active) |
| is_filterable | boolean | NO | true | - |
| created_at | timestamp | YES | - | - |
| updated_at | timestamp | YES | - | - |

---

## 6. Laravel Default Tables

### users

| Column | Type | Purpose |
|--------|------|---------|
| id | bigint unsigned | PK |
| name | string | - |
| email | string | UNIQUE |
| email_verified_at | timestamp | - |
| password | string | - |
| remember_token | string | - |
| created_at, updated_at | timestamp | - |

**Note:** May be unused; admin uses admin_users.

### password_reset_tokens

email (PK), token, created_at.

### sessions

id (PK), user_id, ip_address, user_agent, payload, last_activity. For session driver database.

### cache

key (PK), value (mediumText), expiration. For cache driver database.

### cache_locks

key (PK), owner, expiration.

### jobs

id, queue (index), payload, attempts, reserved_at, available_at, created_at. Laravel queue table driver (project uses Redis queue).

### job_batches

id (PK), name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at.

### failed_jobs

id, uuid (UNIQUE), connection, queue, payload, exception, failed_at.

---

## 7. ER Diagram (Description)

- **categories:** self-reference parent_id. Referenced by products (category_id), filters_config (category_id), excluded_rules (category_id), product_attributes (category_id).
- **sellers:** referenced by products (seller_id).
- **brands:** referenced by products (brand_id).
- **products:** referenced by product_photos (product_id), product_attributes (product_id).
- **parser_jobs:** referenced by parser_logs (job_id).
- **admin_users:** referenced by role_user (user_id). role_user also references roles (role_id).
- **attribute_*** tables:** standalone; no FKs to products/categories; used by AttributeExtractionService and AttributeFacetService.

**Flow:** Category sync populates categories. Parser creates/updates products, sellers, product_photos, product_attributes. parser_jobs track each run; parser_logs store log rows. Admin users authenticate via JWT (admin_users); roles linked via role_user.

# DATABASE_STRUCTURE — sadavod_parser

**Database**: sadavod_parser  
**Engine**: MariaDB 10.11  
**Host**: localhost (127.0.0.1)

---

## Parser-Related Tables

### parser_jobs
| Column | Type | Null | Key | Default | Description |
|--------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | PK |
| type | varchar(50) | NO | | full | full, menu_only, category, seller |
| options | longtext | YES | | NULL | JSON options |
| status | varchar(20) | NO | MUL | pending | pending, running, completed, failed, cancelled |
| total_categories | int | NO | | 0 | |
| parsed_categories | int | NO | | 0 | |
| total_products | int | NO | | 0 | |
| parsed_products | int | NO | | 0 | |
| saved_products | int | NO | | 0 | |
| errors_count | int | NO | | 0 | |
| photos_downloaded | int | NO | | 0 | |
| photos_failed | int | NO | | 0 | |
| current_action | varchar(500) | YES | | NULL | |
| current_page | int | NO | | 0 | |
| total_pages | int | NO | | 0 | |
| current_category_slug | varchar(200) | YES | | NULL | |
| pid | bigint unsigned | YES | | NULL | Process ID |
| log_file | varchar(500) | YES | | NULL | |
| started_at | timestamp | YES | | NULL | |
| finished_at | timestamp | YES | | NULL | |
| error_message | text | YES | | NULL | |
| created_at | timestamp | YES | MUL | NULL | |
| updated_at | timestamp | YES | | NULL | |

### parser_logs
| Column | Type | Null | Key | Description |
|--------|------|------|-----|-------------|
| id | bigint unsigned | NO | PRI | PK |
| job_id | bigint unsigned | YES | MUL | FK parser_jobs |
| level | varchar(20) | NO | MUL | info, warn, error, debug |
| module | varchar(50) | NO | MUL | Parser |
| message | varchar(1000) | NO | | |
| context | longtext | YES | | JSON |
| entity_type | varchar(50) | YES | | |
| entity_id | varchar(100) | YES | | |
| logged_at | timestamp | NO | | current_timestamp |

---

## Products & Catalog

### products
| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | bigint unsigned | PRI | PK |
| external_id | varchar(50) | UNI | From source site |
| source_url | varchar(500) | | |
| title | varchar(500) | | |
| price | varchar(100) | | Display price |
| price_raw | int unsigned | MUL | Numeric price |
| description | text | | |
| category_id | bigint unsigned | MUL | FK categories |
| seller_id | bigint unsigned | MUL | FK sellers |
| brand_id | bigint unsigned | | FK brands |
| category_slugs | longtext | | JSON array |
| color, size_range | varchar(200) | MUL | |
| characteristics | longtext | | JSON |
| source_link, source_published_at | | | |
| status | varchar(20) | MUL | active, hidden, etc. |
| is_relevant | tinyint | MUL | |
| photos, photos_downloaded, photos_count | | | |
| parsed_at | timestamp | MUL | |
| created_at, updated_at | timestamp | | |

### product_photos
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| product_id | bigint unsigned | FK products |
| original_url | varchar(500) | |
| local_path | varchar(500) | |
| download_status | varchar(20) | pending, etc. |
| is_primary | tinyint | |
| sort_order | int | |

### product_attributes
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| product_id | bigint unsigned | FK products |
| category_id | bigint unsigned | |
| attr_name | varchar(200) | |
| attr_value | varchar(500) | |
| attr_type | varchar(20) | text, etc. |

### categories
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| external_slug | varchar(200) | UNI, from source |
| name, slug | | |
| parent_id | bigint unsigned | Self-ref |
| sort_order | int | |
| enabled | tinyint | |
| linked_to_parser | tinyint | Include in parsing |
| parser_products_limit | int | |
| parser_max_pages | int | |
| parser_depth_limit | int | |
| products_count | int | |
| last_parsed_at | timestamp | |

### sellers
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| slug | varchar(300) | UNI |
| name | varchar(500) | |
| source_url | varchar(500) | |
| pavilion, pavilion_line, pavilion_number | | |
| phone, whatsapp_url, telegram_url, vk_url | | |
| status | varchar(20) | |
| is_verified | tinyint | |
| products_count | int | |
| last_parsed_at | timestamp | |

### brands
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| name | varchar(500) | UNI |
| slug | varchar(200) | UNI |
| logo_url, logo_local_path | | |
| status | varchar(20) | |
| category_ids | longtext | JSON |

---

## Configuration & Rules

### settings
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| group | varchar(100) | general, parser, security, relevance |
| key | varchar(200) | UNI |
| value | text | |
| type | varchar(20) | string, int, bool, json |
| label, description | | |

### excluded_rules
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| pattern | varchar(500) | |
| type | varchar(20) | word, phrase, regex |
| action | varchar(20) | hide, delete, replace, flag |
| replacement | varchar(500) | |
| scope | varchar(20) | global, category, etc. |
| category_id | bigint unsigned | |
| is_active | tinyint | |
| priority | int | |
| expires_at | timestamp | |

### filters_config
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| category_id | bigint unsigned | FK categories |
| attr_name | varchar(200) | |
| display_name | varchar(500) | |
| display_type | varchar(20) | checkbox, select, range, radio |
| sort_order | int | |
| preset_values | longtext | JSON |
| range_min, range_max | decimal | |
| is_active | tinyint | |
| is_filterable | tinyint | |

---

## Auth & Sessions

### admin_users
| Column | Type | Description |
|--------|------|-------------|
| id | bigint unsigned | PK |
| name | varchar(200) | |
| email | varchar(200) | UNI |
| password | varchar(255) | |
| role | varchar(50) | editor, etc. |
| permissions | longtext | |
| is_active | tinyint | |
| last_login_at | timestamp | |

### users
Laravel default users table (likely unused for admin; admin_users used instead).

### sessions
Laravel sessions.

---

## Queue & Jobs

### jobs
Laravel queue jobs (database driver).

### job_batches
Laravel batch jobs.

### failed_jobs
Failed queue jobs.

---

## Relations Summary

```
parser_jobs 1──* parser_logs
products *──1 categories
products *──1 sellers
products *──1 brands
products 1──* product_photos
products 1──* product_attributes
categories 1──* categories (parent_id)
categories 1──* filters_config
excluded_rules *──1 categories (optional)
```

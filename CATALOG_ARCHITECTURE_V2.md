# Catalog Architecture Design (V2 — Dual Category System)

**Document type:** Ideal marketplace catalog architecture (design only, no code)  
**Audience:** Senior marketplace architect, backend/frontend leads  
**Context:** Platform with parser (donor import), catalog DB, storefront, admin, CRM, product moderation, attribute normalization, category-based attribute schemas. Donor data is messy and inconsistent. **V2 adds two independent category systems: donor categories (parser) and catalog categories (marketplace).**

---

## STEP 1 — ANALYZE CURRENT PROJECT

*(Sections 1.1 Product Model through 1.6 Parser Output Structure remain as in the original document. Below: category-specific analysis and problems when donor and catalog are mixed.)*

### 1.2 Category Model (Current) — Extended Analysis

**Table: `categories` (single table in current design)**

- **Identity:** `id`, `external_slug` (unique, from donor), `name`, `slug`.
- **Tree:** `parent_id` (self), `sort_order`.
- **Parser:** `source_url` (or url), `enabled`, `linked_to_parser`, `parser_products_limit`, `parser_max_pages`, `parser_depth_limit`, `products_count`, `last_parsed_at`.
- **Display:** `icon` (nullable).

**Problems when donor and catalog categories are mixed**

- **Parser overwrites marketplace structure:** Category sync (MenuParser → saveCategoriesFlat) creates/updates the same table the storefront uses. Donor menu changes (rename, reorder, new/removed nodes) directly change the catalog tree. Storefront URLs (e.g. /category/shoes) and navigation can break or change meaning after a sync.
- **Single slug for two concerns:** `slug` is used for both frontend URLs and often derived from or equal to donor slug. `external_slug` exists for donor mapping but the same table is still the source of truth for both parser and storefront. Confusion: which slug is canonical for the marketplace vs which for the donor?
- **No separation of ownership:** Parser “owns” the category tree when sync runs; merchandising cannot restructure the marketplace taxonomy without either touching parser-driven data or maintaining a parallel structure. So either parser drives catalog (bad for marketplace) or catalog is manually kept and parser data is redundant (waste and drift).
- **products.category_id points at the mixed table:** Product is assigned to one category. If that category is the same row used by parser and storefront, re-sync can rename or merge categories and change product placement from the marketplace’s perspective. Example: donor merges “Men’s Shoes” and “Обувь мужская”; one category disappears and products move; storefront menu and filters change unexpectedly.
- **Parser limits and “linked_to_parser” on same entity:** Fields like parser_products_limit and linked_to_parser belong to “which donor categories we parse.” Putting them on the same table as “marketplace categories” mixes two lifecycles: donor menu structure vs marketplace taxonomy.
- **Brand_categories and category_attribute_schema reference the mixed table:** If categories are shared, then brand assignments and attribute schemas are tied to a tree that the parser can alter. Renaming or deleting a category for parser reasons would force unwanted changes in marketplace configuration.

**Conclusion:** A single category system cannot safely serve both parser (donor-driven, sync-overwritable) and marketplace (curated, stable URLs and tree). Parser categories must **never** override marketplace categories. The design must split **donor categories** (parser-only) and **catalog categories** (marketplace-only) and map from the former to the latter when assigning products.

---

## STEP 2 — DESIGN IDEAL MARKETPLACE CATALOG

*(Original STEP 2 entities and relationships are updated below to introduce donor_categories, catalog_categories, and category_mapping. References to “categories” in product, brand_categories, and category_attribute_schema now mean catalog_categories.)*

### 2.1 Entities (Revised for Dual Categories)

**donor_categories**

- **Responsibility:** Represent the category tree **as it exists on the donor site**. Used only by the parser to decide what to crawl (menu, catalog URLs) and to record “this product came from this donor category.” Parser sync (e.g. MenuParser) creates/updates donor_categories only. No storefront or admin taxonomy control depends on this table.
- **Typical columns:** id, external_slug (or donor_slug, unique), name, parent_id (self), source_url, sort_order, donor_menu_path (optional), last_synced_at. Optional: products_count for donor-side stats. No “enabled” or “linked_to_parser” on catalog table — those can live on donor_categories or in parser config (which donor categories to parse).

**catalog_categories**

- **Responsibility:** The **marketplace taxonomy** used by the storefront, filters, breadcrumbs, and admin for merchandising. Fully controlled by the business: create, rename, reorder, merge, hide. Never overwritten by the parser. Products, brand_categories, and category_attribute_schema reference catalog_categories.
- **Typical columns:** id, parent_id (self), slug (unique, for URLs), name, sort_order, icon, is_visible, meta_title, meta_description, created_at, updated_at. products_count can be maintained by application logic. No external_slug or parser-specific fields.

**category_mapping**

- **Responsibility:** Links **donor categories** to **catalog categories**. Defines how a product that was parsed from a donor category is assigned to a catalog category. Prevents parser from ever “choosing” the marketplace category by itself; mapping is explicit and admin-managed.
- **Typical columns:** donor_category_id (FK donor_categories), catalog_category_id (FK catalog_categories). Unique on donor_category_id (one donor category maps to at most one catalog category). Optional: priority, auto_create (if true, when new donor category appears, create catalog category and mapping — still admin-controlled policy). Optional: updated_at for auditing.

**categories (deprecated in this design)**

- The single “categories” table is replaced by **donor_categories** and **catalog_categories**. All references in the document to “categories” in the context of products, brand_categories, category_attribute_schema, and storefront mean **catalog_categories**.

**products**

- **category_id** → **catalog_categories.id** (product is placed in a marketplace category). Product also stores **donor_category_id** (optional) for traceability: which donor category this product was parsed from.

**brand_categories**

- **category_id** → **catalog_categories.id**. Brands are linked to marketplace categories only.

**category_attribute_schema**

- **category_id** → **catalog_categories.id**. Attribute schema (filters, display) is defined per marketplace category.

### 2.2 Relationships (Revised)

- **donor_categories** ↔ **donor_categories:** parent_id (self) → donor tree.
- **catalog_categories** ↔ **catalog_categories:** parent_id (self) → catalog tree.
- **category_mapping:** donor_category_id → donor_categories; catalog_category_id → catalog_categories. One donor category → one catalog category (or unmapped).
- **products** → **catalog_categories:** product.category_id = catalog_category_id (marketplace placement).
- **products** → **donor_categories:** product.donor_category_id = donor_category_id (optional; source of parse).
- **brands** ↔ **catalog_categories:** brand_categories (brand_id, catalog_category_id).
- **category_attribute_schema:** catalog_category_id, attribute_id. All attribute schema is for catalog categories only.

### 2.3 Diagram (Ideal, with Dual Categories)

```
donor_categories (tree)          category_mapping          catalog_categories (tree)
        │                                │                            │
        │  donor_category_id             │  catalog_category_id       │
        └────────────────────────────────┼────────────────────────────┘
                                         │
        Parser                           │    Storefront / Admin
        uses donor_categories            │    use catalog_categories
        only                             │
                                         ▼
                                    products
                                    (category_id → catalog_categories;
                                     donor_category_id → donor_categories, optional)
                                         │
                                         ├──► category_attribute_schema (catalog_category_id)
                                         ├──► brand_categories (catalog_category_id)
                                         └──► product_attributes (category_id = catalog_category_id)
```

---

## STEP 3 — ATTRIBUTE NORMALIZATION SYSTEM

*(Unchanged from original document.)*

---

## STEP 4 — CATEGORY ATTRIBUTE SCHEMA

*(All references to “category” in this section mean **catalog_categories**. category_attribute_schema.category_id is FK to catalog_categories. No change to structure or logic; only the entity is catalog category.)*

---

## STEP 5 — PRODUCT ATTRIBUTE STORAGE

*(product_attributes.category_id denormalized from product.category_id; both refer to **catalog_categories**. Unchanged otherwise.)*

---

## STEP 6 — PARSER INTEGRATION

### 6.1 Flow (Revised for Dual Categories)

```
Donor site (e.g. sadovodbaza.ru)
         │
         │ HTTP, MenuParser → donor menu
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Sync donor categories                                           │
│  Create/update donor_categories only (external_slug, name,       │
│  parent_id, source_url, sort_order). No change to                │
│  catalog_categories.                                              │
└─────────────────────────────────────────────────────────────────┘
         │
         │ HTTP, CatalogParser / ProductParser / SellerParser
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Raw product payload                                             │
│  title, price, description, characteristics [{key, value}],     │
│  photos, seller_link, donor_category_slug (from donor)           │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Resolve donor category: donor_category_slug → donor_category_id  │
│  Resolve catalog category: category_mapping(donor_category_id)     │
│  → catalog_category_id. If no mapping: use fallback (e.g.        │
│  “Uncategorized” catalog category or leave product unmapped     │
│  for manual assignment).                                         │
│  Resolve seller (link → seller_id).                               │
│  Product::upsertFromParser(..., catalog_category_id,             │
│  donor_category_id, ...); write product_raw_attributes.          │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Attribute normalization pipeline (unchanged)                    │
│  Write product_attributes; product.category_id = catalog_        │
│  category_id for filters.                                        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Product saved: category_id = catalog_category_id (marketplace); │
│  donor_category_id = donor_category_id (traceability).           │
│  Moderation → Publish as in original flow.                        │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Responsibilities (Revised)

- **Parser (category sync):** Fetch donor menu; create/update **donor_categories** only. Never create or update catalog_categories.
- **Parser (product save):** Emit donor_category_slug with each product. Catalog service resolves donor_category_slug → donor_category_id, then category_mapping → catalog_category_id. Upsert product with category_id = catalog_category_id and optional donor_category_id.
- **Catalog service:** Owns mapping lookup and fallback; writes product with catalog category only; normalization and moderation unchanged.

### 6.3 Re-run Normalization

*(Unchanged.)*

---

## STEP 7 — FINAL CATALOG ARCHITECTURE

### 7.1 Database Structure (Ideal) — Revised for Dual Categories

**Core catalog**

- **donor_categories:** id, parent_id (self), external_slug (unique), name, source_url, sort_order, last_synced_at, created_at, updated_at. Optional: products_count, is_linked_to_parser (or move to parser config).
- **catalog_categories:** id, parent_id (self), slug (unique), name, sort_order, icon, is_visible, meta_title, meta_description, products_count, created_at, updated_at. No parser or donor fields.
- **category_mapping:** id (optional), donor_category_id (FK donor_categories, unique), catalog_category_id (FK catalog_categories), created_at, updated_at. One row per donor category; each donor category maps to at most one catalog category.
- **products:** id, external_id, source_url, title, price (display), price_raw, description, **category_id** (FK catalog_categories), **donor_category_id** (FK donor_categories, nullable), seller_id, brand_id, status, moderation_status, is_relevant, parsed_at, created_at, updated_at.
- **sellers:** (unchanged).
- **brands:** (unchanged).
- **brand_categories:** brand_id, **catalog_category_id** (FK catalog_categories). Many-to-many.

**Attributes (unchanged)**

- attributes, attribute_values, attribute_key_mapping, attribute_synonyms, attribute_canonical.

**Category–attribute schema**

- **category_attribute_schema:** catalog_category_id, attribute_id, required, display_order, filter_order, display_label, filter_type, is_filterable, is_searchable, range_min, range_max, preset_values. Unique (catalog_category_id, attribute_id). All category_id in this table mean catalog_categories.

**Product attribute storage**

- **product_raw_attributes:** (unchanged).
- **product_attributes:** product_id, attribute_id, value, **catalog_category_id** (denormalized from product.category_id for filter indexes), raw_value, confidence. Indexes include (catalog_category_id, attribute_id, value).

**Parser and moderation**

- parser_jobs, parser_logs, parser_settings, parser_state unchanged. Parser sync writes donor_categories; product save uses category_mapping to set product.category_id (catalog).

### 7.2 Entity Relationships (Final) — Revised

- donor_categories: self tree (parent_id).
- catalog_categories: self tree (parent_id).
- category_mapping: donor_category_id → donor_categories; catalog_category_id → catalog_categories.
- products → catalog_categories (category_id); products → donor_categories (donor_category_id, optional).
- products → sellers, brands (many-to-one).
- brands ↔ catalog_categories: brand_categories (brand_id, catalog_category_id).
- category_attribute_schema: catalog_category_id, attribute_id.
- product_attributes: product_id, attribute_id, catalog_category_id (denormalized).
- product_raw_attributes: product_id. attribute_key_mapping, attribute_synonyms, attribute_canonical: attribute_id → attributes.

### 7.3–7.5 Parser, Attribute, Moderation Summaries

- **Parser:** Syncs donor_categories only; product save uses donor_category_slug → donor_category_id → category_mapping → catalog_category_id; product stored with category_id = catalog_category_id. Parser never overwrites catalog_categories.
- **Attribute system:** Unchanged; category in schema and product_attributes is catalog_categories.
- **Moderation:** Unchanged.

---

## STEP 8 — CATEGORY MAPPING SYSTEM

### 8.1 Purpose

- **Donor categories** reflect the donor site’s menu; they are synced by the parser and used only to know “where on the donor this product lived” and which catalog category to assign via mapping.
- **Catalog categories** are the marketplace taxonomy; they are managed by the business and drive storefront URLs, filters, and attribute schemas.
- **Category mapping** is the only link from parser output to marketplace placement: donor_category_id → catalog_category_id. Parser categories must never override marketplace categories; mapping ensures that.

### 8.2 Database Structure (Category System Only)

**donor_categories**

| Column           | Type         | Purpose |
|------------------|--------------|---------|
| id               | bigint PK    | Primary key |
| parent_id        | bigint nullable | FK donor_categories.id; tree |
| external_slug    | varchar(200) | Unique; slug from donor URL/menu |
| name             | varchar(500) | Name as on donor |
| source_url       | varchar(500) | Full URL on donor (optional) |
| sort_order       | int          | Order in donor menu (optional) |
| last_synced_at   | timestamp    | Last time this row was updated by parser sync |
| created_at       | timestamp    | |
| updated_at       | timestamp    | |

- **Indexes:** unique (external_slug); index (parent_id). No “enabled” or “linked_to_parser” required here if parser config holds “which slugs to parse” elsewhere; otherwise add is_parse_enabled or similar.

**catalog_categories**

| Column           | Type         | Purpose |
|------------------|--------------|---------|
| id               | bigint PK    | Primary key |
| parent_id        | bigint nullable | FK catalog_categories.id; tree |
| slug             | varchar(200) | Unique; URL slug for storefront |
| name             | varchar(500) | Display name |
| sort_order       | int          | Order in nav/filters |
| icon             | varchar(100) nullable | Icon identifier (optional) |
| is_visible       | boolean      | Show in menu/storefront |
| meta_title       | varchar(255) nullable | SEO (optional) |
| meta_description | text nullable | SEO (optional) |
| products_count   | int default 0 | Cached count of active products (optional) |
| created_at       | timestamp    | |
| updated_at       | timestamp    | |

- **Indexes:** unique (slug); index (parent_id); index (is_visible, sort_order). Parser never writes to this table.

**category_mapping**

| Column              | Type    | Purpose |
|---------------------|---------|---------|
| id                  | bigint PK | Optional; for audit |
| donor_category_id   | bigint  | FK donor_categories.id; UNIQUE (one mapping per donor category) |
| catalog_category_id | bigint  | FK catalog_categories.id |
| created_at          | timestamp | |
| updated_at          | timestamp | |

- **Indexes:** unique (donor_category_id); index (catalog_category_id) for “which donor categories map here.”
- **Semantics:** Each donor category maps to exactly one catalog category. A catalog category can be the target of many donor categories (many-to-one from donor to catalog).

**products (relevant columns)**

| Column           | Type    | Purpose |
|------------------|---------|---------|
| category_id      | bigint  | FK catalog_categories.id; marketplace placement; used by storefront and filters |
| donor_category_id| bigint nullable | FK donor_categories.id; optional; which donor category this product was parsed from |

### 8.3 Mapping Logic

**When parser saves a product**

1. Parser provides **donor_category_slug** (from catalog listing URL or product page breadcrumb).
2. Resolve **donor_category_id:** SELECT id FROM donor_categories WHERE external_slug = donor_category_slug (or normalize slug). If not found, optionally create donor_categories row from parser (or treat as unmapped).
3. Resolve **catalog_category_id:** SELECT catalog_category_id FROM category_mapping WHERE donor_category_id = donor_category_id. If not found, apply **fallback policy**, e.g.:
   - Assign to a fixed “Uncategorized” or “Imported” catalog category; or
   - Leave category_id NULL and flag product for manual assignment; or
   - Use a configurable default catalog_category_id per parser/source.
4. Set product.category_id = catalog_category_id, product.donor_category_id = donor_category_id (if stored).
5. All downstream logic (filters, facets, category_attribute_schema, brand_categories) uses product.category_id (catalog) only.

**When donor category sync creates new donor categories**

- New donor_categories rows do not automatically get mapping rows. Admin must create category_mapping entries (donor_category_id → catalog_category_id). Until then, products from that donor category use the fallback policy above. Optionally an “auto-map” rule could create a new catalog category and mapping (e.g. “create catalog category with same name and slug, then map”) — but that is a business rule and should be explicit in admin, not implicit in parser.

**Unmapped donor categories**

- Donor categories with no row in category_mapping are “unmapped.” Products from them get fallback catalog category or NULL. Admin UI can list unmapped donor categories and suggest or bulk-create mappings.

### 8.4 Parser Flow (Category Part Only)

1. **Category sync (e.g. POST /parser/categories/sync or runMenuOnly):**
   - Fetch donor menu (MenuParser).
   - For each menu item: upsert **donor_categories** (external_slug, name, parent_id, source_url, sort_order). Match by external_slug; update name/parent/sort if changed. Do not create or update catalog_categories or category_mapping.
2. **Product parse (per product):**
   - Get donor_category_slug from listing or product page.
   - donor_category_id = resolve(donor_category_slug, donor_categories).
   - catalog_category_id = resolve(donor_category_id, category_mapping) or fallback.
   - Save product with category_id = catalog_category_id, donor_category_id = donor_category_id.
3. **No parser path** ever writes to catalog_categories or category_mapping. Parser only reads category_mapping to resolve catalog_category_id.

### 8.5 Admin UI Logic

**Catalog categories (marketplace taxonomy)**

- **CRUD:** Full create, edit, delete, reorder of catalog_categories. Slug and name are editable; tree (parent_id) is editable. Used for storefront menu and category pages. No “sync” from donor here.
- **List/tree view:** Show catalog tree with products_count, optional breadcrumb. No donor information on this screen.
- **Deleting a catalog category:** If products or brand_categories or category_attribute_schema reference it, either prevent delete or reassign (e.g. move products to parent or “Uncategorized”). Mapping rows that point to this catalog category should be updated or removed (donor categories become unmapped or remapped).

**Parser (donor) categories**

- **Read-only or sync-only:** Admin can trigger “sync donor categories” (calls same endpoint as parser menu sync). UI shows donor_categories tree (external_slug, name, parent, last_synced_at). No edit/delete of donor_categories required for minimal design; or allow edit of name for display only in admin (slug should stay in sync with donor). Purpose: see what the donor has and which nodes are mapped.
- **Products per donor category:** Optional list of products where donor_category_id = X for diagnostics.

**Mapping management**

- **List view:** Table or matrix: donor_category (name, external_slug, parent) | catalog_category (name, slug) | actions. Show unmapped donor categories (no row in category_mapping) with “Set mapping” or “Map to catalog category.”
- **Create mapping:** Choose donor category (from donor_categories), choose catalog category (from catalog_categories). Save category_mapping(donor_category_id, catalog_category_id). One donor category can have only one mapping; creating a new mapping for an already-mapped donor category updates catalog_category_id.
- **Bulk map:** Select multiple donor categories, choose one catalog category → create/update multiple mapping rows. Useful when many donor leaves map to one marketplace category (e.g. “Обувь мужская”, “Мужская обувь” → “Men’s Shoes”).
- **Unmapped report:** List donor_categories that have no mapping; show product count from that donor category. Admin can then create mappings or fix fallback.
- **Conflict or drift:** If donor renames or merges categories, donor_categories update on next sync. Mapping is by donor_category_id, so existing mappings remain. If a donor category is removed on donor, optionally soft-delete or mark donor_categories row and treat as unmapped until admin remaps.

**Summary**

- **Catalog categories:** Full control by admin; never touched by parser.
- **Donor categories:** Synced by parser; admin views (and optionally triggers sync); mapping is the only place admin connects donor → catalog.
- **Mapping:** Admin creates/updates category_mapping; parser only reads it to assign product.category_id. Parser categories never override marketplace categories.

---

*End of Catalog Architecture Design (V2).*

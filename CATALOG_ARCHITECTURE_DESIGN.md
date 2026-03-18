# Catalog Architecture Design

**Document type:** Ideal marketplace catalog architecture (design only, no code)  
**Audience:** Senior marketplace architect, backend/frontend leads  
**Context:** Platform with parser (donor import), catalog DB, storefront, admin, CRM, product moderation, attribute normalization, category-based attribute schemas. Donor data is messy and inconsistent.

---

## STEP 1 — ANALYZE CURRENT PROJECT

### 1.1 Product Model (Current)

**Table: `products`**

- **Identity:** `id` (PK), `external_id` (unique, from donor URL).
- **Core:** `title`, `price` (display string), `price_raw` (numeric), `description`, `source_url`, `source_link`, `source_published_at`.
- **Relations:** `category_id` → categories, `seller_id` → sellers, `brand_id` → brands (all nullable).
- **Denormalized/parser:** `category_slugs` (JSON array), `color` (varchar), `size_range` (varchar), `characteristics` (JSON — raw key-value from donor).
- **Status:** `status` (active, hidden, excluded, error, pending), `is_relevant`, `parsed_at`, `created_at`, `updated_at`.
- **Photos:** `photos_count`, `photos_downloaded`; actual photos in `product_photos` (original_url, local_path, download_status, is_primary, sort_order).

**API shape (ProductFull):** Adds `characteristics` as `Record<string, string>`, `attributes` as `Array<{ name, value, type }>` (derived from product_attributes). So the product has both raw characteristics (JSON) and normalized attributes (separate table).

**Problems:**

- **Dual attribute representation:** `characteristics` (raw) and `product_attributes` (normalized) coexist; product detail shows attributes, but the pipeline from raw → normalized is separate and can drift (e.g. new donor keys not covered by rules).
- **Denormalized color/size on product:** `color` and `size_range` are single columns; multi-value or structured attributes (e.g. several colors, size table) do not fit. Filtering by color uses product column, not a unified attribute layer.
- **No explicit “raw” vs “normalized” on product:** When parser writes attributes, it is unclear whether product_attributes are the single source of truth for storefront or whether characteristics are still used somewhere.
- **No product-level moderation status in schema:** Status is visibility (active/hidden), not workflow (draft → pending_moderation → approved). Moderation is implied in CRM but not in catalog model.

### 1.2 Category Model (Current)

**Table: `categories`**

- **Identity:** `id`, `external_slug` (unique, from donor), `name`, `slug`.
- **Tree:** `parent_id` (self), `sort_order`.
- **Parser:** `source_url` (or url), `enabled`, `linked_to_parser`, `parser_products_limit`, `parser_max_pages`, `parser_depth_limit`, `products_count`, `last_parsed_at`.
- **Display:** `icon` (nullable).

**Problems:**

- **No category–attribute schema link:** Categories do not declare which attributes apply to them. `filters_config` has `category_id` + `attr_name`, so filter UI is per category, but there is no first-class “category attribute schema” (required/optional attributes, types, display order). Attribute rules are global by `attribute_key`, not “this category uses these keys.”
- **Slug vs external_slug:** Both present; external_slug is donor-facing. Confusion when syncing: menu gives donor slugs, catalog uses internal slug for URLs. Need clear policy: one canonical slug for frontend, one for donor mapping.

### 1.3 Seller Model (Current)

**Table: `sellers`**

- **Identity:** `id`, `slug` (unique), `name`.
- **Source:** `source_url`; `pavilion`, `pavilion_line`, `pavilion_number`.
- **Contacts:** `phone`, `whatsapp_url`, `whatsapp_number`, `telegram_url`, `vk_url`.
- **Status:** `status`, `is_verified`, `products_count`, `last_parsed_at`, `created_at`, `updated_at`.
- **Optional:** `description` (in extended API).

**Problems:**

- **Parser-only:** Sellers exist only from parser; no seller registration or self-service. For a full marketplace, seller lifecycle (registration, verification, suspension) is missing in catalog design.
- **No seller–category relationship:** “Seller categories” in API are derived or stored elsewhere; not a clear many-to-many in schema. Catalog does not model “this seller sells in these categories.”

### 1.4 Brand Model (Current)

**Table: `brands`**

- **Identity:** `id`, `name`, `slug` (unique).
- **Display:** `logo_url`, `logo_local_path`; `status`, `seo_title`.
- **Scope:** `category_ids` (JSON) — brands are linked to categories by ID list.

**Problems:**

- **Brand–category is JSON:** `category_ids` is an array in one column; no junction table. Hard to query “categories for brand” or “brands for category” efficiently and to enforce integrity.
- **Brand source:** Brands are created/updated from parser (product page) or admin; no single “brand registry” flow. Risk of duplicate brands (e.g. “Nike” vs “Nike ").

### 1.5 Attribute Model (Current)

**Tables and roles:**

- **product_attributes:** Per-product key-value. Columns: `product_id`, `category_id` (nullable), `attr_name`, `attr_value`, `attr_type` (text, etc.). Indexed by (product_id, attr_name), (category_id, attr_name), (attr_name, attr_value). This is the **normalized** output stored after extraction.
- **attribute_rules:** Extraction rules per `attribute_key`. `rule_type` (regex/keyword), `pattern`, `display_name`, `attr_type` (text/size/color/number), `apply_synonyms`, `priority`, `enabled`. Used by AttributeExtractionService to **detect** attribute name and value from text (title, description, characteristics).
- **attribute_synonyms:** `attribute_key`, `word`, `normalized_value`. Maps a raw word (e.g. “red”) to a normalized value (e.g. “Красный”) for **value** normalization when `apply_synonyms` is true.
- **attribute_value_normalization (or attribute_canonical in API):** `attribute_key`, `raw_value`, `normalized_value`. Direct map raw → canonical (e.g. “turkey” → “Турция”). Used after extraction to normalize the **value** before saving to product_attributes.
- **attribute_dictionary:** `attribute_key`, `value`, `sort_order`. Allowed values per attribute (for filters/validation); not necessarily the same as canonical map.
- **filters_config:** Per category: `attr_name`, `display_name`, `display_type` (checkbox/select/range/radio), `sort_order`, `preset_values` (JSON), `range_min`/`range_max`, `is_active`, `is_filterable`. Drives filter UI and which attributes appear in category.

**Flow today:** Parser produces raw characteristics (key-value from donor). AttributeExtractionService uses rules (regex/keyword) to extract attributes from product text; optionally applies synonyms and canonical map; writes to product_attributes. Facets can be rebuilt from product_attributes for filter counts.

**Problems:**

- **attribute_key vs attr_name:** Rules use `attribute_key` (internal key, e.g. `color`); product_attributes and filters_config use `attr_name`. If they are the same, it should be one name; if different (e.g. key=color, name=Цвет), the mapping must be explicit and consistent. Current design mixes key and name.
- **No single “raw attribute” storage:** Raw donor key-value is in product.characteristics (JSON). If we want to re-run normalization without re-parsing, we need either to keep raw somewhere or to re-parse. No dedicated `raw_product_attributes` table.
- **Synonyms vs canonical:** Synonyms: word → normalized_value (one word). Canonical: raw_value → normalized_value (full string). Overlap in purpose; order of application (synonym first vs canonical first) and fallback when both exist need a clear contract.
- **Category scope of rules:** Attribute rules are global (attribute_key). In reality, “color” in Shoes might be different from “color” in Electronics (e.g. “color” vs “body color”). No category-scoped rules or schema.
- **Filter config vs attribute definition:** filters_config defines display for a category but does not define “this category has attribute X with type Y.” Attribute definitions (type, required, searchable) are in attribute_rules (global). Ideal: category attribute schema defines “which attributes this category has” and optionally overrides display/filter.

### 1.6 Parser Output Structure (Current)

**From ProductParser / donor page:**

- Title, price, description, list of characteristics (donor key-value), photos, seller link. Stored in product: title, price, description, characteristics (JSON), source_url; product_photos rows; seller resolved to sellers.id.

**From AttributeExtractionService:**

- Input: product (title, description, characteristics).
- Process: Run attribute_rules (regex/keyword) to identify attribute_key and raw value; optionally apply synonyms then canonical map; output: list of (attribute_key, value, type, confidence).
- Output: product_attributes rows (product_id, category_id, attr_name, attr_value, attr_type). Legacy path may also write confidence; current product_attributes schema may not have confidence column (audit shows attr_name, attr_value, attr_type).

**Problems:**

- **Parser does not output “raw attributes” explicitly:** Raw is embedded in characteristics. Normalization overwrites or adds product_attributes. No staged “raw → normalized” audit trail per product (e.g. “donor said цвет: красный.; we normalized to color: Красный”).
- **Order of operations:** Excluded_rules apply to title/description (delete/replace/hide). Then attribute extraction. If excluded rules change, re-extraction needs to run again; product_attributes are not clearly “derived from this version of title/description.”
- **Moderation gap:** After product is saved (and attributes written), there is no mandatory “pending_moderation” step. Status is active/hidden. CRM moderation is mock. So “parser → product saved → published” has no moderation gate in the catalog model.

---

## STEP 2 — DESIGN IDEAL MARKETPLACE CATALOG

### 2.1 Entities

**categories**

- Catalog taxonomy (tree). One canonical slug for frontend; optional external_slug for donor mapping. Tracks products_count, last_parsed_at, parser limits. No direct link to attributes in core table; link is via category_attribute_schema.

**products**

- Core entity: identity (id, external_id), title, description, price (display + raw numeric), category_id, seller_id, brand_id, status, visibility, timestamps. No denormalized color/size columns; all such data in product_attributes. Optional: moderation_status (draft, pending_review, approved, rejected).

**brands**

- Registry: id, name, slug, logo, status. Relationship to categories via brand_categories junction (many-to-many) instead of JSON.

**sellers**

- Registry: id, slug, name, status, verification, contacts, timestamps. Optional: seller_categories (many-to-many) if “seller sells in these categories” is needed.

**attributes (global attribute definitions)**

- Global list of attribute keys the system knows about: id, key (e.g. color, size, material), display_name (e.g. Цвет), data_type (text, number, enum, range), unit (optional), searchable, filterable. This is the **definition** of an attribute, not per-product or per-category values.

**attribute_values (canonical value registry, optional)**

- For enum-like attributes: id, attribute_id, value (canonical string or number), sort_order, display_label. Used to constrain and sort allowed values (e.g. color palette, size scale). Products and filters reference these or normalized strings that match them.

**category_attribute_schema**

- Links category to attribute and defines how it is used: category_id, attribute_id, required (boolean), display_order, filter_order, display_label_override, filter_type (checkbox, select, range, multi). So “Shoes” has size, color, material, season; “Electronics” has brand, power, voltage, weight. Each row is “category C has attribute A with this config.”

**product_attributes**

- Per-product normalized attribute values: product_id, attribute_id (or attribute_key), value (normalized: string or number or FK to attribute_values.id if enum). Optionally: raw_value (for audit), confidence (from extractor). category_id can be denormalized for faster filter queries. No free-form attr_name string; attribute_id ties to attributes table.

**product_raw_attributes (new, optional)**

- Staging: product_id, source (donor), key (raw key from donor), value (raw value), created_at. Preserves donor data before normalization; allows re-run of normalization without re-parsing.

### 2.2 Relationships

- **categories** ↔ **categories:** parent_id (self) → tree.
- **products** → **categories:** many-to-one (product belongs to one category).
- **products** → **sellers:** many-to-one.
- **products** → **brands:** many-to-one.
- **brands** ↔ **categories:** many-to-many via **brand_categories** (brand_id, category_id).
- **attributes:** standalone; referenced by category_attribute_schema and product_attributes.
- **category_attribute_schema:** (category_id, attribute_id) + config. Many-to-many categories ↔ attributes with metadata.
- **product_attributes:** (product_id, attribute_id) + value. Products many-to-many with attribute values via this table.
- **attribute_values (optional):** attribute_id → attribute; product_attributes.value can reference attribute_values.id for enum attributes, or store literal for text/number.
- **product_raw_attributes:** product_id → product; one row per raw donor key-value.

### 2.3 Diagram (Ideal)

```
                    attributes (key, display_name, data_type, ...)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
category_attribute_schema    product_attributes    attribute_values (optional)
(category_id, attribute_id,   (product_id,          (attribute_id, value,
 display_order, filter_type)   attribute_id, value)   sort_order)
         │               │
         │               │
         ▼               ▼
    categories      products
    (tree)              │
         │               ├──► sellers
         │               ├──► brands ◄──► categories (brand_categories)
         │               └──► product_raw_attributes (optional)
         │
         └──► filters_config can be derived from category_attribute_schema
               or kept as display/filter override table
```

---

## STEP 3 — ATTRIBUTE NORMALIZATION SYSTEM

### 3.1 Goal

Convert donor-supplied attributes (inconsistent keys and values, e.g. “цвет: красный”, “цвет: красный.”, “цвет: red”, “цвет: алый”) into a single **attribute key** (e.g. color) and a single **normalized value** (e.g. “Красный”) for storage and filtering.

### 3.2 Pipeline Stages

**Stage 1: Donor attribute (parser output)**

- Parser emits key-value pairs as found on the donor page (e.g. key=“цвет”, value=“красный.”). These may have trailing punctuation, different casing, mixed language, typos.

**Stage 2: Raw attribute**

- Store as-is in **product_raw_attributes** (product_id, key, value) or in product.characteristics. This is the immutable “what the donor said.” Optional but recommended so normalization can be re-run without re-parsing.

**Stage 3: Key normalization (donor key → attribute_key)**

- Donor keys vary (“цвет”, “Цвет”, “Color”). A **key mapping** table or config: donor_key (normalized for match, e.g. lowercased “цвет”) → attribute_id or attribute_key. So all “цвет”/“Color” map to attribute key `color`. Output: (attribute_key, raw_value).

**Stage 4: Synonym matching (raw value → candidate normalized value)**

- **Synonyms table:** (attribute_key, word, normalized_value). “word” is a token or phrase that appears in raw value (e.g. “red”, “алый”, “красный”); “normalized_value” is the canonical display value (e.g. “Красный”). Matching can be: exact match on word, or tokenize raw_value and match each token, or phrase match. If multiple synonyms match, choose one by priority or longest match. Output: normalized_value or “unchanged” if no synonym.

**Stage 5: Canonical map (raw value → normalized value)**

- **Canonical table:** (attribute_key, raw_value, normalized_value). Full-string map: e.g. raw_value=“красный.” → normalized_value=“Красный”. Applied after trimming/case-normalization. Takes precedence over synonyms for full-string match, or synonyms apply first and then canonical is used for the result. Design choice: **canonical applies to the raw value first**; if no canonical match, then try synonym (word-by-word or phrase). Output: normalized_value.

**Stage 6: Normalized value**

- Final value stored in **product_attributes**: attribute_id/key + normalized_value. For enum-like attributes, normalized_value should match an **attribute_values** row (or create one) so filters and search use a single canonical list.

### 3.3 Order of Operations (Recommended)

1. **Key mapping:** donor key → attribute_key.
2. **Value cleanup:** trim, normalize spaces, optional lowercasing for lookup only.
3. **Canonical lookup:** (attribute_key, raw_value) → normalized_value. If found, use it and stop.
4. **Synonym lookup:** tokenize or split raw_value; for each token/phrase, look up (attribute_key, word) → normalized_value. If single token and one match, use it; if multiple tokens, combine or take highest-priority. If no match, keep cleaned raw_value as normalized (or mark for manual review).
5. **Store:** Write (product_id, attribute_id, normalized_value) to product_attributes; optionally keep (product_id, raw_key, raw_value) in product_raw_attributes.

### 3.4 Synonyms and Normalization Rules

**Synonyms:**

- **Purpose:** Map variant words/phrases to one canonical value. Example: word=“red”, normalized_value=“Красный”; word=“алый”, normalized_value=“Красный”.
- **Scope:** Per attribute_key. So color has its own synonym set; size has another.
- **Matching:** Case-insensitive; optionally strip punctuation on the “word” side. Store “word” in a normalized form (e.g. lowercased, no trailing dot) so “красный” and “красный.” both match.
- **Priority:** If two synonyms match (e.g. “red” → “Красный”, “red” → “Рыжий”), have priority on synonym rows or “first match wins.” Prefer one canonical value per attribute_key+word.

**Canonical (raw_value → normalized_value):**

- **Purpose:** Map full raw string to canonical when the string is known. Example: “turkey” → “Турция”, “красный.” → “Красный”.
- **Use case:** Donor often repeats the same messy value; canonical table grows from real data (audit of product_attributes or raw) and manual fixes. Rebuild or suggest canonical from synonym results.
- **Precedence:** Canonical is checked first (full string). If no match, then synonym. So specific full-string overrides generic word mapping.

**Extraction rules (regex/keyword):**

- **Purpose:** When attribute is not in a clean key-value list but embedded in title/description, rules extract (attribute_key, raw_value) from text. Current attribute_rules do this. Output of extraction is (attribute_key, raw_value); then apply key mapping (if needed), then value normalization (canonical + synonym) as above.
- **Place in pipeline:** Extraction runs on product text; its output is “raw” attribute key and value. So extraction feeds into the same normalization pipeline (key map → value canonical → value synonym).

### 3.5 Confidence and Review

- **Confidence:** Extractor can output confidence (0–1). Store in product_attributes if desired. Low-confidence rows can be flagged for CRM review or not shown in filters until approved.
- **Unmapped raw:** If after normalization the value is still “unknown” (e.g. no synonym, no canonical), store it as normalized_value = cleaned raw and optionally set needs_review = true so catalog team can add a canonical or synonym rule.

---

## STEP 4 — CATEGORY ATTRIBUTE SCHEMA

### 4.1 Concept

Each category declares **which attributes apply** to products in that category and how they are used (display order, filter type, required). Example: Shoes → size, color, material, season; Electronics → brand, power, voltage, weight.

### 4.2 Structure

**Entity: category_attribute_schema**

- **category_id**, **attribute_id:** FK; unique (category_id, attribute_id).
- **required:** boolean — product in this category should have this attribute (parser or catalog UI can warn).
- **display_order:** int — order in product card and PDP.
- **filter_order:** int — order in sidebar filters.
- **display_label:** override for this category (e.g. “Цвет” in one category, “Цвет корпуса” in another); null = use attribute.display_name.
- **filter_type:** checkbox | select | range | radio | multiselect.
- **is_filterable:** boolean — show in category filters.
- **is_searchable:** boolean — include in full-text or attribute search.
- **range_min, range_max:** for numeric/range attributes; null for non-range.
- **preset_values:** optional JSON or FK to attribute_values — restrict filter to these values in this category.

### 4.3 How Attributes Are Assigned to Categories

**Option A: Explicit assignment (recommended)**

- Admin (or migration) creates rows in category_attribute_schema: for each category, add (category_id, attribute_id, display_order, filter_type, …). So “Shoes” gets size, color, material, season; “Electronics” gets brand, power, voltage, weight. New category gets a default set or copy from parent/sibling.

**Option B: Inheritance from parent**

- Child category inherits parent’s schema; can add more attributes or override display_order/filter_type. Reduces duplication but adds logic (resolve effective schema by walking tree).

**Option C: Discovery + config**

- Parser/products “discover” attributes (e.g. from product_attributes). System suggests attributes per category (e.g. “80% of products in Shoes have ‘color’”). Admin then confirms and sets display_order/filter_type in category_attribute_schema. So schema is driven by data but controlled by config.

**Recommendation:** Option A for clarity; Option C as a helper to suggest which attributes to add to a category. No mandatory inheritance unless the tree is deep and shared attributes are many.

### 4.4 Filter Config and Facets

- **Filter UI:** For a category, read category_attribute_schema where is_filterable = true, ordered by filter_order. For each attribute, display_name = display_label ?? attribute.display_name; filter_type drives widget (checkbox, select, range). **Facets:** Count distinct product_attributes (attribute_id, value) for products in that category (and status = active). So “filter config” is derived from category_attribute_schema; facet counts from product_attributes.
- **Preset values:** If category_attribute_schema.preset_values is set, filter shows only those values (and their counts). Else show all values that appear in product_attributes for this category (with optional min_count threshold).

---

## STEP 5 — PRODUCT ATTRIBUTE STORAGE

### 5.1 How Values Are Stored

**Table: product_attributes**

- **product_id** (FK products), **attribute_id** (FK attributes), **value** (string or number or FK attribute_values.id for enum). Optional: **raw_value** (audit), **confidence** (float), **source** (parser | manual | import). Unique (product_id, attribute_id) if one value per attribute per product; or allow multiple rows for multi-value (e.g. color: red, blue) with (product_id, attribute_id, value, sort_order).
- **Denormalization:** For fast category filtering, add **category_id** to product_attributes (copied from product.category_id) and index (category_id, attribute_id, value). Filter “category = Shoes AND color = Красный” becomes index scan on product_attributes.

**Data types:**

- **text:** value is varchar; search and filter by exact or like.
- **number:** value is numeric; filter by range; store in a numeric column or cast.
- **enum:** value matches attribute_values.value or attribute_values.id; filter by value id or value string.
- **range:** store min/max in two columns or JSON; filter by overlap with requested range.

### 5.2 How Filters Are Built

1. **Schema:** For category C, get category_attribute_schema where category_id = C and is_filterable = true, order by filter_order.
2. **Facets:** For each (attribute_id) in schema, query product_attributes (and join products where category_id = C and status = active): GROUP BY value, COUNT(*). Result: list of (value, count) per attribute. Optionally filter out values with count &lt; min_count.
3. **Apply filters:** User selects e.g. color = Красный, size = 42. Query: products in category C with status active AND (product_id in (select product_id from product_attributes where attribute_id = color and value = 'Красный')) AND (product_id in (select product_id from product_attributes where attribute_id = size and value = '42')). Use indexes (category_id, attribute_id, value) on product_attributes or a materialized filter table.
4. **Preset:** If category_attribute_schema has preset_values for an attribute, facet and filter only use those values.

### 5.3 How Search Uses Attributes

- **Full-text:** Title, description in product; optionally concatenate product_attributes (display value) into a searchable field or full-text index. So search for “красный” finds products with color = Красный if that string is in the search index.
- **Structured attribute search:** Search API accepts filters like color=Красный, size=42. Same as category filter: product_attributes join. For “search in category + attribute filters,” combine full-text (or category scope) with attribute predicates.
- **Faceted search:** Return facets (attribute_id, value, count) for the current search result set, so user can narrow by attribute. Build facets from product_attributes restricted to product_ids matching the search.

---

## STEP 6 — PARSER INTEGRATION

### 6.1 Flow (Ideal)

```
Donor site (e.g. sadovodbaza.ru)
         │
         │ HTTP, ProductParser / CatalogParser / SellerParser
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Raw product payload                                             │
│  title, price, description, characteristics [{key, value}],     │
│  photos, seller_link, category_slug                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Resolve category (slug → category_id), seller (link → seller_id)│
│  Product::upsertFromParser (id, external_id, title, price,       │
│  description, category_id, seller_id, brand_id, status = draft or │
│  pending_moderation)                                              │
│  Write product_raw_attributes from characteristics               │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Attribute normalization pipeline                                 │
│  For each raw (key, value):                                       │
│    key → attribute_id (key mapping)                               │
│    value → canonical then synonym → normalized_value              │
│  Write product_attributes (product_id, attribute_id, value)       │
│  Optionally keep product_raw_attributes for audit                │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Product saved (DB)                                               │
│  status = pending_moderation (or draft if config says so)         │
│  product_attributes populated                                     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Moderation (CRM or Admin)                                        │
│  List products where status = pending_moderation                  │
│  Approve → status = active (or published)                         │
│  Reject → status = rejected; optional feedback                    │
│  Edit attributes → update product_attributes, then approve        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Published product                                                │
│  status = active; visible in storefront and category/filter APIs  │
│  Rebuild facets for affected category if needed                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Responsibilities

- **Parser:** Fetch donor data; output raw product (title, price, description, characteristics, photos, seller, category slug). Do **not** normalize attributes in parser; only persist raw.
- **Catalog service:** Upsert product; write product_raw_attributes; run normalization pipeline (key map → canonical → synonym); write product_attributes; set status = pending_moderation (or draft).
- **Moderation:** Separate step (CRM/Admin UI); change status to active or rejected. Optional: edit product_attributes before approve.
- **Publish:** status = active makes product visible; category products API and filters exclude non-active. Optionally trigger facet rebuild for the product’s category.

### 6.3 Re-run Normalization

- If synonym or canonical rules change, re-run normalization for all products (or per category): read product_raw_attributes (or product.characteristics), apply key map + canonical + synonym, overwrite product_attributes. No need to re-crawl donor.

---

## STEP 7 — FINAL CATALOG ARCHITECTURE

### 7.1 Database Structure (Ideal)

**Core catalog**

- **categories:** id, parent_id, external_slug, name, slug, sort_order, icon, enabled, linked_to_parser, parser_products_limit, parser_max_pages, parser_depth_limit, products_count, last_parsed_at, created_at, updated_at.
- **products:** id, external_id, source_url, title, price (display), price_raw, description, category_id, seller_id, brand_id, status (active | hidden | excluded | error | pending), moderation_status (draft | pending_moderation | approved | rejected), is_relevant, parsed_at, created_at, updated_at. No color/size_range/characteristics columns; those only in attributes.
- **sellers:** id, slug, name, source_url, pavilion, contacts (JSON or columns), status, is_verified, products_count, last_parsed_at, created_at, updated_at.
- **brands:** id, name, slug, logo_url, status, seo_title, created_at, updated_at.
- **brand_categories:** brand_id, category_id (PK or unique). Many-to-many.

**Attributes (definitions and normalization)**

- **attributes:** id, key (unique, e.g. color, size), display_name, data_type (text | number | enum | range), unit, searchable, filterable, created_at, updated_at.
- **attribute_values (optional):** id, attribute_id, value, sort_order, display_label. For enum-like attributes.
- **attribute_key_mapping:** donor_key (normalized string, unique per attribute_id), attribute_id. Maps donor key → attribute.
- **attribute_synonyms:** id, attribute_id, word (normalized), normalized_value, priority, created_at, updated_at.
- **attribute_canonical:** id, attribute_id, raw_value, normalized_value, created_at, updated_at. Unique (attribute_id, raw_value).

**Category–attribute schema**

- **category_attribute_schema:** id, category_id, attribute_id, required, display_order, filter_order, display_label, filter_type, is_filterable, is_searchable, range_min, range_max, preset_values (JSON or FK), created_at, updated_at. Unique (category_id, attribute_id).

**Product attribute storage**

- **product_raw_attributes:** id, product_id, source (parser), attr_key (raw), attr_value (raw), created_at. Optional; for audit and re-normalization.
- **product_attributes:** id, product_id, attribute_id, value (string or number or FK attribute_values.id), category_id (denormalized), raw_value (optional), confidence (optional), created_at, updated_at. Indexes: (product_id, attribute_id), (category_id, attribute_id, value), (attribute_id, value).

**Parser and moderation**

- **parser_jobs, parser_logs, parser_settings, parser_state:** Unchanged in role; parser writes products and product_raw_attributes; catalog service runs normalization and writes product_attributes.
- **products.moderation_status** drives moderation queue; CRM/Admin updates to approved/rejected and optionally products.status to active/hidden.

### 7.2 Entity Relationships (Final)

- categories: self tree (parent_id).
- products → categories, sellers, brands (many-to-one).
- brands ↔ categories: brand_categories (many-to-many).
- attributes: standalone.
- attribute_values → attributes (one-to-many).
- category_attribute_schema: (category_id, attribute_id) many-to-many with config.
- product_attributes: (product_id, attribute_id) + value; product → many attribute values.
- product_raw_attributes: product_id → product (one-to-many).
- attribute_key_mapping: donor_key → attribute_id.
- attribute_synonyms, attribute_canonical: attribute_id → attribute.

### 7.3 Parser Integration (Summary)

- Parser produces raw product + raw key-value list. Catalog upserts product (status draft or pending_moderation), writes product_raw_attributes. Normalization pipeline: key mapping → value canonical → value synonym → write product_attributes. Moderation step (CRM/Admin): approve or reject; on approve set moderation_status = approved and status = active. Published products appear in storefront and category/filter APIs. Facets built from product_attributes (category_id, attribute_id, value) for active products.

### 7.4 Attribute System (Summary)

- **Definitions:** attributes table (key, display_name, data_type). Optional attribute_values for enum.
- **Key normalization:** attribute_key_mapping (donor key → attribute_id).
- **Value normalization:** attribute_canonical (raw_value → normalized_value) first; then attribute_synonyms (word → normalized_value). Store result in product_attributes.value.
- **Per category:** category_attribute_schema defines which attributes the category has, display/filter order, filter_type, preset_values. Filters and facets read from product_attributes + category_attribute_schema.

### 7.5 Moderation Pipeline (Summary)

- New/updated from parser: products.moderation_status = pending_moderation (or draft). Moderation UI lists these; operator approves (→ approved, status → active) or rejects (→ rejected). Optional: edit product or product_attributes then approve. Only products with moderation_status = approved and status = active are visible in public catalog and filters.

---

*End of Catalog Architecture Design.*

# Attribute Engine Architecture

**Document type:** Design and analysis of the marketplace attribute system (no code)  
**Audience:** Catalog architect, backend/frontend leads, CRM product  
**Context:** Builds on CATALOG_ARCHITECTURE_V2.md; focuses on attributes, normalization, category schema, filter performance, and moderation.

---

## STEP 1 — ANALYZE ATTRIBUTE SYSTEM

### 1.1 Tables Involved

**attributes**

- Global registry of attribute **definitions**. Each row is one semantic attribute the system knows (e.g. color, size, material, brand, power).
- Columns (from catalog design): id, key (unique, e.g. `color`), display_name (e.g. Цвет), data_type (text | number | enum | range), unit (optional), searchable, filterable, created_at, updated_at.
- **Role:** Single source of truth for “what attributes exist.” Referenced by attribute_key_mapping, attribute_synonyms, attribute_canonical, category_attribute_schema, product_attributes. No per-category or per-product data here.

**attribute_values**

- Optional **canonical value registry** for enum-like attributes. Lists allowed or preferred values per attribute (e.g. color: Красный, Синий, Зелёный; size: 42, 44, 46).
- Columns: id, attribute_id, value (canonical string or number), sort_order, display_label (optional). Unique (attribute_id, value) typically.
- **Role:** Constrain and sort values for filters and PDP; product_attributes.value can store this value string or FK to attribute_values.id. Reduces free-text proliferation for enum attributes.

**attribute_key_mapping**

- Maps **donor key strings** to **attribute_id**. Donor sends keys like “цвет”, “Цвет”, “Color”; mapping normalizes them to one attribute (e.g. color).
- Columns: donor_key (normalized for match, e.g. lowercased), attribute_id. Unique on donor_key (or per attribute_id depending on design).
- **Role:** First step of normalization: raw key from parser → internal attribute. Without it, every donor key variant would become a different attribute or fail to match.

**attribute_synonyms**

- Maps **word or phrase** → **normalized_value** per attribute. Used when the raw value is a token or phrase that should display as one canonical value (e.g. word “red” → “Красный”, “алый” → “Красный”).
- Columns: id, attribute_id, word (normalized form for matching), normalized_value, priority (optional), created_at, updated_at.
- **Role:** Value normalization when full-string canonical is not present. Matching is typically token or phrase based; multiple words can map to one normalized_value. Scope is per attribute_id.

**attribute_canonical**

- Maps **full raw value string** → **normalized_value** per attribute. Example: raw_value “красный.” → normalized_value “Красный”.
- Columns: id, attribute_id, raw_value (normalized for lookup, e.g. trimmed/lowercased), normalized_value, created_at, updated_at. Unique (attribute_id, raw_value).
- **Role:** Exact full-string normalization. Takes precedence over synonyms in the recommended order (canonical first, then synonym). Grows from real donor data and manual fixes.

**category_attribute_schema**

- Links **catalog category** to **attribute** and defines how the attribute is used in that category (display order, filter order, filter type, required, preset values).
- Columns: catalog_category_id, attribute_id, required, display_order, filter_order, display_label (override), filter_type (checkbox | select | range | radio | multiselect), is_filterable, is_searchable, range_min, range_max, preset_values (JSON or FK). Unique (catalog_category_id, attribute_id).
- **Role:** Which attributes appear in which category; how they are shown and filtered. Storefront and filter API read this; product_attributes are constrained by category only indirectly (product belongs to one category; schema says “this category has these attributes”).

**product_attributes**

- Per-product **normalized** attribute values. One row per (product, attribute) or per (product, attribute, value) if multi-valued.
- Columns: product_id, attribute_id, value (string or number or FK attribute_values.id), catalog_category_id (denormalized from product.category_id), raw_value (optional audit), confidence (optional), source (parser | manual | import), created_at, updated_at. Indexes: (product_id, attribute_id), (catalog_category_id, attribute_id, value).
- **Role:** Stored output of the normalization pipeline; used for filters, facets, search, and PDP. Denormalized catalog_category_id avoids joining to products for every filter query.

**product_raw_attributes**

- Staging: **raw** key-value from donor before normalization. Immutable “what the donor said.”
- Columns: id, product_id, source (parser), attr_key (raw), attr_value (raw), created_at.
- **Role:** Audit trail and re-normalization. When synonym/canonical/key mapping changes, re-run normalization from product_raw_attributes without re-parsing. Optional but recommended for large catalogs.

### 1.2 Normalization Pipeline (Current Design)

**Input:** Parser (or manual input) provides a list of raw key-value pairs, e.g. from product page characteristics: `[{ key: "цвет", value: "красный." }, { key: "размер", value: "42" }]`.

**Step 1 — Persist raw (optional)**  
Write each (product_id, attr_key, attr_value) to **product_raw_attributes**. No transformation.

**Step 2 — Key normalization**  
For each raw key, normalize for lookup (e.g. trim, lowercase). Look up **attribute_key_mapping** by donor_key → attribute_id. If not found, the raw key is **unmapped**: either skip this pair, or create a “pending attribute” for moderation; do not create attribute_id automatically in the main attributes table without governance. Output: (attribute_id, raw_value).

**Step 3 — Value cleanup**  
Trim and normalize spaces on raw_value; optional lowercasing for lookup only (display keeps original casing after canonical/synonym resolution).

**Step 4 — Canonical lookup**  
Look up **attribute_canonical** by (attribute_id, raw_value). If a row exists, use its normalized_value and **stop** value normalization for this pair. Otherwise continue.

**Step 5 — Synonym lookup**  
Tokenize or split raw_value (e.g. by comma, space, or phrase list). For each token or phrase, look up **attribute_synonyms** by (attribute_id, word). If exactly one match, use that normalized_value. If multiple matches, use priority or longest match. If no match, use **cleaned raw_value** as normalized_value (or mark needs_review). Output: normalized_value.

**Step 6 — Store normalized**  
Write to **product_attributes**: (product_id, attribute_id, value = normalized_value, catalog_category_id = product.category_id, optional raw_value, confidence). If attribute has **attribute_values** and normalized_value does not match any, either store anyway (free text) or create/link to attribute_values depending on policy.

**Extraction path (title/description):** If attributes are extracted from title/description via regex/keyword rules (attribute_rules in current system), the extractor output is (attribute_key, raw_value). That output is then fed into the same pipeline from Step 2 (key mapping) or Step 3 (value cleanup) onward. So extraction does not bypass key mapping or value normalization.

**Re-run:** To re-normalize after synonym/canonical/key mapping changes, read from **product_raw_attributes** (or product.characteristics if raw not stored), then run Steps 2–6 for each row; overwrite or merge into **product_attributes**.

---

## STEP 2 — FIND POTENTIAL PROBLEMS

### 2.1 Attribute Explosion

**Risk:** New donor keys or free-text values create new attributes or new attribute_values without control, leading to thousands of attribute keys or value variants. Filters become unusable; schema and UI bloat.

**Causes:**  
- attribute_key_mapping is populated automatically for every new donor key (if the design allows “create attribute on first seen key”).  
- No approval step for new attributes.  
- attribute_values for enum types are created on the fly from product_attributes.value.  
- Parser sends hundreds of one-off keys (e.g. “особенность 1”, “особенность 2”) that are not real semantic attributes.

**Edge cases:**  
- Donor adds a new column “цвет корпуса” that should map to existing attribute “color” but is instead created as a new attribute.  
- Same attribute appears under different keys per category on donor (e.g. “размер” in shoes, “размер (см)” in furniture); without key mapping, two attributes.  
- Free-text attribute (e.g. “примечание”) receives thousands of unique values → filter list too long and slow.

**Mitigation (design):** Do not auto-create attributes from donor keys. Unmapped keys go to a **pending_key** or **raw_key_audit** table; catalog team or CRM creates attribute and attribute_key_mapping. Limit auto-creation of attribute_values to a controlled flow (e.g. suggest from product_attributes, moderator approves). Cap or separate “display-only” attributes (not filterable) so they do not drive filter explosion.

### 2.2 Inconsistent Attribute Keys

**Risk:** Same semantic attribute appears under multiple attribute keys (e.g. color vs colour vs цвет), or one key maps to different attributes in different contexts, causing duplicate filters and inconsistent behavior.

**Causes:**  
- attribute_key_mapping has typos or multiple donor_key rows mapping to different attribute_id (should be unique on donor_key).  
- Key mapping is case-sensitive or not normalized, so “Color” and “color” map differently.  
- Extraction rules (attribute_rules) emit attribute_key that does not match the key in attributes table (e.g. rule outputs “body_color”, attributes has “color”).

**Edge cases:**  
- Donor changes key from “цвет” to “Цвет” and key mapping only has “цвет” → color; “Цвет” is unmapped.  
- Two attributes “color” and “colour” both exist; donor sends “colour”; only one is in key mapping; the other attribute is never populated.  
- Category-specific key mapping (e.g. “color” in Shoes vs “body color” in Electronics) is not in the current design; key mapping is global, so one key always maps to one attribute.

**Mitigation:** Normalize donor_key on write and lookup (e.g. lowercased, trimmed). Single mapping per donor_key → one attribute_id. Governance: only one “color” attribute; all donor variants map to it. If category-specific semantics are required, consider category-scoped key mapping (donor_key, catalog_category_id → attribute_id) or separate attribute definitions per category (heavier).

### 2.3 Category-Specific Attributes

**Risk:** Same key means different things in different categories (e.g. “размер” = shoe size vs clothing size vs dimensions), but the model has one global attribute “size.” Values from different categories mix in filters; or one category needs an attribute that does not exist globally.

**Causes:**  
- attributes and attribute_key_mapping are global. category_attribute_schema only “assigns” existing attributes to categories; it does not define category-specific semantics.  
- Donor uses “размер” for both shoes (42, 43) and clothes (M, L); one attribute “size” with mixed value sets; filter shows “42” and “M” together.  
- Some categories need “voltage” or “power”; others do not. That is already handled by category_attribute_schema (only relevant categories get the attribute). But display_label override may not be enough when the **meaning** differs (e.g. “size” in Shoes = “Shoe size”, in Furniture = “Dimensions”).

**Edge cases:**  
- Merging two donor categories into one catalog category that have different attribute sets; products bring both sets, schema must list all.  
- Inheriting schema from parent category: child adds one attribute; parent’s attribute “size” might mean something different in child (e.g. “Ring size” vs “Clothing size”).  
- Filter preset_values: category A wants only [42, 43, 44], category B wants [S, M, L]; both use attribute “size”; preset_values in category_attribute_schema handle this, but value normalization must not merge “42” and “S” into one.

**Mitigation:** Keep one global attribute for “size”; use **attribute_values** or **preset_values** per category to restrict which values appear in which category. Use display_label in category_attribute_schema to differentiate “Размер обуви” vs “Размер одежды.” If semantics truly differ (e.g. shoe size vs dimensions), use two global attributes (e.g. shoe_size, dimensions) and map donor “размер” to the correct one by **donor category** or context (e.g. category-scoped key mapping).

### 2.4 Filter Performance

**Risk:** Filter and facet queries become slow when product_attributes is large (millions of rows), when many attributes are filterable, or when facets are computed on the fly for every category page load.

**Causes:**  
- product_attributes scanned without proper indexes (catalog_category_id, attribute_id, value).  
- Facets computed with GROUP BY value per attribute per category at request time.  
- Multiple filter dimensions (e.g. color + size + brand) cause multiple IN (product_id) subqueries and large intermediate sets.  
- No materialized or cached facet counts; every page load hits the DB.

**Edge cases:**  
- Category with 50 filterable attributes and 100k products; building 50 facet lists with counts in one request is expensive.  
- Deep category tree: “all products in category and descendants” for facet scope multiplies product set.  
- Range filters (price, weight) without numeric index or precomputed buckets.

**Mitigation:** Index product_attributes (catalog_category_id, attribute_id, value) and (product_id, attribute_id). Consider **materialized facet table** or **aggregate table**: (catalog_category_id, attribute_id, value, product_count), updated by job after product/attribute changes. Filter application: resolve selected filters to (attribute_id, value) list; query product_attributes for matching (product_id) then intersect; or use a filter index (e.g. bitmap or inverted index) for product_ids by (catalog_category_id, attribute_id, value). Cache facet payload per category (and invalidate on catalog update). Limit number of filterable attributes per category in UI; lazy-load facet values for “more.”

### 2.5 Duplicate Values

**Risk:** Semantically identical values stored as different strings (e.g. “Красный”, “красный”, “КРАСНЫЙ”, “Red”) so filters show duplicates and counts are fragmented.

**Causes:**  
- Canonical and synonym tables do not cover all variants; new donor value passes through as “cleaned raw” and is stored as-is.  
- Case or Unicode normalization differs between lookup and store (e.g. canonical lookup lowercased, but stored value is original case).  
- Multi-word values: “dark red” vs “Dark Red” vs “тёмно-красный”; only one has a canonical/synonym entry.

**Edge cases:**  
- Synonym A: “red” → “Красный”; synonym B: “red” → “Red” (typo in normalized_value); same word maps to two display values.  
- Canonical “красный” → “Красный”; raw “Красный” has no canonical row; stored as “Красный” (same) but another product has “красный” → “Красный”; so two forms in DB if cleanup is inconsistent.  
- Numeric values: “42” vs “42.0” vs “42,0”; stored as text; duplicate facets.

**Mitigation:** Store normalized_value in a **consistent form** (e.g. always one casing, one Unicode form). When writing product_attributes, always resolve via canonical then synonym; never store raw unless explicitly “unmapped raw.” Uniqueness: for enum attributes, store only values that exist in attribute_values, or run a periodic job to merge duplicate values (suggest merge in CRM, then update product_attributes and canonical/synonym). Idempotent normalization: same raw input always yields same normalized value (deterministic order of canonical vs synonym, priority rules).

### 2.6 Synonym Conflicts

**Risk:** Two synonyms map the same word to different normalized values (e.g. “red” → “Красный” and “red” → “Рыжий”); or one normalized value has many words that are not synonyms in all contexts (e.g. “black” and “dark” both → “Тёмный”).

**Causes:**  
- No unique constraint on (attribute_id, word) in attribute_synonyms; duplicate words with different normalized_value.  
- Priority or “first match” is undefined; non-deterministic result.  
- Cross-attribute pollution: synonym table keyed only by attribute_id; if word is reused for another attribute (e.g. “orange” for color vs fruit type), same word must map to different normalized values per attribute (already scoped by attribute_id; ensure no shared synonym set across attributes).

**Edge cases:**  
- Moderator adds “red” → “Рыжий” for one product type; existing “red” → “Красный” remains; both match; order or priority decides which wins.  
- Phrase “dark red”: token “dark” → “Тёмный”, “red” → “Красный”; combining logic (e.g. “Тёмно-красный”) may be missing; stored as one or the other or concatenated incorrectly.  
- Long phrase: “светло-серый с голубым оттенком”; no phrase synonym; token synonyms produce multiple values; multi-value attribute may store both, or only first.

**Mitigation:** Unique (attribute_id, word) in attribute_synonyms; one word → one normalized_value per attribute. Add **priority** (integer) to synonyms; higher priority wins when multiple phrase matches. Moderation UI: warn when adding a synonym whose word already exists for that attribute (show current normalized_value and let moderator replace or cancel). For phrases, support phrase-level synonyms (word column stores full phrase) and match longest phrase first. Regular audit: report words that map to more than one normalized_value (should not happen if unique enforced).

---

## STEP 3 — DESIGN ATTRIBUTE ENGINE

### 3.1 Attribute Lifecycle

**Created (draft)**

- New attribute is created in **attributes** with status **draft** or **pending_approval**. Key, display_name, data_type are set. Not yet linked in category_attribute_schema; not used in key mapping for production normalization. Optional: **attribute_suggestions** or **pending_attribute_keys** table stores donor keys that suggested this attribute (e.g. “цвет корпуса” seen 100 times → suggestion “create attribute body_color or map to color”).

**Approved (active)**

- Status set to **active**. Attribute can be added to category_attribute_schema, added to attribute_key_mapping, and used in normalization. product_attributes can reference it. Filters and facets include it when category_attribute_schema says so.

**Deprecated**

- Status **deprecated**. No new product_attributes rows should use it; existing rows remain. New key mappings must not point to it. Category schema can remove it; filter UI hides it. Used for migration (e.g. merge “colour” into “color” then deprecate “colour”).

**Deleted (soft or hard)**

- Soft: status **deleted**; rows kept for history. Hard: remove from attributes and cascade or null product_attributes. Prefer soft to avoid breaking historical data. If deleted, attribute_key_mapping rows pointing to it must be removed or reassigned.

**Lifecycle transitions:** Only catalog admin or CRM with permission can create/approve/deprecate/delete. Parser and normalization never create attributes; they only use existing active attributes via key mapping.

### 3.2 Attribute Definitions (attributes table)

**Governed fields**

- **id, key (unique), display_name, data_type (text | number | enum | range), unit (optional), searchable, filterable.** Optional: **value_type** (single | multi) for multi-value attributes (e.g. color: red, blue). **status** (draft | active | deprecated | deleted). **created_at, updated_at, created_by.**

**Constraints**

- key is immutable after approval (or use versioning if key can change). data_type drives validation: enum → value should exist in attribute_values or be accepted as free text; number → numeric validation; range → min/max or two columns.  
- **attribute_values** is populated for enum-like attributes; product_attributes.value for that attribute_id should reference attribute_values.value or attribute_values.id to avoid free-text explosion. Optional policy: “enum attribute only accepts values from attribute_values”; unknown values go to needs_review or pending_value queue.

**Discovery**

- **Pending keys:** Donor keys that do not match attribute_key_mapping can be stored (e.g. raw_key, first_seen_at, product_count). Catalog team reviews and either creates new attribute + key mapping or maps to existing attribute.  
- **Suggested values:** From product_attributes or product_raw_attributes, suggest new attribute_values or new canonical/synonym rows (e.g. “value ‘красный’ appears 500 times for attribute color with no canonical; suggest canonical row”).

### 3.3 Value Normalization

**Single path**

- Raw value → cleanup → **canonical lookup (attribute_id, raw_value)** → if found, use normalized_value and stop.  
- Else **synonym lookup (attribute_id, token/phrase)** → if found, use normalized_value.  
- Else use **cleaned raw** as normalized_value and optionally set **needs_review** or write to **pending_value_review** (attribute_id, raw_value, product_count) for moderator to add canonical or synonym.  
- Store in product_attributes only the **normalized_value** (and optional raw_value for audit). Same raw always yields same normalized (idempotent).

**Canonical table growth**

- Populate from moderator actions and from “suggest” job: distinct raw values from product_raw_attributes or product_attributes.raw_value grouped by attribute_id, with count; moderator approves “raw_value X → normalized_value Y” and row is added to attribute_canonical.  
- Normalize raw_value for lookup (trim, lowercase, Unicode NFC) and store normalized form in attribute_canonical.raw_value so lookup is consistent.

**Synonym table**

- One row per (attribute_id, word) → normalized_value. word normalized (lowercase, no trailing punctuation). Priority column for conflict resolution when multiple phrase matches exist. Phrase synonyms: word column stores full phrase; match longest phrase first, then token.  
- Moderation: when adding a synonym, check duplicate word; suggest merging to one normalized_value.

**Enum attributes**

- If attribute.data_type = enum and attribute_values exist, after normalization check if normalized_value is in attribute_values for that attribute_id. If not, either store anyway and flag for review, or create pending_attribute_value (attribute_id, value, product_count) for moderator to add to attribute_values or create canonical/synonym. This keeps filter value set under control.

### 3.4 Category Attribute Schema

**Scope**

- **category_attribute_schema** links **catalog_category_id** to **attribute_id**. Only active attributes can be added. One row per (catalog_category_id, attribute_id). Defines: required, display_order, filter_order, display_label (override), filter_type, is_filterable, is_searchable, range_min, range_max, preset_values.

**Preset values**

- For enum attributes, preset_values can restrict which values appear in the filter for this category (e.g. only sizes 42–46). Stored as JSON array of value strings or array of attribute_values.id. Facet query returns only these values (and their counts). If preset_values is null, facet returns all values that appear in product_attributes for this category and attribute (with optional min_count).

**Inheritance (optional)**

- Child category can inherit parent’s schema; override display_order, filter_type, or add attributes. Resolve “effective schema” by walking tree and merging; child overrides parent for same attribute_id. Adds complexity; recommend explicit schema per category for clarity unless tree is very deep.

**Validation**

- When saving product_attributes, product.category_id determines category. Optional: validate that attribute_id is in category_attribute_schema for that category (warning only for parser; strict for manual edit). Prevents attributes from “wrong” category leaking into filters if schema is strict.

### 3.5 Filter Indexing

**Product-side index**

- **product_attributes:** Composite index (catalog_category_id, attribute_id, value). Filter “category C and attribute A = V” is an index seek. For multiple attributes, intersect product_id sets (e.g. product_id IN (…) for color=Красный) AND product_id IN (…) for size=42). Covering index can include product_id to avoid table lookup.

**Facet materialization**

- **Table: attribute_facets** (optional): (catalog_category_id, attribute_id, value, product_count, updated_at). Updated by batch job after product or product_attributes change (e.g. nightly or on product save for affected category). Category page reads attribute_facets instead of GROUP BY product_attributes; fast and stable. Invalidation: when product_attributes or products in that category change, mark category for facet rebuild.

**Filter application**

- User selects filters: [(attribute_id, value), …]. Query: product_attributes where (catalog_category_id, attribute_id, value) in selected list, grouped by product_id having count = number of selected filters (for AND). Return product_ids; then fetch products. Or: start from products where category_id = C and status = active, join product_attributes, filter by (attribute_id, value) in list; use indexes.  
- Range filters: (attribute_id, value_numeric) or (attribute_id, value_min, value_max). Index on (catalog_category_id, attribute_id, value_numeric) for range queries.

**Search integration**

- Full-text search on products (title, description) plus optional attribute text. product_attributes.value (text attributes) can be concatenated into a search document or separate full-text index keyed by product_id. Structured filters (attribute_id = value) applied as post-filter or in query. Faceted search: facets computed over result set (product_ids from search) ∩ product_attributes; can be expensive; cache or limit facet attributes.

---

## STEP 4 — ATTRIBUTE MODERATION

### 4.1 New Attributes

**Source**

- **Pending keys:** Donor keys that could not be mapped (no attribute_key_mapping). Stored in pending_attribute_keys (donor_key, first_seen_at, last_seen_at, product_count, sample_product_ids). CRM list: “Unmapped donor keys”; moderator can “Create new attribute” or “Map to existing attribute.”

**Create new attribute**

- Moderator creates row in **attributes**: key, display_name, data_type, status = draft. Then add **attribute_key_mapping** (donor_key → attribute_id). Optionally add to **attribute_values** if enum and initial set is known. Set status = active when ready. Re-run normalization for products that had this raw key so product_attributes is filled.  
- **Map to existing:** Moderator selects existing attribute; add attribute_key_mapping (donor_key → attribute_id). No new attribute. Re-run normalization for affected products.

**Governance**

- Only users with “attribute.manage” or “catalog.attributes” permission can create/approve attributes. Audit log: who created which attribute and when. Optional: two-step approval (create draft → second reviewer approves).

### 4.2 New Attribute Values

**Source**

- **Pending values:** Raw values that passed through as “cleaned raw” (no canonical, no synonym) and were stored in product_attributes. Report: distinct (attribute_id, value) with product_count where value not in attribute_values (for enum attributes) or where value looks new (e.g. never seen in attribute_canonical). Table: pending_attribute_values (attribute_id, value, product_count, suggested_normalized_value).

**Actions**

- **Add to attribute_values:** For enum attribute, moderator adds (attribute_id, value, sort_order). Now this value is “canonical” for filters. No change to product_attributes if value already stored as-is.  
- **Add canonical:** Moderator adds attribute_canonical (attribute_id, raw_value, normalized_value). Future normalizations will map this raw to normalized. Optionally run re-normalization for products that have this raw value so they get the normalized form.  
- **Add synonym:** Moderator adds attribute_synonyms (attribute_id, word, normalized_value). Same as above for future and re-run.  
- **Merge:** If “красный” and “Красный” are both in product_attributes, moderator chooses canonical “Красный”, adds canonical row “красный” → “Красный”, then re-normalize so all become “Красный”. Or bulk update product_attributes set value = 'Красный' where attribute_id = X and value = 'красный'.

### 4.3 Conflicting Values

**Detection**

- **Same word, different normalized_value in synonyms:** Enforce unique (attribute_id, word); UI prevents second insert or shows warning “Word already maps to X; replace?”  
- **Same raw_value, different normalized_value in canonical:** Unique (attribute_id, raw_value) prevents this.  
- **Two product_attributes values that should be one:** Report “value variants” by attribute_id: group by normalized form (e.g. lowercased); if multiple forms exist (e.g. “Красный”, “красный”), list them and product counts; moderator picks one canonical, adds canonical/synonym, re-normalizes.

**Resolution**

- Moderator chooses “winning” normalized value. Add or fix canonical/synonym so all raw variants map to it. Run re-normalization job for affected attribute and products. Optional: bulk update product_attributes for that attribute_id to replace old value with winning value (if no re-normalization from raw).

### 4.4 Suggested Synonyms

**Source**

- **From raw data:** Job that scans product_raw_attributes or product_attributes.raw_value; for each (attribute_id, raw_value) with no canonical row, suggest “add canonical raw_value → raw_value (trimmed)” or “add synonym word: raw_value → existing attribute_values.value.” Store in **suggested_synonyms** (attribute_id, raw_value, suggested_type: canonical | synonym, suggested_normalized_value, product_count).  
- **From moderator:** On product detail or attribute audit, moderator sees raw value “red” and can click “Add synonym: red → [choose from attribute_values or type].”

**Workflow**

- CRM queue: “Suggested synonyms” list. Moderator approves (creates attribute_canonical or attribute_synonyms row) or rejects. Optional: auto-approve when confidence is high (e.g. same value suggested 100+ times and matches an existing attribute_values.value).  
- After approval, re-normalization job can run for that attribute so product_attributes gets updated. Facet rebuild for affected categories.

---

## STEP 5 — FINAL ATTRIBUTE ARCHITECTURE

### 5.1 Table Summary

| Table | Purpose |
|-------|---------|
| **attributes** | Global attribute definitions (key, display_name, data_type, status). Governed; parser does not create. |
| **attribute_values** | Canonical value set for enum attributes. Optional; constrains and orders filter values. |
| **attribute_key_mapping** | Donor key → attribute_id. Single mapping per donor_key; normalized lookup. |
| **attribute_synonyms** | (attribute_id, word) → normalized_value. Unique (attribute_id, word). Priority for phrase conflicts. |
| **attribute_canonical** | (attribute_id, raw_value) → normalized_value. Full-string normalization; checked first. |
| **category_attribute_schema** | (catalog_category_id, attribute_id) + display/filter config. Which attributes per category and how. |
| **product_attributes** | (product_id, attribute_id, value, catalog_category_id). Normalized output; indexed for filters. |
| **product_raw_attributes** | (product_id, raw_key, raw_value). Audit and re-normalization input. |
| **pending_attribute_keys** (optional) | Unmapped donor keys for moderator to map or create attribute. |
| **pending_attribute_values** (optional) | New or conflicting values for moderator to add canonical/synonym or merge. |
| **attribute_facets** (optional) | Materialized (catalog_category_id, attribute_id, value, product_count) for fast facet API. |

### 5.2 Pipeline Summary

1. **Raw** → product_raw_attributes (optional).  
2. **Key** → attribute_key_mapping(donor_key) → attribute_id; unmapped → pending_attribute_keys.  
3. **Value** → cleanup → attribute_canonical(attribute_id, raw_value) → if found, use; else attribute_synonyms(attribute_id, word) → if found, use; else use cleaned raw, optionally pending_value_review.  
4. **Store** → product_attributes(product_id, attribute_id, value, catalog_category_id).  
5. **Re-run** from product_raw_attributes when canonical/synonym/key mapping change.

### 5.3 Governance and Moderation

- **Attributes:** Create/approve/deprecate only via admin/CRM; no parser creation.  
- **Key mapping:** Add only for existing active attributes; unmapped keys go to pending.  
- **Canonical and synonyms:** Add/edit via CRM; suggested synonyms queue; conflict resolution by unique constraints and moderator merge.  
- **Attribute values (enum):** Add via CRM; optional pending_value_review for values not in attribute_values.  
- **Category schema:** Only catalog admin; which attributes are filterable and how per category.

### 5.4 Performance and Scale

- **Indexes:** product_attributes (catalog_category_id, attribute_id, value), (product_id, attribute_id). attribute_canonical, attribute_synonyms by (attribute_id, raw_value / word).  
- **Facets:** Materialize attribute_facets per category; update on catalog change or batch.  
- **Filter query:** Use product_attributes index; intersect product_id sets for multi-select; limit filterable attributes per category in UI.  
- **Re-normalization:** Batch job by attribute_id or product_id range; do not block parser.

### 5.5 Edge Cases Handled

- **New donor key:** Unmapped → pending_attribute_keys; moderator maps or creates attribute.  
- **New donor value:** No canonical/synonym → store cleaned raw; optional pending_value_review; moderator adds canonical/synonym and re-runs.  
- **Duplicate value variants:** Report and merge; canonical/synonym + re-normalize.  
- **Synonym conflict:** Unique (attribute_id, word); priority for phrase; moderation warning on duplicate word.  
- **Category-specific meaning:** display_label override; preset_values; or separate global attributes (e.g. shoe_size vs dimensions) with category-scoped key mapping if needed.  
- **Filter performance:** Denormalized catalog_category_id; materialized facets; indexed product_attributes.

---

*End of Attribute Engine Architecture.*

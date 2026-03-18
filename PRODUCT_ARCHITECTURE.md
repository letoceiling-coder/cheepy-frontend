# Product Architecture

**Document type:** Product system design for the marketplace (no code)  
**Audience:** Catalog architect, backend/frontend leads  
**Context:** Builds on CATALOG_ARCHITECTURE_V2.md (dual categories, mapping) and ATTRIBUTE_ENGINE_ARCHITECTURE.md (attributes, normalization). Focus: product entity, variants, price, stock, media, status, parser integration, and scalability.

---

## STEP 1 — ANALYZE CURRENT PRODUCT MODEL

### 1.1 Products Table (Current)

**Identity and source**

- **id** (PK), **external_id** (unique, from donor URL). Product is identified externally by donor URL or slug; internal id is surrogate.
- **source_url**, **source_link**, **source_published_at** — donor provenance.

**Core content**

- **title** — product name.
- **price** (display string, e.g. "1 990 ₽"), **price_raw** (numeric) — single price on the product row. No separate price table or variant-level price.
- **description** — long text.

**Relations**

- **category_id** → categories (in V2: **catalog_categories** for marketplace placement).
- **donor_category_id** (optional in V2) → donor_categories (traceability).
- **seller_id** → sellers (many-to-one; product belongs to one seller).
- **brand_id** → brands (many-to-one; nullable).

**Denormalized / parser-specific**

- **category_slugs** (JSON array) — donor category path.
- **color** (varchar), **size_range** (varchar) — single columns on product; no variant table. Multi-value or structured options (e.g. several sizes with separate stock/price) are not modeled.
- **characteristics** (JSON) — raw key-value from donor; feeds attribute extraction and product_attributes.

**Status and visibility**

- **status** — active | hidden | excluded | error | pending. Visibility and parser/error state mixed in one field.
- **is_relevant** — relevance flag.
- **parsed_at** — last parse time. No explicit **moderation_status** (draft | pending_moderation | approved | rejected) in the described schema; moderation is implied in flow, not in table.

**Media**

- **photos_count**, **photos_downloaded** — counters. Actual media in **product_photos**: product_id, original_url, local_path, download_status, is_primary, sort_order. One table for all photos; no separation of “product-level” vs “variant-level” images if variants are introduced later.

**Timestamps**

- **created_at**, **updated_at**.

### 1.2 Product Attributes (Current)

- **product_attributes:** product_id, attribute_id (or attr_name in legacy), attr_value, attr_type; in V2 also **catalog_category_id** (denormalized) for filter indexes. Normalized output of the attribute engine; used for filters, facets, PDP.
- **product_raw_attributes:** product_id, raw key, raw value — staging for re-normalization (optional).
- **Relationship:** Product has many product_attributes rows. Attributes are shared across products via attributes table; category_attribute_schema defines which attributes apply to the product’s category. No variant-level attributes in current model (all at product level).

### 1.3 Brands (Current)

- **brands:** id, name, slug, logo_url, status, seo_title; **category_ids** (JSON) — list of category IDs. Product has brand_id → brands. Brand–category is many-to-many in concept but stored as JSON; no brand_categories junction in current DB (in V2 design, brand_categories exists). No product_variant–brand; brand is at product level only.

### 1.4 Sellers (Current)

- **sellers:** id, slug, name, source_url, pavilion, contacts, status, is_verified, products_count, last_parsed_at. Product has seller_id → sellers. One product → one seller. Seller “owns” the product in the sense of listing source; no separate concept of “seller SKU” or “offer” table. products_count is maintained on seller.

### 1.5 Categories (Current / V2)

- **Current (single table):** product.category_id → categories. Category has tree (parent_id), slug, parser fields.
- **V2:** product.**category_id** → **catalog_categories** (marketplace placement); product.**donor_category_id** → **donor_categories** (optional, source of parse). Category mapping is donor_category_id → catalog_category_id; product is always placed in a catalog category for storefront and filters.

### 1.6 Current Relationships (Summary)

```
products
  ├── category_id      → catalog_categories (marketplace)
  ├── donor_category_id→ donor_categories   (optional, parser source)
  ├── seller_id        → sellers            (one seller per product)
  ├── brand_id         → brands            (one brand per product)
  ├── product_attributes (many rows: product_id, attribute_id, value)
  ├── product_raw_attributes (many rows: product_id, raw key/value)
  └── product_photos   (many rows: product_id, url, path, sort_order)

brands ↔ catalog_categories: brand_categories (many-to-many in V2)
category_attribute_schema: catalog_category_id, attribute_id (which attributes per category)
```

- **Product** is the single unit of sale: one row = one purchasable entity in the current model. There is no **product_variants** table; color/size are columns or attribute values, not separate sellable SKUs with their own price or stock.
- **Stock** is not modeled in the current schema (no inventory table).
- **Price** is on the product row only; no history, no currency table, no variant-level price.
- **Media** is product_photos only; no explicit “variant image” or “media type” (e.g. video, 360).

---

## STEP 2 — IDENTIFY PRODUCT MODEL PROBLEMS

### 2.1 Product vs Variant

**Problem:** One product row represents one listing. If the same “product” has multiple sizes or colors, the current design either (a) stores one row per size/color combination (product explosion: “T-shirt Red S”, “T-shirt Red M”, … each with own external_id), or (b) stores one product with color/size as attributes and no separate sellable SKU. (a) duplicates title, description, seller, category; complicates deduplication and grouping. (b) does not support per-variant price, stock, or image; cart and order need “variant” but it does not exist as an entity.

**Scalability risk:** With (a), product count grows with variants; listing pages and search return many “products” that are the same logical item. With (b), checkout and inventory cannot be accurate if price or stock differ by size/color. A proper **product + product_variants** model is missing: one product (parent) with shared content, many variants (SKUs) with optional variant-level price, stock, and media.

### 2.2 Stock Storage

**Problem:** No **product_stock** or **inventory** table. Quantity on hand, reserved quantity, and warehouse/seller-level stock are not represented. Parser-driven catalogs may not expose stock; but for order creation and fulfillment, stock must be decremented and checked. Without it, oversell is inevitable when orders are implemented.

**Scalability risk:** When stock is added later, it must be at variant level (per SKU) or at product level (if no variants). High-volume updates (order placement, returns, restock) need indexes and possibly a dedicated inventory service; current schema has no place for this.

### 2.3 Price Structure

**Problem:** **price** and **price_raw** on product only. No list price vs sale price, no currency table, no price history, no per-variant price. No effective_date or price list id. Promotions and “was/now” pricing are hard to model. Multi-currency or B2B price lists cannot be added cleanly.

**Scalability risk:** Price changes overwrite the same columns; no audit trail. If variants are added, price must move to variant or to a separate price table keyed by product (and optionally variant). Bulk price updates and price rules (e.g. by customer segment) need a structured price model.

### 2.4 Media Storage

**Problem:** **product_photos** holds URL, local_path, sort_order, is_primary. No link to variant (e.g. “this image is for color Red”). No media type (image vs video vs 360). No alt text or locale. Large volume (2M+ rows in production); retention and CDN policy not defined in schema. If variants are introduced, “which image for which variant” is unclear.

**Scalability risk:** Table and storage grow with products and photos; queries “photos for product” are simple, but “primary photo for 100k products” for listing pages may need covering index or materialized thumbnail URL. Variant-level media would require product_photos.variant_id or a separate variant_media table.

### 2.5 Seller Ownership

**Problem:** Product has seller_id; seller is parser-derived. No “offer” or “listing” abstraction: the product row is the listing. If the same physical item is sold by multiple sellers (marketplace model), current schema does not support it (one product_id → one seller_id). No seller-specific price or stock; no “offer_id” for orders to reference. Seller is effectively “source of the parsed listing,” not “merchant who owns this offer.”

**Scalability risk:** Multi-seller marketplace would require product_offers (product_id, seller_id, price, stock, status) or similar; orders would reference offer_id. Current design is single-seller per product.

### 2.6 Product Status

**Problem:** **status** mixes visibility (active, hidden), parser/error state (error, pending), and exclusion (excluded). **moderation_status** (draft, pending_moderation, approved, rejected) is not a column in the current schema; flow describes moderation but the table does not. So “is this product visible?” depends on status; “has it passed moderation?” is implicit or in another system. Two concerns in one field or missing.

**Scalability risk:** Filtering “active and approved” products for storefront requires clear semantics. Status transitions (e.g. approved → hidden for policy) should not be confused with moderation. Separate **visibility_status** and **moderation_status** (or **workflow_status**) improve clarity and reporting.

### 2.7 Moderation

**Problem:** Moderation is described in the catalog flow (parser saves → pending_moderation → CRM/Admin approve → active) but the product table has no **moderation_status** column. Rejected products have no explicit state; “pending” might mean “parsing in progress” or “awaiting moderation.” No moderation history (who approved, when, comment).

**Scalability risk:** Moderation queue and analytics need a dedicated status and optional moderation_events table. Without it, “pending” products cannot be distinguished from “draft” or “failed parse.”

### 2.8 Indexing

**Problem:** Products are indexed by status, parsed_at, price_raw, color (and in V2 category_id). Category listing and filter queries join products + product_attributes (and catalog_category_id). No full-text search table or search index described; search may scan title/description. product_photos has (product_id, sort_order). For listing pages (category, search), “product + primary photo + min price” often needs a denormalized listing view or materialized fields (e.g. thumbnail_url, min_price on product) to avoid N+1 and heavy joins.

**Scalability risk:** At 100k–1M products, category and search APIs need either materialized listing rows, a search engine (e.g. Elasticsearch), or very well-designed indexes and query patterns. product_attributes is large; filter queries must use (catalog_category_id, attribute_id, value) and product_id intersection. Without a clear indexing and search strategy, response times degrade.

---

## STEP 3 — DESIGN PRODUCT SYSTEM

### 3.1 Entities and Responsibilities

**products (parent)**

- **Responsibility:** The **catalog item** (one logical product). Shared content and taxonomy; not the sellable SKU when variants exist.
- **Columns (conceptual):** id, external_id (unique, from donor or import), slug (URL-friendly, unique), title, description, category_id (FK catalog_categories), donor_category_id (nullable, FK donor_categories), seller_id (FK sellers), brand_id (nullable, FK brands), status (visibility: active | hidden | excluded | draft), moderation_status (draft | pending_moderation | approved | rejected), is_relevant, source_url, source_link, parsed_at, created_at, updated_at. Optional: meta_title, meta_description, short_description.
- **No price or stock on product** when variants exist; they live on product_variants or product_prices / product_stock. For **single-SKU products** (no variants), price and stock can stay on product for simplicity, or still be in variant (one variant per product).
- **Relationship:** One product has many product_variants (optional); one product has many product_attributes; one product has many product_media (or product_photos). Product belongs to one catalog_category, one seller, zero or one brand.

**product_variants (SKU)**

- **Responsibility:** The **sellable unit**: one row = one SKU (e.g. size 42, color Red). Cart and order reference variant_id. Price and stock are at variant level (or in separate tables keyed by variant_id).
- **Columns (conceptual):** id, product_id (FK products), sku (unique, seller or system SKU), name (optional override, e.g. “Red / 42”), sort_order. Optional: barcode, weight, dimensions. Variant-defining attributes (e.g. size, color) can be stored as JSON or in product_attributes with variant_id scope; or in variant_attributes (variant_id, attribute_id, value).
- **Relationship:** Many variants per product. Orders and cart items reference variant_id. product_prices and product_stock keyed by variant_id (or product_id when no variants).

**product_prices**

- **Responsibility:** **Price** per product or per variant, with optional effective date and currency/list.
- **Columns (conceptual):** id, product_id (FK products), variant_id (nullable, FK product_variants; null = product-level price when no variants), amount (numeric), currency (code), type (list | sale | cost), effective_from, effective_to (optional), created_at, updated_at. Unique (product_id, variant_id, type, effective_from) or similar. For simple case: one row per product or per variant (current price).
- **Relationship:** product_prices.product_id → products; product_prices.variant_id → product_variants. Storefront and cart use “current” price (effective_from ≤ now, effective_to null or ≥ now).

**product_stock**

- **Responsibility:** **Inventory** per variant (or per product if no variants). Quantity available, reserved, and optionally warehouse/seller.
- **Columns (conceptual):** id, product_id (FK products), variant_id (nullable, FK product_variants), quantity_available, quantity_reserved (optional), warehouse_id or location (optional), updated_at. Unique (product_id, variant_id) or (product_id, variant_id, warehouse_id). Decremented on order placement; increased on restock/return.
- **Relationship:** product_stock.variant_id → product_variants; or product_stock.product_id only when product has no variants (single SKU).

**product_media**

- **Responsibility:** **Images and other media** for product or per variant. Replaces or extends product_photos.
- **Columns (conceptual):** id, product_id (FK products), variant_id (nullable, FK product_variants; null = product-level media), type (image | video | 360), url, local_path, sort_order, is_primary, alt_text (optional), created_at, updated_at.
- **Relationship:** product_media.product_id → products; product_media.variant_id → product_variants (optional). Listing page uses product-level primary image (or first variant image); PDP shows product and variant images.

**product_attributes**

- **Responsibility:** **Normalized attributes** (from ATTRIBUTE_ENGINE_ARCHITECTURE). Can be product-level or variant-level depending on design.
- **Columns (conceptual):** product_id, attribute_id, value, catalog_category_id (denormalized), variant_id (nullable; if set, attribute applies to variant, e.g. size/color); raw_value, confidence, source. When variant_id is null, attribute applies to product (e.g. material, brand). When variant_id is set, attribute applies to that variant (e.g. size=42, color=Red).
- **Relationship:** product_attributes.product_id → products; product_attributes.variant_id → product_variants (optional); product_attributes.attribute_id → attributes. Filters and facets use product_attributes (and optionally restrict to product-level or include variant-level for “filter by size/color”).

**product_status (or split status columns)**

- **Responsibility:** Clear **visibility** and **workflow** state. Not a separate table if two columns suffice.
- **visibility_status:** active | hidden | excluded. Drives “show on storefront.” Admin can set hidden without changing moderation.
- **moderation_status:** draft | pending_moderation | approved | rejected. Parser sets pending_moderation; CRM/Admin sets approved or rejected. Only approved and visibility active → visible in catalog. Optional: **moderation_events** (product_id, from_status, to_status, user_id, comment, created_at) for audit.
- **Relationship:** Stored on products table (visibility_status, moderation_status) or in a small product_status table (product_id, visibility_status, moderation_status, updated_at).

### 3.2 Relationships (Diagram)

```
catalog_categories     donor_categories
        │                      │
        ▼                      ▼
    products ◄───────────────── (category_id, donor_category_id)
        │
        ├──► sellers (seller_id)
        ├──► brands (brand_id)
        │
        ├──► product_variants (1 : N)  ──► product_prices (variant_id)
        │                              ──► product_stock (variant_id)
        │                              ──► product_attributes (variant_id optional)
        │                              ──► product_media (variant_id optional)
        │
        ├──► product_attributes (product_id, variant_id nullable)
        ├──► product_media (product_id, variant_id nullable)
        ├──► product_raw_attributes (product_id)
        ├──► product_prices (product_id, variant_id nullable)
        └──► product_stock (product_id, variant_id nullable)
```

### 3.3 Single-SKU vs Multi-Variant

- **Single-SKU product:** No rows in product_variants (or one row per product for uniformity). price and stock on product or in product_prices/product_stock with variant_id null. product_attributes and product_media have variant_id null. Suits simple catalog and parser output that has no size/color matrix.
- **Multi-variant product:** product_variants rows (e.g. Red/S, Red/M, Blue/S, Blue/M). product_prices and product_stock per variant_id. product_attributes for variant-level attributes (size, color) keyed by variant_id; product-level attributes (material, brand) by product_id only. product_media can have variant_id for “image for Red.” Cart and order line reference variant_id. Parser may create one product and one variant per parsed row, or a job may group by external_id and create variants from attributes (size, color).

### 3.4 Brands and Sellers (Unchanged in Scope)

- **products.seller_id** → sellers. One product has one seller (listing owner). If multi-seller offers are needed later, add product_offers (product_id, seller_id, variant_id, price, stock, status).
- **products.brand_id** → brands. One product has zero or one brand. brand_categories (brand_id, catalog_category_id) for marketplace taxonomy.
- **categories:** product.category_id → catalog_categories; product.donor_category_id → donor_categories. As in CATALOG_ARCHITECTURE_V2.

---

## STEP 4 — PARSER INTEGRATION

### 4.1 Flow: Parser → Raw → Normalization → Moderation → Active

**Stage 1 — Parser output (raw product)**

- Parser produces: external_id, source_url, title, description, raw price string and numeric, donor_category_slug, seller link, brand (if any), list of characteristics (key-value), list of photo URLs. Optional: size/color from donor page. Parser does **not** create variants; it outputs one “row” per donor listing (which may later become one product with one variant, or one product with many variants after grouping).

**Stage 2 — Resolve category and seller**

- donor_category_slug → donor_category_id (donor_categories). donor_category_id → catalog_category_id (category_mapping). Resolve seller link → seller_id (sellers). Resolve brand → brand_id (brands). As in CATALOG_ARCHITECTURE_V2.

**Stage 3 — Upsert product (raw)**

- Upsert **products** by external_id: set title, description, source_url, category_id (catalog), donor_category_id, seller_id, brand_id; set **moderation_status = pending_moderation**, **visibility_status = draft** (or hidden) so product is not visible yet. Do not set price on product if using product_prices; or set a single price on product for single-SKU. Write **product_raw_attributes** from characteristics. Create **product_media** rows (product_id, variant_id null, url from parser, sort_order, is_primary). If no variants, create one **product_variant** (product_id, sku = external_id or generated) and one **product_prices** row (product_id, variant_id, amount from parser). Optional: one **product_stock** row (variant_id, quantity_available = 0 or unknown) until inventory is provided.

**Stage 4 — Attribute normalization**

- Run attribute engine on product_raw_attributes: key mapping → canonical/synonym → write **product_attributes** (product_id, attribute_id, value, catalog_category_id; variant_id null for product-level). As in ATTRIBUTE_ENGINE_ARCHITECTURE. If variant-level attributes (e.g. size, color) exist and variants are created from them, assign (variant_id, attribute_id, value) in product_attributes.

**Stage 5 — Product saved (pending)**

- Product exists with moderation_status = pending_moderation. Not visible on storefront (visibility_status draft/hidden or filter by moderation_status = approved). Optional: photo download job fills local_path in product_media.

**Stage 6 — Moderation (CRM / Admin)**

- Moderator lists products where moderation_status = pending_moderation. Reviews title, description, attributes, media. Actions: **Approve** → set moderation_status = approved; optionally set visibility_status = active. **Reject** → set moderation_status = rejected; product stays hidden. **Edit** → fix data then approve. Optional: moderation_events log.

**Stage 7 — Active product**

- Product with moderation_status = approved and visibility_status = active is included in category listing, search, and filters. product_attributes and category_attribute_schema drive filters; product_media and product_prices drive PDP and cart.

### 4.2 Re-parse and Updates

- When parser runs again for same external_id, **upsert product**: update title, description, category_id (if mapping changed), product_raw_attributes, product_media. Re-run attribute normalization → update product_attributes. Optionally: if moderation_status was approved, keep it approved (trust re-parse) or set back to pending_moderation (require re-approval). Price and stock updates can be part of same pipeline or separate feed.

### 4.3 Variants from Parser (Optional)

- If donor lists “same product” in multiple sizes/colors as separate pages, each has its own external_id → one product per page (current behavior). To **group** into one product with variants: (1) define grouping key (e.g. external_id base without size/color suffix, or title + seller), (2) after parsing, job groups rows by key, creates one product and N product_variants from size/color attributes, (3) product_prices and product_stock per variant from parsed rows. Grouping is heuristic or donor-specific; not required for initial product architecture.

---

## STEP 5 — FINAL DOCUMENT (Summary)

### 5.1 Table Summary

| Table | Purpose |
|-------|---------|
| **products** | Parent catalog item: identity, title, description, category_id (catalog), donor_category_id, seller_id, brand_id, visibility_status, moderation_status. No price/stock when variants exist. |
| **product_variants** | Sellable SKU: product_id, sku, optional name/sort_order. Cart and order reference variant_id. |
| **product_prices** | Price per product or variant: product_id, variant_id (nullable), amount, currency, type (list/sale), effective dates. |
| **product_stock** | Inventory per product or variant: product_id, variant_id (nullable), quantity_available, quantity_reserved. |
| **product_media** | Images/video: product_id, variant_id (nullable), type, url, local_path, sort_order, is_primary. |
| **product_attributes** | Normalized attributes: product_id, attribute_id, value, catalog_category_id, variant_id (nullable). |
| **product_raw_attributes** | Raw key-value from parser; input for attribute normalization. |
| **product_status** | Optional: visibility_status and moderation_status on products table or separate table; optional moderation_events. |

### 5.2 Current vs Designed

- **Current:** One product row = one listing; price/color/size on product or as attributes; no variants; no stock; no moderation_status column; media in product_photos.
- **Designed:** products = parent; product_variants = SKUs when needed; product_prices and product_stock for price and inventory; product_media for media with optional variant_id; product_attributes with optional variant_id; visibility_status and moderation_status for status and moderation; parser flow explicit from raw → normalization → moderation → active.

### 5.3 Dependencies

- **CATALOG_ARCHITECTURE_V2:** category_id and donor_category_id on products; category_mapping for parser; catalog_categories and donor_categories.
- **ATTRIBUTE_ENGINE_ARCHITECTURE:** product_attributes and product_raw_attributes; normalization pipeline; category_attribute_schema (catalog_category_id, attribute_id).

### 5.4 Scalability and Indexing

- **products:** Index (category_id, visibility_status, moderation_status), (seller_id), (brand_id), (parsed_at). Optional: full-text or search index on title/description.
- **product_variants:** Index (product_id), unique (sku).
- **product_prices:** Index (product_id, variant_id), (effective_from, effective_to) for current price.
- **product_stock:** Index (product_id, variant_id) or (variant_id).
- **product_media:** Index (product_id, variant_id, sort_order); covering index for (product_id, is_primary) for listing thumbnails.
- **product_attributes:** Index (catalog_category_id, attribute_id, value), (product_id, attribute_id), (variant_id, attribute_id) if variant-level. As in ATTRIBUTE_ENGINE_ARCHITECTURE; optional materialized facets.

---

*End of Product Architecture.*

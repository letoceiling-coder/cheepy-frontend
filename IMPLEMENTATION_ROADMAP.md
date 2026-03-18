# Implementation Roadmap

**Document type:** Architecture planning — order of implementation for the platform (no code)  
**Audience:** Architects, product and engineering leads, project managers  
**Context:** Aligns with PLATFORM_MASTER_ARCHITECTURE.md, CATALOG_ARCHITECTURE_V2.md, ATTRIBUTE_ENGINE_ARCHITECTURE.md, PRODUCT_ARCHITECTURE.md, ORDER_SYSTEM_ARCHITECTURE.md, API_ARCHITECTURE.md, and INFRASTRUCTURE_ARCHITECTURE.md. Defines implementation principles and phased development from core catalog through CMS and CRM.

---

## STEP 1 — IMPLEMENTATION PRINCIPLES

### 1.1 Incremental development

- **Principle:** The platform is built in **small, shippable steps**. Each phase delivers a coherent set of entities and behaviors that can be tested and optionally exposed (e.g. read-only or behind feature flag) without waiting for the full system. No “big bang” release of catalog + attributes + products + orders + payments in one go.
- **Application:** Phases are ordered by **dependency**: catalog and mapping before products; products and variants before cart and orders; orders and payments before seller balance and payouts; event system and workers after core transactional data exists. Within a phase, implement tables and APIs in dependency order (e.g. catalog_categories before category_mapping). Each phase has a **clear outcome** (e.g. “storefront can browse catalog and products by category”) so that progress is measurable and rollback is bounded.

### 1.2 Domain isolation

- **Principle:** **Domain boundaries** from PLATFORM_MASTER_ARCHITECTURE are respected during implementation. Catalog (donor_categories, catalog_categories, category_mapping) is implemented and tested as a unit; attribute engine (attributes, attribute_values, mapping, product_attributes, product_raw_attributes) is a separate unit that **depends on** catalog; product (products, variants, prices, stock, media) depends on catalog and optionally attribute engine; order (cart, orders, payments) depends on product; delivery and financial depend on order. Cross-domain integration (e.g. “payment_captured → credit seller_balance”) is introduced only when both domains exist.
- **Application:** Avoid implementing “a bit of order and a bit of payment” in the same sprint without a clear boundary. Prefer **vertical slices** per phase: e.g. Phase 1 = catalog domain only (tables, minimal API or admin-only API, no storefront product listing until Phase 2 or 3). This reduces merge conflicts, clarifies ownership, and keeps each phase testable in isolation.

### 1.3 Testability

- **Principle:** Each phase is **testable** in isolation and in integration. Unit tests cover domain logic (e.g. category_mapping resolution, attribute normalization, price snapshot at order creation). Integration tests cover API contracts (e.g. public_api returns only approved products; buyer_api cart is scoped to user). End-to-end tests for critical flows (e.g. add to cart → checkout → order created) are added when the flow is implemented. **Testability** influences design: avoid hidden global state; expose clear inputs and outputs; use interfaces or seams for external services (payment gateway, email) so they can be stubbed.
- **Application:** Define **acceptance criteria** per phase (e.g. “category_mapping returns catalog_category_id for a given donor_category_id”; “order_items.unit_price equals product_prices at checkout time”). Automated tests (and optional manual QA) verify these before the phase is considered done. Observability hooks (metrics, structured logs) are part of implementation so that production behavior can be verified without code changes.

### 1.4 Backward compatibility

- **Principle:** **Existing clients and data** remain valid across phases. Schema changes (new columns, new tables) are **additive** where possible: new nullable columns, new tables with foreign keys to existing tables. Breaking changes (renaming column, removing column, changing type) require a **migration path**: deprecation period, dual-write, then cutover; or a one-time migration with downtime if acceptable. API versioning (e.g. /api/v1/) allows introducing new behavior in a new version while keeping v1 stable.
- **Application:** When introducing product_variants, existing products may have no variants (single “default” variant or product-level price/stock) so that current product_id-based cart and orders can be extended with optional variant_id. When introducing catalog_categories and category_mapping, existing “categories” or product.category_id can be migrated to catalog_categories and mapping so that parser and storefront continue to work after migration. Document **deprecations** (e.g. “product.price deprecated in favor of product_prices”) and remove only after clients and jobs are updated.

---

## STEP 2 — PHASE 1 (CORE CATALOG)

### 2.1 Goal

Implement the **dual category system** and core product placement: catalog_categories (marketplace taxonomy), donor_categories (parser-owned tree), category_mapping (donor → catalog), plus products, brands, and sellers. Storefront and admin can browse and manage catalog and products by **catalog** category; parser does **not** yet write products until mapping exists.

### 2.2 Entities and order

1. **catalog_categories** — Marketplace taxonomy: id, parent_id, slug, name, sort_order, icon, is_visible, meta fields. Tree structure for storefront and admin. No parser-specific columns.
2. **donor_categories** — Parser-owned tree: id, external_slug (donor_slug), name, parent_id, source_url, sort_order, optional donor_menu_path, last_synced_at. Used only by parser and mapping.
3. **category_mapping** — Links donor → catalog: donor_category_id (FK donor_categories), catalog_category_id (FK catalog_categories). Unique on donor_category_id. Enables “parsed product from donor category X” → “place in catalog category Y.”
4. **brands** — id, name, slug, logo_url, status, optional SEO. Referenced by products.
5. **sellers** — id, slug, name, source_url, pavilion, contacts, status, is_verified, products_count, last_parsed_at. Referenced by products.
6. **products** — Core product entity: id, external_id, title, description, category_id (FK catalog_categories), donor_category_id (nullable, FK donor_categories), seller_id (FK sellers), brand_id (nullable, FK brands), status, visibility, moderation_status, parsed_at, created_at, updated_at. Product is placed in **catalog** category only for storefront; donor_category_id is for traceability.

### 2.3 Parser integration rule

- **Parser integration must be disabled until mapping exists.** Until category_mapping is populated (at least for the donor categories that will be parsed), the parser must not create or update products in a way that assigns category_id. Options: (a) Parser is not run at all; (b) Parser runs and writes only to donor_categories and optionally to a staging table; (c) Parser runs but product insert/update requires a valid mapping for donor_category_id → catalog_category_id, and fails or skips if no mapping. Recommendation: (c) with clear logging so that unmapped donor categories are visible and can be mapped by admin. This prevents products from appearing in “unknown” or wrong catalog categories and enforces the rule that **marketplace taxonomy is never driven by parser alone**.

### 2.4 Outcomes

- Admin can create and edit catalog_categories (tree) and category_mapping (donor → catalog).
- Products reference catalog_categories and sellers/brands; storefront (or read-only API) can list products by catalog category.
- Parser can sync donor_categories; when parser is enabled for products, mapping must exist for each donor category used.

---

## STEP 3 — PHASE 2 (ATTRIBUTE ENGINE)

### 3.1 Goal

Implement the **attribute normalization and schema** layer: global attributes and values, key mapping from donor keys to attributes, product_attributes (normalized) and product_raw_attributes (raw staging). Category-level attribute schema (category_attribute_schema) can be added in this phase or early in Phase 3 so that filters and PDP know which attributes apply per category.

### 3.2 Entities and order

1. **attributes** — Global registry: id, key (unique), display_name, data_type, unit, searchable, filterable. Referenced by mapping, schema, and product_attributes.
2. **attribute_values** — Canonical values per attribute: id, attribute_id, value, sort_order, display_label. Optional but recommended for enum-like attributes (e.g. color, size).
3. **attribute_key_mapping** — donor_key (normalized) → attribute_id. Parser raw keys (e.g. “цвет”, “Color”) map to one attribute.
4. **product_raw_attributes** — Staging: product_id, source (parser), attr_key (raw), attr_value (raw). Immutable “what the donor said”; enables re-normalization without re-parse.
5. **product_attributes** — Normalized output: product_id, attribute_id, value, catalog_category_id (denormalized from product.category_id), optional raw_value, source (parser | manual). Used for filters, facets, search, PDP.
6. **category_attribute_schema** — (catalog_category_id, attribute_id, required, display_order, filter_order, filter_type, is_filterable, is_searchable). Defines which attributes apply to each catalog category. Depends on catalog_categories and attributes.

Optional for this phase: **attribute_synonyms** and **attribute_canonical** for value normalization (e.g. “red” → “Красный”). If not implemented in Phase 2, product_attributes can store cleaned raw value until synonyms/canonical are added.

### 3.3 Outcomes

- Parser (or manual input) can write raw key-value to product_raw_attributes.
- Normalization pipeline: key mapping → attribute_id; value cleanup and optional canonical/synonym → product_attributes.
- category_attribute_schema defines filterable and display attributes per catalog category. Storefront and search can use product_attributes for filters and PDP.

---

## STEP 4 — PHASE 3 (PRODUCT VARIANTS)

### 4.1 Goal

Introduce **sellable SKUs** (product_variants) and **variant-level** (or product-level) price, stock, and media. Cart and orders will reference variant_id (or product_id when no variants). PRODUCT_ARCHITECTURE: one product (parent) with shared content; many product_variants with optional variant-level price, stock, and media.

### 4.2 Entities and order

1. **product_variants** — SKU level: id, product_id (FK products), sku (unique per seller or global), name/slug optional, sort_order. Optional variant-level attributes (e.g. size, color) can be stored as JSON or in product_attributes with variant_id if the attribute engine supports it.
2. **product_prices** — Price per product or variant: product_id, variant_id (nullable), amount, currency, valid_from/valid_to optional. At least one row per sellable unit (product or variant). Used at cart and checkout to resolve current price; order_items snapshot unit_price at order creation.
3. **product_stock** — Inventory: product_id, variant_id (nullable), quantity_available, quantity_reserved optional. Checkout and order creation decrement quantity_available and optionally manage reservation.
4. **product_media** — Images (and optional video): product_id, variant_id (nullable), url or storage_key, type (image | video), is_primary, sort_order. Replaces or extends product_photos; variant_id allows variant-specific images.

### 4.3 Backward compatibility

- Products that today have no variants: create one “default” variant per product, or allow variant_id nullable in cart_items and order_items and resolve price/stock from product-level product_prices and product_stock. This allows existing product_id-only flows to keep working while new flows use variant_id.

### 4.4 Outcomes

- Cart and order_items can reference variant_id; price and stock are resolved from product_prices and product_stock.
- Storefront PDP shows variants (e.g. size/color) and variant-level price, stock, and images.
- Parser or admin can create variants and set price and stock per variant.

---

## STEP 5 — PHASE 4 (ORDERS)

### 5.1 Goal

Implement **cart, checkout, orders, order_items, order status, and payments** so that a buyer can add items to cart, place an order, and pay via gateway. ORDER_SYSTEM_ARCHITECTURE: cart and cart_items (user or session); orders and order_items with unit_price snapshot; order_status; payments and payment_transactions (capture, refund).

### 5.2 Entities and order

1. **cart** — One per buyer or guest: id, user_id (nullable), session_id (nullable), guest_token (nullable), currency, created_at, updated_at.
2. **cart_items** — cart_id, product_id, variant_id (nullable), quantity. Optional snapshot columns for display (unit_price_snapshot, product_title_snapshot).
3. **orders** — order_number, buyer_user_id (nullable), buyer_guest_email (nullable), status, currency, subtotal, delivery_amount, discount_amount, total, paid_at (nullable), created_at, updated_at. Optional: shipping address fields or FK to delivery.
4. **order_items** — order_id, product_id, variant_id (nullable), seller_id (denormalized), quantity, unit_price (snapshot at order time), total_price, product_title_snapshot, variant_name_snapshot.
5. **order_status** — Status lifecycle (created, paid, processing, shipped, delivered, cancelled, etc.). orders.status_id or orders.status references this; optional order_status_history for audit.
6. **payments** — order_id, amount, currency, method, status (pending, captured, failed, etc.), gateway_name, gateway_payment_id, captured_at (nullable).
7. **payment_transactions** — payment_id, type (authorize, capture, refund), amount, status, gateway_transaction_id, created_at. Immutable log of money movements.

### 5.3 Integration

- Checkout flow: validate cart (price, stock, availability); create order and order_items with unit_price from product_prices; create payment (pending); redirect or call gateway; on webhook “capture success” update payment and order status, decrement product_stock. Payment gateway integration and webhook verification are part of this phase (SECURITY_ARCHITECTURE: no card storage, webhook verification).

### 5.4 Outcomes

- Buyer can add to cart (product_id + variant_id + quantity), view cart, and place order.
- Order is created with snapshotted prices; payment is linked to order; gateway capture and webhook update payment and order status.
- Stock is decremented (and optionally reserved then confirmed) at order creation or payment capture.

---

## STEP 6 — PHASE 5 (DELIVERY)

### 6.1 Goal

Implement **shipments** (one per seller per order), **shipment_items**, **delivery_methods**, and **delivery_rates** so that fulfillment and shipping cost calculation are supported. Aligns with DELIVERY_SYSTEM_ARCHITECTURE: multi-seller split; shipments and shipment_items; delivery_methods and delivery_rates for storefront and admin.

### 6.2 Entities and order

1. **delivery_methods** — id, name, code, carrier_name (optional), is_active. Used by storefront and checkout to show shipping options.
2. **delivery_rates** — method_id, shipping_zone or criteria (weight, total), cost, currency. Checkout uses this to compute delivery_amount.
3. **shipments** — order_id, seller_id, status (created, packed, shipped, in_transit, delivered), tracking_code (nullable), carrier_name (nullable), shipped_at (nullable), delivered_at (nullable). One row per seller per order when order is paid (or at order creation).
4. **shipment_items** — shipment_id, order_item_id (FK order_items), quantity. Links shipment to order lines for that seller.

Optional: **shipping_zones** (region/country/zip) and **tracking_updates** (per shipment, status and timestamp from carrier or manual). Can be added in this phase or in a follow-up.

### 6.3 Integration

- After payment_captured (or at order creation), create one shipment per distinct seller_id in order_items; shipment_items reference the corresponding order_items for that seller. Seller dashboard and admin can update shipment status and tracking_code.

### 6.4 Outcomes

- Checkout can display delivery methods and rates; order stores delivery_amount and optional shipping address.
- Shipments are created per seller; seller (or admin) can mark shipped and set tracking; buyer can see shipments and tracking for the order.

---

## STEP 7 — PHASE 6 (MARKETPLACE FINANCIALS)

### 7.1 Goal

Implement **seller balance**, **seller_transactions**, **commission_rules**, and **payout_requests** so that the platform can credit sellers on payment capture, deduct commission, and process payouts. Aligns with MARKETPLACE_FINANCIAL_ARCHITECTURE (seller_balance, commission_rules, payouts).

### 7.2 Entities and order

1. **seller_balance** — seller_id, balance (available), optional pending_balance (e.g. hold until delivery). Updated when payment is captured (credit), refund (debit), or payout (debit).
2. **seller_transactions** — Immutable ledger: seller_id, type (credit | debit), amount, currency, reference_type (order | refund | payout | commission), reference_id (order_id or payout_request_id), balance_after (optional), created_at.
3. **commission_rules** — How platform commission is computed per order or order_item (e.g. percent, fixed, tier by category or seller). platform_commissions (per order_item or order) can be implemented in this phase: order_id, order_item_id (optional), seller_id, commission_amount, rule_id.
4. **payout_requests** — seller_id, amount, currency, status (pending, approved, processing, completed, rejected), requested_at, processed_at (nullable). Optional: payout_batches (batch of payout_requests); seller_wallets (payout destination: bank or wallet).

### 7.3 Integration

- On **payment_captured** event (or in payment webhook handler): for each order_item, compute seller net (unit_price * quantity − commission); credit seller_balance; insert seller_transactions (credit); insert platform_commissions. On **refund**: debit seller_balance and insert seller_transaction (debit). Payout: seller requests payout; admin approves; payout_requests status updated; on completion debit seller_balance and insert seller_transaction (debit). Event system (Phase 7) can drive these actions; if events are not yet implemented, payment webhook handler can call balance and transaction logic directly.

### 7.4 Outcomes

- Seller balance increases on payment capture (after commission); decreases on refund and payout.
- Admin can configure commission_rules and approve payout_requests; sellers can view balance and request payouts (seller_api).

---

## STEP 8 — PHASE 7 (PLATFORM SYSTEMS)

### 8.1 Goal

Implement **event system**, **queue workers**, **search indexing**, and **observability hooks** so that the platform runs asynchronously, scales via workers, and is observable. Aligns with PLATFORM_EVENT_ARCHITECTURE, INFRASTRUCTURE_ARCHITECTURE, and OBSERVABILITY_ARCHITECTURE.

### 8.2 Event system

- **domain_events** — Append-only log: event_type, event_version, payload, occurred_at, optional aggregate_id, correlation_id.
- **event_subscribers** — Registry: which subscribers listen to which event_type; is_active.
- **event_handlers** — Binding: subscriber_id, handler_type (class | queue), handler_target (e.g. queue name or class). Optional **event_deliveries** (event_id, subscriber_id, status) for idempotency and monitoring.
- **Flow:** Application writes to domain_events; dispatcher (cron or job) reads new events and enqueues handler jobs per subscriber. Workers run handlers (e.g. send email, credit seller_balance, update search index). Handlers must be idempotent (event_id + subscriber_id).

### 8.3 Queue workers

- **jobs** — queue, job_type, payload, status (pending, reserved, processing, completed, failed), priority, attempts, max_attempts, available_at, reserved_at, completed_at.
- **job_attempts** — job_id, attempt_number, started_at, finished_at, status, error_message. History per attempt.
- **job_failures** — Permanent failures (job_id, queue, job_type, payload, exception_message, failed_at). For replay and audit.
- **Workers:** Parser worker (queue parser), event worker (queue events), email worker (queue email). Workers reserve job, run handler, update status and job_attempts; on final failure move to job_failures. **Scheduler** enqueues jobs on schedule (e.g. event dispatcher every N minutes).

### 8.4 Search indexing

- **Product search index** — Documents keyed by product_id (and optionally variant_id): title, description, category_id, catalog_category_slug, seller_id, brand_id, price (min or variant), attributes (from product_attributes), visibility and moderation_status. Update on product create/update/delete and when moderation_status → approved. Can be synchronous in API or **async via job** (e.g. IndexProductJob enqueued on product_updated event). Search API (public_api) queries index with q, category, filters, sort, pagination; returns product ids; full product loaded from DB or cache.
- **Filter facets** — From search engine aggregations (recommended) or materialized table/cache updated by job. INFRASTRUCTURE_ARCHITECTURE: search index and filter index.

### 8.5 Observability hooks

- **Structured logging** — request_id, component, level, message, duration_ms; no secrets or PII. Centralized log shipping (or direct to aggregation).
- **Metrics** — API latency and error rate; queue size and job completion/failure rate; worker liveness; optional order and payment metrics. Expose in standard format (e.g. Prometheus); scrape or push to time-series store.
- **Tracing** — trace_id propagation in API and job payload; spans for request, DB, external call, job execution. Optional: send to tracing backend.
- **Alerts and dashboards** — Define alerts (API failure, worker failure, queue backlog, payment failure) and dashboards (platform health, orders, payments, queues) per OBSERVABILITY_ARCHITECTURE.

### 8.6 Outcomes

- Domain events (order_created, payment_captured, etc.) are stored and dispatched to subscribers; handlers run in workers (email, balance, search index).
- Jobs table and workers process parser, event, and email queues; job_attempts and job_failures support debugging and replay.
- Search index is updated on product changes; public_api search and listing use the index.
- Logs, metrics, and optional traces are produced and available for alerting and dashboards.

---

## STEP 9 — PHASE 8 (CMS + CRM)

### 9.1 Goal

Implement **pages and page_blocks** (CMS) and **CRM tasks and moderation queues** so that the platform can serve dynamic content and support moderation and support workflows. Aligns with CMS_CONTENT_ARCHITECTURE and CRM_OPERATION_ARCHITECTURE.

### 9.2 CMS

- **pages** — id, page_key (unique), title, slug (optional), status (draft | published), published_at (nullable), created_at, updated_at. Optional: page_versions for history.
- **page_blocks** — page_id, block_type, position/sort_order, payload (JSON: content, image, link, etc.). Storefront and public_api load published page and blocks by page_key; constructor or admin edits blocks and publishes.
- Optional: **menus** (menu_key, items JSON or tree), **banners** (placement, page_key, image, link, active_from, active_to). Can be part of this phase or a follow-up.

### 9.3 CRM

- **crm_tasks** — id, assignee_id (user_id), customer_id or order_id or seller_id (context), type (e.g. follow_up, refund, moderation), status, due_at, created_at, updated_at. Used by support and CRM operators.
- **moderation queues** — **product_moderation_queue** (or product.moderation_status + list “pending_moderation”): product_id, status (pending | approved | rejected), assigned_to (optional), reviewed_at, reviewer_id. **seller_verification_queue** (or seller_verification status): seller_id, status (pending | verified | rejected), documents, assigned_to, reviewed_at. CRM and admin list and act on these queues; product moderation feeds into product visibility (only approved in storefront); seller verification feeds into payout eligibility (IDENTITY_SYSTEM_ARCHITECTURE, MARKETPLACE_FINANCIAL_ARCHITECTURE).

Optional: **crm_notes** (entity_type, entity_id, user_id, body, created_at), **crm_customers** (view over users/orders for support), **reports** (sales_reports, seller_reports, product_reports — aggregated tables or views). Can be added in this phase or later.

### 9.4 Outcomes

- Storefront can render CMS pages (home, landing, category) from pages and page_blocks; admin can edit and publish.
- CRM and support can manage tasks and work product/seller moderation queues; approved products appear in storefront; verified sellers can request payouts.

---

## STEP 10 — FINAL ROADMAP

### 10.1 Development roadmap (phases)

| Phase | Name | Main deliverables | Depends on |
|-------|------|-------------------|------------|
| **1** | Core catalog | catalog_categories, donor_categories, category_mapping, products, brands, sellers. Parser disabled until mapping exists. | — |
| **2** | Attribute engine | attributes, attribute_values, attribute_key_mapping, product_attributes, product_raw_attributes; category_attribute_schema. | Phase 1 |
| **3** | Product variants | product_variants, product_prices, product_stock, product_media. | Phase 1, 2 |
| **4** | Orders | cart, cart_items, orders, order_items, order_status, payments, payment_transactions. Checkout and gateway integration. | Phase 3 |
| **5** | Delivery | delivery_methods, delivery_rates, shipments, shipment_items. | Phase 4 |
| **6** | Marketplace financials | seller_balance, seller_transactions, commission_rules, platform_commissions, payout_requests (and optional seller_wallets, payout_batches). | Phase 4, 5 |
| **7** | Platform systems | domain_events, event_subscribers, event_handlers; jobs, job_attempts, job_failures; parser, event, email workers; scheduler; search index and filter facets; observability (logs, metrics, alerts, dashboards). | Phase 1–6 |
| **8** | CMS + CRM | pages, page_blocks; crm_tasks; product and seller moderation queues. Optional: menus, banners, crm_notes, reports. | Phase 1–7 |

### 10.2 Dependency summary

- **Phase 1** is the foundation: catalog and products must exist before attributes, variants, or orders.
- **Phase 2** (attribute engine) depends on catalog_categories and products; can run in parallel with early Phase 3 if product_attributes and product_raw_attributes are the only product dependencies.
- **Phase 3** (variants, prices, stock, media) depends on products (Phase 1); full attribute schema (Phase 2) supports filterable variants.
- **Phase 4** (orders) depends on product and variant (Phase 3) for cart and order_items; identity (users, sessions) is assumed to exist (may be implemented before or with Phase 4).
- **Phase 5** (delivery) depends on orders and order_items (Phase 4).
- **Phase 6** (financials) depends on orders and payments (Phase 4) and optionally shipments (Phase 5) if balance is held until delivery.
- **Phase 7** (events, workers, search, observability) depends on all prior phases for meaningful events and search content; can be started once orders and products are in place.
- **Phase 8** (CMS, CRM) depends on products, orders, and identity; moderation queues and tasks are operational once Phase 7 (workers) and Phase 6 (payouts) exist.

### 10.3 Principles applied

- **Incremental:** Each phase is shippable and testable; no big bang.
- **Domain isolation:** Catalog, attribute, product, order, delivery, financial, event, and CMS/CRM are implemented in bounded phases with clear interfaces.
- **Testability:** Acceptance criteria and tests per phase; observability hooks in Phase 7 support production verification.
- **Backward compatibility:** Additive schema and optional variant_id; parser gated by mapping; API versioning for future changes.

### 10.4 Alignment with architecture docs

- **PLATFORM_MASTER_ARCHITECTURE:** Phases cover catalog, attribute engine, product, order, financial, delivery, events, infrastructure, CMS, and CRM subsystems.
- **CATALOG_ARCHITECTURE_V2:** Phase 1 implements donor_categories, catalog_categories, category_mapping; products reference catalog_categories.
- **ATTRIBUTE_ENGINE_ARCHITECTURE:** Phase 2 implements attributes, attribute_values, attribute_key_mapping, product_attributes, product_raw_attributes, category_attribute_schema.
- **PRODUCT_ARCHITECTURE:** Phase 3 implements product_variants, product_prices, product_stock, product_media.
- **ORDER_SYSTEM_ARCHITECTURE:** Phase 4 and 5 implement cart, orders, payments, shipments; Phase 6 implements seller balance and payouts.
- **API_ARCHITECTURE:** API domains (public, buyer, seller, admin, crm, internal) are implemented incrementally as each phase exposes new capabilities (e.g. public_api catalog in Phase 1, buyer_api cart in Phase 4).
- **INFRASTRUCTURE_ARCHITECTURE:** Phase 7 implements jobs, workers, schedulers, search index, and cache usage; observability aligns with OBSERVABILITY_ARCHITECTURE.

---

*End of Implementation Roadmap.*
